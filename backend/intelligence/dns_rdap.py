"""
Domain / DNS / RDAP intelligence — PRD Section 8.6.

All external lookups are optional, timeboxed, and failure-tolerant: a failed
or slow lookup must never crash analysis (PRD 21 acceptance criteria) or
block the UI thread (PRD 11 performance targets — background workers).
"""
import json
import socket
from datetime import datetime
from typing import Optional

import dns.resolver
import dns.exception


def resolve_mx_records(domain: str, timeout_seconds: float = 3.0) -> Optional[list]:
    resolver = dns.resolver.Resolver()
    resolver.lifetime = timeout_seconds
    resolver.timeout = timeout_seconds
    try:
        answers = resolver.resolve(domain, "MX")
        return sorted(
            [{"priority": r.preference, "exchange": str(r.exchange).rstrip(".")} for r in answers],
            key=lambda x: x["priority"],
        )
    except (dns.exception.DNSException, socket.error):
        return None


def resolve_a_records(domain: str, timeout_seconds: float = 3.0) -> Optional[list]:
    resolver = dns.resolver.Resolver()
    resolver.lifetime = timeout_seconds
    resolver.timeout = timeout_seconds
    try:
        answers = resolver.resolve(domain, "A")
        return [str(r) for r in answers]
    except (dns.exception.DNSException, socket.error):
        return None


def rdap_lookup(domain: str, timeout_seconds: float = 4.0) -> Optional[dict]:
    """
    Best-effort RDAP lookup via the public RDAP bootstrap service
    (no API key required, unlike most WHOIS). Returns None on any failure —
    this must never block or crash the core analysis (PRD 21).
    """
    import urllib.request
    import urllib.error

    url = f"https://rdap.org/domain/{domain}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "SIH26106-Forensics-Prototype/1.0"})
        with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
            data = json.loads(resp.read().decode())
        events = {e.get("eventAction"): e.get("eventDate") for e in data.get("events", [])}
        return {
            "domain": domain,
            "registrar": next(
                (e.get("vcardArray") for e in data.get("entities", []) if "registrar" in e.get("roles", [])),
                None,
            ),
            "registration_date": events.get("registration"),
            "last_changed": events.get("last changed"),
            "status": data.get("status"),
            "raw_available": True,
        }
    except (urllib.error.URLError, TimeoutError, Exception):
        return None


def gather_domain_intelligence(domain: str, enable_network: bool = True) -> dict:
    """
    Aggregates MX, A records and RDAP registration data for a domain.
    Every result carries a lookup timestamp/source so it is auditable
    (PRD 8.6: "store lookup timestamp and source so results are auditable").
    """
    now = datetime.utcnow().isoformat()

    if not enable_network:
        return {
            "domain": domain,
            "mx_records": None,
            "a_records": None,
            "rdap": None,
            "lookup_timestamp": now,
            "source": "network_disabled",
        }

    mx = resolve_mx_records(domain)
    a_records = resolve_a_records(domain)
    rdap = rdap_lookup(domain)

    return {
        "domain": domain,
        "mx_records": mx,
        "a_records": a_records,
        "rdap": rdap,
        "lookup_timestamp": now,
        "source": "live_dns_rdap",
    }
