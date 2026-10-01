# GeoIP Database Setup

This prototype uses MaxMind's **GeoLite2** databases for offline, local IP
geolocation and ASN lookups (PRD Section 8.6 / 10). MaxMind's license does
not permit redistributing the `.mmdb` files, so you need to download them
yourself (free, requires a MaxMind account):

1. Create a free account: https://www.maxmind.com/en/geolite2/signup
2. Go to **My Account → Manage License Keys** and generate a license key.
3. Download these two files:
   - `GeoLite2-City.mmdb`
   - `GeoLite2-ASN.mmdb`
4. Place both files directly in this folder (`data/geoip/`).

Once both files are present, `backend/intelligence/geoip.py` will detect
them automatically on next server start — no config changes needed.

**If you skip this step:** the prototype still runs. Every IP lookup will
return `source: "no_local_database"` instead of country/city/ASN data, and
the dashboard will show geolocation as "unavailable" rather than crashing.
This satisfies PRD Section 15's graceful-degradation requirement, but for
your SIH demo you should download the databases in advance so the map
actually populates.

You will also need the `geoip2` Python package:
```
pip install geoip2
```
