"""
Digital report signing — PRD Section 17 (Phase 2 stretch): "Digital report
signing."

Two modes, both implemented:
  1. HMAC-SHA256 (default) — fast, symmetric, appropriate when the same
     organization both generates and verifies reports (the common SIH-demo
     case). Uses a local secret key, generated on first run.
  2. RSA-PSS (optional, stronger) — asymmetric signing so a report's
     authenticity can be verified by a third party (e.g. law enforcement)
     who only has your PUBLIC key, without needing your signing secret.

Either signature proves the report content has not been altered since your
system generated it, and that it came from your system's key — this is
what "chain of custody" needs at the report layer (PRD 8.10).
"""
import base64
import hashlib
import hmac
import json
import os
from datetime import datetime

HMAC_KEY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "report_signing.key"
)
RSA_PRIVATE_KEY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "rsa_private.pem"
)
RSA_PUBLIC_KEY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "rsa_public.pem"
)


def _load_or_create_hmac_key() -> bytes:
    if os.path.exists(HMAC_KEY_PATH):
        with open(HMAC_KEY_PATH, "rb") as f:
            return f.read()
    key = os.urandom(32)
    os.makedirs(os.path.dirname(HMAC_KEY_PATH), exist_ok=True)
    with open(HMAC_KEY_PATH, "wb") as f:
        f.write(key)
    try:
        os.chmod(HMAC_KEY_PATH, 0o600)
    except (OSError, NotImplementedError):
        pass
    return key


def _canonical_bytes(payload: dict) -> bytes:
    """
    Deterministic JSON serialization so the same payload always hashes/signs
    identically regardless of dict key ordering.
    """
    return json.dumps(payload, sort_keys=True, default=str).encode("utf-8")


def sign_report_hmac(payload: dict) -> dict:
    """
    Returns a signature block to attach to the report:
      { "algorithm", "signed_at", "content_sha256", "signature" }
    """
    key = _load_or_create_hmac_key()
    content_bytes = _canonical_bytes(payload)
    content_hash = hashlib.sha256(content_bytes).hexdigest()
    signature = hmac.new(key, content_bytes, hashlib.sha256).hexdigest()

    return {
        "algorithm": "HMAC-SHA256",
        "signed_at": datetime.utcnow().isoformat(),
        "content_sha256": content_hash,
        "signature": signature,
    }


def verify_report_hmac(payload: dict, signature_block: dict) -> bool:
    """Re-derive the signature and compare in constant time."""
    if signature_block.get("algorithm") != "HMAC-SHA256":
        return False
    key = _load_or_create_hmac_key()
    content_bytes = _canonical_bytes(payload)
    expected = hmac.new(key, content_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_block.get("signature", ""))


# --- Optional stronger mode: RSA-PSS asymmetric signing ---

def _ensure_rsa_keypair():
    if os.path.exists(RSA_PRIVATE_KEY_PATH) and os.path.exists(RSA_PUBLIC_KEY_PATH):
        return
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    os.makedirs(os.path.dirname(RSA_PRIVATE_KEY_PATH), exist_ok=True)

    with open(RSA_PRIVATE_KEY_PATH, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ))
    with open(RSA_PUBLIC_KEY_PATH, "wb") as f:
        f.write(private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ))
    try:
        os.chmod(RSA_PRIVATE_KEY_PATH, 0o600)
    except (OSError, NotImplementedError):
        pass


def sign_report_rsa(payload: dict) -> dict:
    """
    Stronger alternative to HMAC signing: uses RSA-PSS so a third party can
    verify authenticity with only your PUBLIC key (data/rsa_public.pem),
    never your private signing key.
    """
    _ensure_rsa_keypair()
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding

    with open(RSA_PRIVATE_KEY_PATH, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    content_bytes = _canonical_bytes(payload)
    content_hash = hashlib.sha256(content_bytes).hexdigest()

    signature = private_key.sign(
        content_bytes,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )

    return {
        "algorithm": "RSA-PSS-SHA256",
        "signed_at": datetime.utcnow().isoformat(),
        "content_sha256": content_hash,
        "signature": base64.b64encode(signature).decode("ascii"),
        "public_key_path": RSA_PUBLIC_KEY_PATH,
    }


def verify_report_rsa(payload: dict, signature_block: dict) -> bool:
    if signature_block.get("algorithm") != "RSA-PSS-SHA256":
        return False
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.exceptions import InvalidSignature

    with open(RSA_PUBLIC_KEY_PATH, "rb") as f:
        public_key = serialization.load_pem_public_key(f.read())

    content_bytes = _canonical_bytes(payload)
    signature = base64.b64decode(signature_block["signature"])

    try:
        public_key.verify(
            signature, content_bytes,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except InvalidSignature:
        return False
