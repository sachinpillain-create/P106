"""
GeoIP / ASN lookup — PRD Section 8.6, 10, 24.

Uses a local MaxMind GeoLite2 database file for offline-capable, near-instant
lookups (PRD explicitly wants this to work without internet for demos).
The .mmdb file is NOT bundled (MaxMind license terms) — see
data/geoip/README.md for how to obtain it. If the file is missing, this
module degrades gracefully and reports "unavailable" rather than crashing,
consistent with PRD 15's graceful-degradation requirement.

IMPORTANT (PRD 15 & Non-Goals): this is INFRASTRUCTURE geolocation, not
attacker physical location. Every result must be surfaced with that caveat.
"""
import ipaddress
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

GEOIP_CITY_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data", "geoip", "GeoLite2-City.mmdb",
)
GEOIP_ASN_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data", "geoip", "GeoLite2-ASN.mmdb",
)

try:
    import geoip2.database
    _GEOIP2_AVAILABLE = True
except ImportError:
    _GEOIP2_AVAILABLE = False


@dataclass
class GeoIPResult:
    ip: str
    is_private: bool
    country: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    asn: Optional[str] = None
    isp: Optional[str] = None
    is_hosting_guess: bool = False
    source: str = "unavailable"
    lookup_timestamp: str = ""
    caveat: str = "Represents infrastructure location, not attacker physical location."


_city_reader = None
_asn_reader = None
_readers_initialized = False


def _init_readers():
    global _city_reader, _asn_reader, _readers_initialized
    if _readers_initialized:
        return
    _readers_initialized = True
    if not _GEOIP2_AVAILABLE:
        return
    if os.path.exists(GEOIP_CITY_DB_PATH):
        try:
            _city_reader = geoip2.database.Reader(GEOIP_CITY_DB_PATH)
        except Exception:
            _city_reader = None
    if os.path.exists(GEOIP_ASN_DB_PATH):
        try:
            _asn_reader = geoip2.database.Reader(GEOIP_ASN_DB_PATH)
        except Exception:
            _asn_reader = None


def lookup_ip(ip: str) -> GeoIPResult:
    now = datetime.utcnow().isoformat()

    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return GeoIPResult(ip=ip, is_private=False, source="invalid_ip", lookup_timestamp=now)

    is_private = addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved
    if is_private:
        return GeoIPResult(
            ip=ip, is_private=True, source="local_rule",
            lookup_timestamp=now,
            caveat="Private/reserved address range — not internet-routable, no geolocation applicable.",
        )

    _init_readers()

    result = GeoIPResult(ip=ip, is_private=False, lookup_timestamp=now)

    if _city_reader:
        try:
            city_resp = _city_reader.city(ip)
            result.country = city_resp.country.name
            result.region = city_resp.subdivisions.most_specific.name
            result.city = city_resp.city.name
            result.latitude = city_resp.location.latitude
            result.longitude = city_resp.location.longitude
            result.source = "maxmind_geolite2_local"
        except Exception:
            pass

    if _asn_reader:
        try:
            asn_resp = _asn_reader.asn(ip)
            result.asn = f"AS{asn_resp.autonomous_system_number}"
            result.isp = asn_resp.autonomous_system_organization
            # Very rough heuristic: common hosting/cloud ASN org name keywords
            hosting_keywords = ["amazon", "google", "microsoft", "digitalocean",
                                 "ovh", "hetzner", "linode", "vultr", "cloud", "hosting"]
            if result.isp and any(k in result.isp.lower() for k in hosting_keywords):
                result.is_hosting_guess = True
        except Exception:
            pass

    if result.source == "unavailable":
        result.source = "no_local_database"

    return result


def is_geoip_database_available() -> bool:
    _init_readers()
    return _city_reader is not None
