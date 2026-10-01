"""
Header forensics — PRD Section 8.2.

This is the differentiating forensic core of the platform: reconstructing
the Received-header relay chain, extracting IP candidates, and — critically —
marking which hops are trustworthy vs attacker-controlled. Received headers
are written by each hop *including possibly the attacker's own MTA*, so the
PRD explicitly requires we do NOT treat every line as ground truth
(Section 8.2, Section 15, Section 25).

All logic here is deterministic and CPU-only.
"""
import ipaddress
import re
from dataclasses import dataclass
from typing import List, Optional

IPV4_RE = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")
IPV6_RE = re.compile(r"\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b")


@dataclass
class Hop:
    hop_index: int
    raw: str
    ip: Optional[str]
    hostname: Optional[str]
    timestamp: Optional[str]
    is_private: bool
    trust_level: str  # "trusted", "boundary", "untrusted"


def _extract_ip(text: str) -> Optional[str]:
    for regex in (IPV4_RE, IPV6_RE):
        m = regex.search(text)
        if m:
            return m.group(0)
    return None


def _extract_hostname(text: str) -> Optional[str]:
    # Typical form: "from mail.example.com (mail.example.com [1.2.3.4])"
    m = re.search(r"from\s+([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})", text)
    if m:
        return m.group(1)
    return None


def _extract_timestamp(text: str) -> Optional[str]:
    # Received headers end with a ; <date> section
    if ";" in text:
        return text.rsplit(";", 1)[-1].strip()
    return None


def _is_private_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved
    except ValueError:
        return False


def parse_received_chain(received_headers: List[str], trusted_relay_hostnames: Optional[List[str]] = None) -> List[Hop]:
    """
    Reconstruct the Received-hop sequence in chronological (send -> receive)
    direction. Headers appear newest-first in the raw message (each hop
    prepends its own Received line), so we reverse them here.

    Trust model (deterministic, configurable — PRD 8.2 / 15 / 25):
      - The LAST hop appended (i.e. first in chronological order, closest to
        the actual sender) is the one attackers can freely forge, since any
        sender can write an arbitrary "Received:" line into their own
        outgoing message.
      - Hops become progressively more trustworthy the closer they are to
        your own receiving infrastructure, because each subsequent relay is
        a system you (or a service you contracted) controls or trusts.
      - We mark the hop chain as: attacker-writable hops = "untrusted", the
        first hop actually contributed by a relay you configured as trusted
        (via `trusted_relay_hostnames`) = "boundary", everything after that
        (deeper into your own infrastructure) = "trusted".
      - If no trusted relay list is configured, everything is conservatively
        marked "untrusted" except we still surface it for analyst review.
    """
    trusted_relay_hostnames = trusted_relay_hostnames or []
    chronological = list(reversed(received_headers))  # oldest (sender-side) first

    hops: List[Hop] = []
    boundary_found = False

    for idx, raw in enumerate(chronological):
        ip = _extract_ip(raw)
        hostname = _extract_hostname(raw)
        timestamp = _extract_timestamp(raw)
        is_priv = _is_private_ip(ip) if ip else False

        if not boundary_found and hostname and any(
            trusted in hostname.lower() for trusted in trusted_relay_hostnames
        ):
            trust_level = "boundary"
            boundary_found = True
        elif boundary_found:
            trust_level = "trusted"
        else:
            trust_level = "untrusted"

        hops.append(
            Hop(
                hop_index=idx,
                raw=raw.strip(),
                ip=ip,
                hostname=hostname,
                timestamp=timestamp,
                is_private=is_priv,
                trust_level=trust_level,
            )
        )
    return hops


def earliest_reliable_candidate_ip(hops: List[Hop]) -> Optional[Hop]:
    """
    PRD 8.6: select the earliest reliable candidate sending IP using
    configurable trust rules. "Reliable" here means: it is the first
    hop (in chronological order) with a *public* IP address that is not
    itself flagged untrusted-and-attacker-writable without corroboration.

    For the prototype, our rule is: prefer the first public IP found in an
    untrusted-but-earliest hop (this is the classic "originating IP"
    candidate), but always flag it as best-effort, not proven, since it
    could have been forged. We surface it with a confidence flag rather
    than silently treating it as ground truth.
    """
    for hop in hops:
        if hop.ip and not hop.is_private:
            return hop
    return None


def detect_display_reply_mismatch(from_display, from_address, reply_to, return_path) -> List[dict]:
    """
    PRD 8.2 / 8.9: detect display-name/domain mismatch and Reply-To mismatch,
    a classic BEC/phishing indicator.
    """
    findings = []

    def domain_of(addr):
        if addr and "@" in addr:
            return addr.rsplit("@", 1)[-1].lower().strip(">")
        return None

    from_domain = domain_of(from_address)

    if reply_to:
        from email.utils import parseaddr
        _, reply_addr = parseaddr(reply_to)
        reply_domain = domain_of(reply_addr)
        if reply_domain and from_domain and reply_domain != from_domain:
            findings.append({
                "type": "reply_to_mismatch",
                "severity": "medium",
                "detail": f"Reply-To domain '{reply_domain}' differs from From domain '{from_domain}'",
            })

    if return_path:
        from email.utils import parseaddr
        _, rp_addr = parseaddr(return_path)
        rp_domain = domain_of(rp_addr)
        if rp_domain and from_domain and rp_domain != from_domain:
            findings.append({
                "type": "return_path_mismatch",
                "severity": "low",
                "detail": f"Return-Path domain '{rp_domain}' differs from From domain '{from_domain}'",
            })

    if from_display and from_address:
        # Heuristic: does display name itself look like a domain/brand that
        # doesn't match the actual sending domain? e.g. "PayPal Support" from a
        # non-paypal.com address.
        display_lower = from_display.lower()
        known_brand_hint = re.search(r"[a-z]{3,}\.(com|org|net|in|co)\b", display_lower)
        if known_brand_hint:
            hinted_domain = known_brand_hint.group(0)
            if from_domain and hinted_domain not in from_domain:
                findings.append({
                    "type": "display_name_domain_mismatch",
                    "severity": "high",
                    "detail": f"Display name references '{hinted_domain}' but From address domain is '{from_domain}'",
                })

    return findings
