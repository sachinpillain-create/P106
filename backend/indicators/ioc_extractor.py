"""
Content & URL threat analysis — PRD Section 8.4. All CPU, deterministic,
rule-based. URLs are extracted and normalized but NEVER visited/fetched
automatically (PRD 8.4 explicit requirement).
"""
import re
from dataclasses import dataclass
from typing import List
from urllib.parse import urlparse

URL_RE = re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)
IP_LITERAL_RE = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")

URGENCY_WORDS = [
    "urgent", "immediately", "act now", "verify your account", "suspended",
    "final notice", "action required", "your account will be closed",
    "limited time", "click here now", "confirm your identity",
]
CREDENTIAL_REQUEST_WORDS = [
    "password", "login credentials", "verify your password", "social security",
    "otp", "one-time password", "pin number", "security code",
]
PAYMENT_REQUEST_WORDS = [
    "wire transfer", "gift card", "invoice attached", "bank details",
    "payment overdue", "update your billing", "routing number",
]


@dataclass
class UrlFinding:
    url: str
    domain: str
    is_ip_literal: bool
    is_punycode: bool
    subdomain_count: int
    has_suspicious_port: bool
    has_redirect_param: bool
    severity: str


def extract_urls(text: str, html: str = "") -> List[str]:
    combined = f"{text or ''}\n{html or ''}"
    return list(dict.fromkeys(URL_RE.findall(combined)))  # de-dup, preserve order


def analyze_url(url: str) -> UrlFinding:
    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    is_ip_literal = bool(IP_LITERAL_RE.match(hostname))
    is_punycode = hostname.startswith("xn--") or ".xn--" in hostname
    subdomain_count = max(hostname.count("."), 0)
    has_suspicious_port = parsed.port is not None and parsed.port not in (80, 443)
    has_redirect_param = bool(re.search(r"(url|redirect|next|dest)=https?", url, re.IGNORECASE))

    severity = "low"
    if is_ip_literal or is_punycode:
        severity = "high"
    elif subdomain_count >= 4 or has_suspicious_port or has_redirect_param:
        severity = "medium"

    return UrlFinding(
        url=url,
        domain=hostname,
        is_ip_literal=is_ip_literal,
        is_punycode=is_punycode,
        subdomain_count=subdomain_count,
        has_suspicious_port=has_suspicious_port,
        has_redirect_param=has_redirect_param,
        severity=severity,
    )


def levenshtein(a: str, b: str) -> int:
    """Small dependency-free Levenshtein distance implementation."""
    if a == b:
        return 0
    if len(a) == 0:
        return len(b)
    if len(b) == 0:
        return len(a)

    prev_row = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr_row = [i] + [0] * len(b)
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            curr_row[j] = min(
                curr_row[j - 1] + 1,      # insertion
                prev_row[j] + 1,          # deletion
                prev_row[j - 1] + cost,   # substitution
            )
        prev_row = curr_row
    return prev_row[-1]


def lookalike_domain_distance(candidate_domain: str, protected_domains: List[str]) -> List[dict]:
    """
    PRD 8.4: calculate lookalike-domain distance against configurable
    protected/known domains (e.g. your institution's real domain, common
    brand domains referenced in the email body).
    """
    findings = []
    candidate = candidate_domain.lower().strip()
    for protected in protected_domains:
        protected = protected.lower().strip()
        if not protected or candidate == protected:
            continue
        distance = levenshtein(candidate, protected)
        # small distance relative to domain length = suspicious lookalike
        if 0 < distance <= 2 and len(protected) > 4:
            findings.append({
                "candidate_domain": candidate,
                "protected_domain": protected,
                "edit_distance": distance,
                "severity": "high" if distance == 1 else "medium",
            })
    return findings


def extract_content_cues(text: str) -> List[dict]:
    """PRD 8.4: extract urgency, credential-request, payment-request cues."""
    findings = []
    lower_text = (text or "").lower()

    for word_list, cue_type in (
        (URGENCY_WORDS, "urgency_cue"),
        (CREDENTIAL_REQUEST_WORDS, "credential_request_cue"),
        (PAYMENT_REQUEST_WORDS, "payment_request_cue"),
    ):
        for phrase in word_list:
            if phrase in lower_text:
                findings.append({
                    "type": cue_type,
                    "value": phrase,
                    "severity": "medium",
                })
    return findings


def extract_all_indicators(body_text: str, body_html: str, protected_domains: List[str]) -> dict:
    urls = extract_urls(body_text, body_html)
    url_findings = [analyze_url(u).__dict__ for u in urls]

    lookalike_findings = []
    for finding in url_findings:
        lookalike_findings.extend(
            lookalike_domain_distance(finding["domain"], protected_domains)
        )

    content_cues = extract_content_cues(body_text)

    return {
        "urls": url_findings,
        "lookalike_domains": lookalike_findings,
        "content_cues": content_cues,
    }
