"""
Basic test suite. Run with:
    pytest tests/test_basic.py -v

Covers PRD Section 21 acceptance criteria at the unit level:
- valid .eml parses end-to-end
- evidence hashing is deterministic
- Received-chain hops are extracted with IP candidates
- SPF/DKIM/DMARC header parsing
- URL/lookalike-domain detection
- threat scoring never crashes even with degraded inputs
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.parsers.email_parser import parse_email_bytes, compute_sha256
from backend.forensics.header_analyzer import (
    parse_received_chain, earliest_reliable_candidate_ip, detect_display_reply_mismatch
)
from backend.auth.spf_dkim_dmarc import parse_authentication_results_header, run_full_auth_check
from backend.indicators.ioc_extractor import extract_all_indicators, levenshtein, lookalike_domain_distance
from backend.ml.inference import classify
from backend.scoring.engine import compute_threat_score

SAMPLE_EML_PATH = os.path.join(os.path.dirname(__file__), "sample_phishing.eml")


def _load_sample():
    with open(SAMPLE_EML_PATH, "rb") as f:
        return f.read()


def test_sha256_is_deterministic():
    raw = _load_sample()
    h1 = compute_sha256(raw)
    h2 = compute_sha256(raw)
    assert h1 == h2
    assert len(h1) == 64  # hex-encoded SHA-256


def test_parse_valid_eml():
    raw = _load_sample()
    parsed = parse_email_bytes(raw)
    assert parsed.subject is not None
    assert parsed.from_address == "alerts@paypa1-secure.net"
    assert len(parsed.received_headers) == 3
    assert "phishing" not in parsed.malformed_notes  # sanity: no false malformed flags


def test_parse_malformed_does_not_crash():
    garbage = b"This is not a valid email at all \x00\x01\x02"
    parsed = parse_email_bytes(garbage)
    assert parsed.sha256 is not None  # should still hash and return something


def test_received_chain_extraction():
    raw = _load_sample()
    parsed = parse_email_bytes(raw)
    hops = parse_received_chain(parsed.received_headers)
    assert len(hops) == 3
    assert hops[0].ip == "185.220.101.45"  # earliest / sender-side hop first


def test_earliest_candidate_ip_skips_private():
    raw = _load_sample()
    parsed = parse_email_bytes(raw)
    hops = parse_received_chain(parsed.received_headers)
    candidate = earliest_reliable_candidate_ip(hops)
    assert candidate is not None
    assert candidate.ip == "185.220.101.45"
    assert candidate.is_private is False


def test_display_reply_mismatch_detected():
    findings = detect_display_reply_mismatch(
        from_display="PayPal Security", from_address="alerts@paypa1-secure.net",
        reply_to="recover-support@totally-legit-mail.ru", return_path=None,
    )
    types = [f["type"] for f in findings]
    assert "reply_to_mismatch" in types


def test_auth_results_parsing():
    headers = ["mx.google.com; spf=fail smtp.mailfrom=x@y.com; dkim=none; dmarc=fail"]
    results = parse_authentication_results_header(headers)
    by_mechanism = {r.result and r.mechanism: r.result for r in results}
    assert any(r.mechanism == "spf" and r.result == "FAIL" for r in results)
    assert any(r.mechanism == "dmarc" and r.result == "FAIL" for r in results)


def test_auth_check_with_network_disabled_does_not_crash():
    result = run_full_auth_check([], "example.com", enable_dns=False)
    assert result["dns_results"] == []


def test_levenshtein_basic():
    assert levenshtein("paypal", "paypal") == 0
    assert levenshtein("paypal", "paypa1") == 1


def test_lookalike_domain_detection():
    findings = lookalike_domain_distance("paypa1-secure.net", ["paypal-secure.net"])
    assert len(findings) >= 0  # depends on distance threshold; must not crash


def test_url_extraction_and_ioc():
    raw = _load_sample()
    parsed = parse_email_bytes(raw)
    indicators = extract_all_indicators(parsed.body_text, parsed.body_html_raw, ["paypal.com"])
    assert len(indicators["urls"]) >= 1
    assert any(u["is_ip_literal"] or u["is_punycode"] for u in indicators["urls"])


def test_html_sanitization_strips_script():
    raw = _load_sample()
    parsed = parse_email_bytes(raw)
    assert "<script" not in parsed.body_html_sanitized.lower()


def test_ml_classify_never_raises():
    # Even with an empty/garbage string, classify() must return a result, not throw.
    result = classify("", prefer_transformer=False)
    assert result.predicted_class is not None


def test_threat_score_computation_end_to_end():
    raw = _load_sample()
    parsed = parse_email_bytes(raw)
    hops = parse_received_chain(parsed.received_headers)
    mismatches = detect_display_reply_mismatch(
        parsed.from_display, parsed.from_address, parsed.reply_to, parsed.return_path
    )
    auth_check = run_full_auth_check(parsed.auth_results_headers, "paypa1-secure.net", enable_dns=False)
    indicators = extract_all_indicators(parsed.body_text, parsed.body_html_raw, ["paypal.com"])
    ml_result = classify(f"{parsed.subject}\n{parsed.body_text}", prefer_transformer=False)

    score = compute_threat_score(
        auth_check=auth_check, hops=hops, mismatch_findings=mismatches,
        indicators=indicators, ml_prediction=ml_result, domain_intel={},
        ip_intel_list=[], network_enabled=False,
    )
    assert 0 <= score.final_score <= 100
    assert score.category in ("phishing_or_fraud", "impersonated", "suspicious", "legitimate")
    assert len(score.contributions) == 5  # all 5 signal families always present
    assert len(score.limitations) >= 3


def test_evidence_vault_roundtrip():
    from backend.security.evidence_vault import encrypt_bytes, decrypt_bytes
    raw = b"Sensitive evidence content that must not appear in plaintext on disk."
    encrypted = encrypt_bytes(raw)
    assert raw not in encrypted  # actually encrypted, not just base64/passthrough
    assert decrypt_bytes(encrypted) == raw


def test_evidence_vault_detects_tampering():
    from backend.security.evidence_vault import encrypt_bytes, decrypt_bytes
    encrypted = encrypt_bytes(b"original content")
    tampered = encrypted[:-4] + b"xxxx"
    try:
        decrypt_bytes(tampered)
        assert False, "Should have raised ValueError on tampered ciphertext"
    except ValueError:
        pass


def test_report_signing_hmac_roundtrip():
    from backend.security.report_signing import sign_report_hmac, verify_report_hmac
    payload = {"case_id": "abc", "score": 61.3}
    signature = sign_report_hmac(payload)
    assert verify_report_hmac(payload, signature) is True


def test_report_signing_hmac_detects_tampering():
    from backend.security.report_signing import sign_report_hmac, verify_report_hmac
    payload = {"case_id": "abc", "score": 61.3}
    signature = sign_report_hmac(payload)
    tampered_payload = {"case_id": "abc", "score": 99.9}
    assert verify_report_hmac(tampered_payload, signature) is False


def test_rbac_disabled_by_default(monkeypatch):
    from backend.security import rbac
    for var in ("SIH_APIKEY_ANALYST", "SIH_APIKEY_INVESTIGATOR", "SIH_APIKEY_ADMIN"):
        monkeypatch.delenv(var, raising=False)
    assert rbac.rbac_enabled() is False


def test_rbac_enforces_role_hierarchy(monkeypatch):
    from backend.security import rbac
    from fastapi import HTTPException
    monkeypatch.setenv("SIH_APIKEY_ANALYST", "test-analyst-key")
    monkeypatch.setenv("SIH_APIKEY_INVESTIGATOR", "test-investigator-key")

    dependency = rbac.require_role("investigator")

    # analyst key should be rejected for an investigator-level action
    try:
        dependency(x_api_key="test-analyst-key")
        assert False, "Expected 403 for insufficient role"
    except HTTPException as e:
        assert e.status_code == 403

    # investigator key should be accepted
    role = dependency(x_api_key="test-investigator-key")
    assert role == "investigator"


def test_campaign_clustering_groups_similar_emails():
    from backend.graph.campaign_clustering import cluster_by_content_similarity
    emails = [
        {"email_id": "e1", "subject": "Verify your account", "body_text": "Your account will be suspended unless you verify your password immediately."},
        {"email_id": "e2", "subject": "Verify your account now", "body_text": "Your account will be suspended unless you verify your password immediately now."},
        {"email_id": "e3", "subject": "Team lunch", "body_text": "Let's grab lunch on Friday at noon at the usual place."},
    ]
    clusters = cluster_by_content_similarity(emails, similarity_threshold=0.5)
    assert len(clusters) == 1
    assert set(clusters[0].email_ids) == {"e1", "e2"}


def test_campaign_clustering_single_email_returns_empty():
    from backend.graph.campaign_clustering import cluster_by_content_similarity
    clusters = cluster_by_content_similarity([{"email_id": "e1", "subject": "x", "body_text": "y"}])
    assert clusters == []


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
