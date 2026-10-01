"""
Role-based access control — PRD Section 17 (Phase 2 stretch).

A laptop-prototype-appropriate RBAC: a static role/API-key mapping (no
external identity provider needed), enforced via a FastAPI dependency.
Three roles matching the target users in PRD Section 6:

  - "analyst"      : can create cases, upload evidence, run analysis, view
                      results and graphs. Cannot decrypt raw evidence or
                      delete cases.
  - "investigator"  : everything analyst can do, PLUS decrypt/download raw
                      evidence and generate signed forensic reports.
  - "admin"         : everything, PLUS case deletion and vault key rotation.

Usage in a route:
    @router.post("/cases/{case_id}/report")
    def generate_report(case_id: str, role: str = Depends(require_role("investigator"))):
        ...

For the prototype, API keys are read from environment variables so nothing
sensitive is hardcoded in source:
    SIH_APIKEY_ANALYST, SIH_APIKEY_INVESTIGATOR, SIH_APIKEY_ADMIN
If none are set, RBAC is DISABLED and every request is treated as "admin" —
this keeps local development/demo frictionless while making it trivial to
turn on before any non-solo-laptop use (see GUIDE.md Section 9 for how to
enable it for your SIH demo).
"""
import os
from fastapi import Header, HTTPException

ROLE_HIERARCHY = {"analyst": 1, "investigator": 2, "admin": 3}


def _configured_keys() -> dict:
    """Returns {api_key: role} from environment, or {} if RBAC is unset."""
    mapping = {}
    for role in ROLE_HIERARCHY:
        env_var = f"SIH_APIKEY_{role.upper()}"
        key = os.environ.get(env_var)
        if key:
            mapping[key] = role
    return mapping


def rbac_enabled() -> bool:
    return len(_configured_keys()) > 0


def require_role(minimum_role: str):
    """
    FastAPI dependency factory. Returns a dependency function that checks
    the `X-API-Key` header against configured keys and enforces a minimum
    role level. If RBAC is not configured (no env vars set), every request
    is allowed through as "admin" for frictionless local demo use.
    """
    minimum_level = ROLE_HIERARCHY[minimum_role]

    def dependency(x_api_key: str = Header(default=None)):
        keys = _configured_keys()

        if not keys:
            return "admin"  # RBAC disabled — local demo mode

        if not x_api_key or x_api_key not in keys:
            raise HTTPException(status_code=401, detail="Missing or invalid X-API-Key header")

        user_role = keys[x_api_key]
        if ROLE_HIERARCHY[user_role] < minimum_level:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{user_role}' does not have '{minimum_role}' access for this action",
            )
        return user_role

    return dependency
