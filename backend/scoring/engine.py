"""
Threat scoring — PRD Section 8.8.

Weighted fusion of five signal families, each normalized to 0-100. Every
contribution is stored with its reasons — the PRD is explicit that the
system must "never expose only a black-box number" (8.8) and that
deterministic evidence and ML evidence must be "visually separated" (15).
"""
from dataclasses import dataclass, field
from typing import List, Dict

WEIGHTS = {
    "authentication_anomalies": 0.25,
    "header_routing_anomalies": 0.20,
    "sender_domain_url_indicators": 0.20,
    "nlp_ml_threat_probability": 0.25,
    "threat_intelligence_reputation": 0.10,
}

CATEGORY_THRESHOLDS = [
    (80, "phishing_or_fraud"),
    (60, "impersonated"),
    (35, "suspicious"),
    (0, "legitimate"),
]


@dataclass
class SignalContribution:
    family: str
    weight: float
    raw_score_0_100: float
    weighted_contribution: float
    reasons: List[str] = field(default_factory=list)
    device: str = "cpu"


@dataclass
class ThreatScoreResult:
    final_score: float
    category: str
    confidence: str
    contributions: List[SignalContribution]
    limitations: List[str]


def _score_authentication(auth_check: dict) -> SignalContribution:
    reasons = []
    score = 0.0
    header_results = {r["mechanism"]: r["result"] for r in auth_check.get("header_results", [])}

    for mech in ("spf", "dkim", "dmarc"):
        result = header_results.get(mech, "NONE")
        if result == "FAIL":
            score += 30
            reasons.append(f"{mech.upper()} = FAIL")
        elif result in ("NONE", "ERROR", "TEMPERROR", "PERMERROR"):
            score += 15
            reasons.append(f"{mech.upper()} = {result} (not asserted/verifiable)")
        elif result == "SOFTFAIL":
            score += 20
            reasons.append("SPF = SOFTFAIL")
        # PASS contributes 0

    if not auth_check.get("alignment", {}).get("aligned", True):
        score += 10
        reasons.extend(auth_check["alignment"].get("notes", []))

    score = min(score, 100)
    if not reasons:
        reasons.append("All available authentication checks passed")

    return SignalContribution(
        family="authentication_anomalies",
        weight=WEIGHTS["authentication_anomalies"],
        raw_score_0_100=score,
        weighted_contribution=score * WEIGHTS["authentication_anomalies"],
        reasons=reasons,
    )


def _score_header_routing(hops: list, mismatch_findings: list) -> SignalContribution:
    reasons = []
    score = 0.0

    untrusted_hops = [h for h in hops if h.trust_level == "untrusted"]
    if len(untrusted_hops) > 3:
        score += 15
        reasons.append(f"{len(untrusted_hops)} untrusted relay hops in chain")

    for finding in mismatch_findings:
        severity_points = {"low": 10, "medium": 20, "high": 35}
        score += severity_points.get(finding["severity"], 10)
        reasons.append(finding["detail"])

    score = min(score, 100)
    if not reasons:
        reasons.append("No header/routing anomalies detected")

    return SignalContribution(
        family="header_routing_anomalies",
        weight=WEIGHTS["header_routing_anomalies"],
        raw_score_0_100=score,
        weighted_contribution=score * WEIGHTS["header_routing_anomalies"],
        reasons=reasons,
    )


def _score_sender_domain_url(indicators: dict) -> SignalContribution:
    reasons = []
    score = 0.0

    severity_points = {"low": 5, "medium": 15, "high": 30}

    for url_finding in indicators.get("urls", []):
        if url_finding["severity"] != "low":
            score += severity_points[url_finding["severity"]]
            reasons.append(f"Suspicious URL pattern: {url_finding['url'][:80]}")

    for lookalike in indicators.get("lookalike_domains", []):
        score += severity_points.get(lookalike["severity"], 15)
        reasons.append(
            f"Domain '{lookalike['candidate_domain']}' is a lookalike of "
            f"'{lookalike['protected_domain']}' (edit distance {lookalike['edit_distance']})"
        )

    for cue in indicators.get("content_cues", []):
        score += 5
        reasons.append(f"Content cue: {cue['type']} ('{cue['value']}')")

    score = min(score, 100)
    if not reasons:
        reasons.append("No suspicious URL/domain/content indicators found")

    return SignalContribution(
        family="sender_domain_url_indicators",
        weight=WEIGHTS["sender_domain_url_indicators"],
        raw_score_0_100=score,
        weighted_contribution=score * WEIGHTS["sender_domain_url_indicators"],
        reasons=reasons,
    )


def _score_ml(ml_prediction) -> SignalContribution:
    threat_classes = {"phishing", "fraud", "impersonated", "malicious", "1", "spam"}
    reasons = []

    if ml_prediction.predicted_class.lower() in threat_classes:
        score = ml_prediction.probability * 100
        reasons.append(
            f"Model predicted '{ml_prediction.predicted_class}' with "
            f"{ml_prediction.probability:.0%} probability"
        )
    else:
        # predicted benign -> low threat score, but note the confidence
        score = (1 - ml_prediction.probability) * 100 if ml_prediction.probability else 0
        reasons.append(
            f"Model predicted '{ml_prediction.predicted_class}' "
            f"(benign-leaning) with {ml_prediction.probability:.0%} confidence"
        )

    if ml_prediction.top_features:
        reasons.append(f"Top contributing features: {', '.join(ml_prediction.top_features[:5])}")

    return SignalContribution(
        family="nlp_ml_threat_probability",
        weight=WEIGHTS["nlp_ml_threat_probability"],
        raw_score_0_100=score,
        weighted_contribution=score * WEIGHTS["nlp_ml_threat_probability"],
        reasons=reasons,
        device=ml_prediction.device_used,
    )


def _score_threat_intel(domain_intel: dict, ip_intel_list: list) -> SignalContribution:
    reasons = []
    score = 0.0

    if domain_intel and domain_intel.get("rdap") is None and domain_intel.get("source") == "live_dns_rdap":
        score += 10
        reasons.append("Domain registration data could not be retrieved (unverifiable)")

    for ip_result in ip_intel_list:
        if getattr(ip_result, "is_hosting_guess", False):
            score += 15
            reasons.append(f"IP {ip_result.ip} resolves to hosting/cloud infrastructure ({ip_result.isp})")

    score = min(score, 100)
    if not reasons:
        reasons.append("No adverse threat-intelligence signals found (or lookups unavailable)")

    return SignalContribution(
        family="threat_intelligence_reputation",
        weight=WEIGHTS["threat_intelligence_reputation"],
        raw_score_0_100=score,
        weighted_contribution=score * WEIGHTS["threat_intelligence_reputation"],
        reasons=reasons,
    )


def _categorize(score: float) -> str:
    for threshold, category in CATEGORY_THRESHOLDS:
        if score >= threshold:
            return category
    return "legitimate"


def _confidence_label(contributions: List[SignalContribution], network_enabled: bool) -> str:
    """
    PRD 15: use confidence labels High/Medium/Low. We derive this from how
    many signal families actually had usable data vs degraded/unavailable.
    """
    degraded = 0
    for c in contributions:
        if c.family == "threat_intelligence_reputation" and not network_enabled:
            degraded += 1
        if c.family == "nlp_ml_threat_probability" and c.device == "none":
            degraded += 1
    if degraded == 0:
        return "High"
    elif degraded == 1:
        return "Medium"
    return "Low"


def compute_threat_score(
    auth_check: dict,
    hops: list,
    mismatch_findings: list,
    indicators: dict,
    ml_prediction,
    domain_intel: dict,
    ip_intel_list: list,
    network_enabled: bool,
) -> ThreatScoreResult:
    contributions = [
        _score_authentication(auth_check),
        _score_header_routing(hops, mismatch_findings),
        _score_sender_domain_url(indicators),
        _score_ml(ml_prediction),
        _score_threat_intel(domain_intel, ip_intel_list),
    ]

    final_score = round(sum(c.weighted_contribution for c in contributions), 1)
    category = _categorize(final_score)
    confidence = _confidence_label(contributions, network_enabled)

    limitations = [
        "Geolocation reflects infrastructure location, not attacker physical location.",
        "Received headers below the trust boundary can be forged by the sender.",
        "This is a decision-support signal, not a definitive identity or intent finding.",
    ]
    if not network_enabled:
        limitations.append("Network lookups were disabled; DNS/RDAP/reputation signals are incomplete.")

    return ThreatScoreResult(
        final_score=final_score,
        category=category,
        confidence=confidence,
        contributions=contributions,
        limitations=limitations,
    )
