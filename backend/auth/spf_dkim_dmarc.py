"""
SPF / DKIM / DMARC — PRD Section 8.3.

Three layers, kept explicitly separate per PRD 8.3 & 15:
  1. Parse whatever Authentication-Results the receiving mail server already
     computed and stamped into the message (fast, no network, always works).
  2. Perform REAL DKIM cryptographic verification via `dkimpy` when a
     DKIM-Signature header is present — this fetches the selector's public
     key over DNS and recomputes the signature hash, rather than trusting
     whatever the header merely claims.
  3. Optionally perform a live DNS-backed SPF/DMARC record lookup when
     network access is enabled (best-effort, timeboxed, never blocks the UI).
"""
import re
import socket
from dataclasses import dataclass
from typing import Optional

import dns.resolver
import dns.exception

try:
    import dkim as dkimpy
    _DKIMPY_AVAILABLE = True
except ImportError:
    _DKIMPY_AVAILABLE = False


@dataclass
class AuthResult:
    mechanism: str  # spf, dkim, dmarc
    result: str  # PASS, FAIL, NEUTRAL, NONE, ERROR, SOFTFAIL, TEMPERROR, PERMERROR
    source: str  # "header", "dns_lookup", or "cryptographic_verification"
    raw_detail: Optional[str] = None


def verify_dkim_signature(raw_message_bytes: bytes, timeout_seconds: float = 5.0) -> Optional[AuthResult]:
    """
    Real DKIM cryptographic verification (PRD 8.3 upgrade beyond header-only
    parsing). Fetches the signing domain's public key from DNS via the
    selector named in the DKIM-Signature header, then recomputes the body
    and header hashes to confirm the signature is valid — this is the
    difference between "the message CLAIMS DKIM=pass" and "DKIM verification
    actually succeeded against the live DNS key".

    Returns None if there's no DKIM-Signature header at all (nothing to
    verify), or if verification errors out for any reason (network timeout,
    malformed signature, missing key) — callers should treat None as
    "could not be cryptographically confirmed", not as a hard failure,
    since transient DNS issues must never crash analysis (PRD 21).
    """
    if not _DKIMPY_AVAILABLE:
        return None
    if b"DKIM-Signature" not in raw_message_bytes and b"dkim-signature" not in raw_message_bytes.lower():
        return None

    try:
        socket.setdefaulttimeout(timeout_seconds)
        verified = dkimpy.verify(raw_message_bytes)
        return AuthResult(
            mechanism="dkim",
            result="PASS" if verified else "FAIL",
            source="cryptographic_verification",
            raw_detail="DKIM signature cryptographically verified against selector's published public key"
            if verified else "DKIM signature present but cryptographic verification failed",
        )
    except Exception as e:
        return AuthResult(
            mechanism="dkim",
            result="TEMPERROR",
            source="cryptographic_verification",
            raw_detail=f"Verification could not complete: {e}",
        )
    finally:
        socket.setdefaulttimeout(None)


def parse_authentication_results_header(auth_headers) -> list:
    """
    Parse existing Authentication-Results header(s) stamped by the receiving
    server. Format example:
    'mx.google.com; spf=pass (...) smtp.mailfrom=x@y.com; dkim=pass header.i=@y.com; dmarc=pass'
    """
    results = []
    combined = " ".join(auth_headers) if auth_headers else ""

    for mechanism in ("spf", "dkim", "dmarc"):
        m = re.search(rf"{mechanism}=([a-zA-Z]+)", combined, re.IGNORECASE)
        if m:
            results.append(
                AuthResult(
                    mechanism=mechanism,
                    result=m.group(1).upper(),
                    source="header",
                    raw_detail=combined[:300],
                )
            )
        else:
            results.append(
                AuthResult(mechanism=mechanism, result="NONE", source="header")
            )
    return results


def _dns_query_txt(domain: str, timeout_seconds: float = 3.0):
    resolver = dns.resolver.Resolver()
    resolver.lifetime = timeout_seconds
    resolver.timeout = timeout_seconds
    try:
        answers = resolver.resolve(domain, "TXT")
        return [b"".join(r.strings).decode(errors="ignore") for r in answers]
    except (dns.exception.DNSException, socket.error):
        return None  # network-dependent lookup: fail soft, never crash (PRD 21)


def lookup_spf_record(sender_domain: str) -> Optional[str]:
    """Best-effort live SPF TXT record lookup. Returns None on any failure/timeout."""
    txts = _dns_query_txt(sender_domain)
    if txts is None:
        return None
    for txt in txts:
        if txt.lower().startswith("v=spf1"):
            return txt
    return None


def lookup_dmarc_record(sender_domain: str) -> Optional[str]:
    """Best-effort live DMARC TXT record lookup at _dmarc.<domain>."""
    txts = _dns_query_txt(f"_dmarc.{sender_domain}")
    if txts is None:
        return None
    for txt in txts:
        if txt.lower().startswith("v=dmarc1"):
            return txt
    return None


def check_alignment(from_domain: Optional[str], auth_results: list) -> dict:
    """
    PRD 8.3: detect alignment mismatch between the visible From domain and
    the domain that authentication mechanisms actually asserted.
    We don't have the authenticated domain from a header-only parse in every
    case, so this returns a best-effort structural note for the analyst.
    """
    dkim_result = next((r for r in auth_results if r.mechanism == "dkim"), None)
    dmarc_result = next((r for r in auth_results if r.mechanism == "dmarc"), None)

    aligned = True
    notes = []
    if dmarc_result and dmarc_result.result in ("FAIL", "NONE"):
        aligned = False
        notes.append("DMARC did not pass — From-domain alignment cannot be confirmed")
    if dkim_result and dkim_result.result in ("FAIL", "NONE"):
        notes.append("DKIM signature missing or failed — cannot confirm domain authenticity via DKIM")

    return {"aligned": aligned, "notes": notes}


def run_full_auth_check(
    auth_headers: list,
    from_domain: Optional[str],
    enable_dns: bool = False,
    raw_message_bytes: Optional[bytes] = None,
) -> dict:
    header_results = parse_authentication_results_header(auth_headers)

    # Real cryptographic DKIM verification supersedes the header-claimed
    # result when we have the raw message and network access to fetch the
    # selector's public key (PRD 8.3: "perform DNS-backed validation").
    crypto_dkim_result = None
    if enable_dns and raw_message_bytes:
        crypto_dkim_result = verify_dkim_signature(raw_message_bytes)
        if crypto_dkim_result:
            header_results = [
                r for r in header_results if r.mechanism != "dkim"
            ] + [crypto_dkim_result]

    dns_results = []
    if enable_dns and from_domain:
        spf_record = lookup_spf_record(from_domain)
        dmarc_record = lookup_dmarc_record(from_domain)
        dns_results.append({
            "mechanism": "spf_dns_record",
            "found": spf_record is not None,
            "raw_detail": spf_record,
            "source": "dns_lookup",
        })
        dns_results.append({
            "mechanism": "dmarc_dns_record",
            "found": dmarc_record is not None,
            "raw_detail": dmarc_record,
            "source": "dns_lookup",
        })

    alignment = check_alignment(from_domain, header_results)

    return {
        "header_results": [r.__dict__ for r in header_results],
        "dns_results": dns_results,
        "alignment": alignment,
        "dkim_cryptographically_verified": crypto_dkim_result is not None,
    }
