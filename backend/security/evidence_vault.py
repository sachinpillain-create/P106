"""
Encrypted evidence vault — PRD Section 17 (Phase 2 stretch): "Encrypted
evidence vault."

Raw evidence (.eml files) can contain sensitive PII (names, account numbers,
internal correspondence). This module encrypts evidence at rest using
Fernet (AES-128-CBC + HMAC, authenticated encryption) so a stolen disk/backup
does not expose raw evidence content.

Key management for a laptop prototype: a single local key file, generated on
first run and stored outside the evidence directory. This is NOT a
production KMS — see the "Production hardening" note at the bottom for what
a real deployment needs instead.
"""
import os
from cryptography.fernet import Fernet, InvalidToken

VAULT_KEY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "vault.key"
)


def _load_or_create_key() -> bytes:
    """
    Loads the local vault key, generating one on first run. The key file is
    created with owner-only permissions (best-effort on Windows; meaningful
    on Linux/Mac).
    """
    if os.path.exists(VAULT_KEY_PATH):
        with open(VAULT_KEY_PATH, "rb") as f:
            return f.read()

    key = Fernet.generate_key()
    os.makedirs(os.path.dirname(VAULT_KEY_PATH), exist_ok=True)
    with open(VAULT_KEY_PATH, "wb") as f:
        f.write(key)
    try:
        os.chmod(VAULT_KEY_PATH, 0o600)  # owner read/write only
    except (OSError, NotImplementedError):
        pass  # chmod semantics differ on Windows; key file still created
    return key


_fernet_instance = None


def _get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        _fernet_instance = Fernet(_load_or_create_key())
    return _fernet_instance


def encrypt_bytes(raw_bytes: bytes) -> bytes:
    """Encrypt raw evidence bytes before writing to disk."""
    return _get_fernet().encrypt(raw_bytes)


def decrypt_bytes(encrypted_bytes: bytes) -> bytes:
    """
    Decrypt evidence bytes read from disk. Raises ValueError on tamper/
    corruption/wrong-key rather than silently returning garbage — evidence
    integrity must be verifiable (PRD 8.10 chain of custody).
    """
    try:
        return _get_fernet().decrypt(encrypted_bytes)
    except InvalidToken:
        raise ValueError(
            "Evidence could not be decrypted — file may be corrupted, "
            "tampered with, or encrypted under a different vault key."
        )


def is_vault_configured() -> bool:
    return os.path.exists(VAULT_KEY_PATH)


# --- Production hardening note ---
# For anything beyond a laptop demo:
#   1. Do not store the key alongside the encrypted data's parent directory
#      on the same disk/backup set — use a separate secrets store (e.g. an
#      OS keychain, HashiCorp Vault, or a cloud KMS).
#   2. Rotate keys periodically and re-encrypt (envelope encryption with a
#      per-file data key wrapped by a master key scales better than one
#      static Fernet key for every file).
#   3. Restrict decrypt access with the RBAC layer in security/rbac.py so
#      only authorized analyst roles can ever call decrypt_bytes().
