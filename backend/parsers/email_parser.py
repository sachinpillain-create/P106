"""
Email ingestion & evidence handling — PRD Section 8.1.

CPU-only, deterministic. Uses Python's standard `email` package for
RFC 5322 / MIME parsing. Never executes attachment content.
"""
import hashlib
from dataclasses import dataclass, field
from email import message_from_bytes, policy
from email.message import Message
from typing import List, Optional

from backend.security.sanitizer import sanitize_html, mime_depth_within_limit


@dataclass
class AttachmentMeta:
    filename: Optional[str]
    content_type: str
    size_bytes: int


@dataclass
class ParsedEmail:
    raw_bytes: bytes
    sha256: str
    message_id: Optional[str]
    subject: Optional[str]
    from_header_raw: Optional[str]
    from_display: Optional[str]
    from_address: Optional[str]
    to: Optional[str]
    cc: Optional[str]
    bcc: Optional[str]
    reply_to: Optional[str]
    return_path: Optional[str]
    date_header: Optional[str]
    received_headers: List[str] = field(default_factory=list)
    auth_results_headers: List[str] = field(default_factory=list)
    dkim_signature_headers: List[str] = field(default_factory=list)
    arc_headers: List[str] = field(default_factory=list)
    all_headers: List[tuple] = field(default_factory=list)
    body_text: str = ""
    body_html_raw: str = ""
    body_html_sanitized: str = ""
    attachments: List[AttachmentMeta] = field(default_factory=list)
    malformed_notes: List[str] = field(default_factory=list)


def compute_sha256(raw_bytes: bytes) -> str:
    return hashlib.sha256(raw_bytes).hexdigest()


def _split_display_address(header_value: Optional[str]):
    """Split 'Display Name <addr@example.com>' into (display, address)."""
    if not header_value:
        return None, None
    from email.utils import parseaddr
    display, addr = parseaddr(header_value)
    return (display or None), (addr or None)


def parse_email_bytes(raw_bytes: bytes) -> ParsedEmail:
    """
    Parse a raw RFC 5322 message. Content is only ever read as metadata/text —
    attachments are never opened, executed, or written outside of their
    recorded metadata.
    """
    sha256 = compute_sha256(raw_bytes)

    try:
        msg: Message = message_from_bytes(raw_bytes, policy=policy.default)
    except Exception as e:
        # Even a malformed message should not crash ingestion (PRD 21:
        # "a failed external lookup does not crash the analysis" — we extend
        # the same resilience principle to malformed input).
        msg = message_from_bytes(raw_bytes)  # fallback to compat32 policy

    malformed_notes = []
    if not mime_depth_within_limit(msg):
        malformed_notes.append("MIME nesting depth exceeded configured limit")

    all_headers = [(k, v) for k, v in msg.items()]

    from_display, from_address = _split_display_address(msg.get("From"))

    received_headers = msg.get_all("Received", [])
    auth_results = msg.get_all("Authentication-Results", [])
    dkim_sigs = msg.get_all("DKIM-Signature", [])
    arc_headers = (
        msg.get_all("ARC-Seal", [])
        + msg.get_all("ARC-Message-Signature", [])
        + msg.get_all("ARC-Authentication-Results", [])
    )

    body_text = ""
    body_html_raw = ""
    attachments: List[AttachmentMeta] = []

    if msg.is_multipart():
        for part in msg.walk():
            content_disposition = str(part.get("Content-Disposition") or "")
            content_type = part.get_content_type()

            if part.is_multipart():
                continue

            if "attachment" in content_disposition or (
                part.get_filename() and content_type not in ("text/plain", "text/html")
            ):
                payload = part.get_payload(decode=True) or b""
                attachments.append(
                    AttachmentMeta(
                        filename=part.get_filename(),
                        content_type=content_type,
                        size_bytes=len(payload),
                    )
                )
                continue  # never decode/execute attachment body further

            if content_type == "text/plain" and not body_text:
                try:
                    body_text = part.get_content()
                except Exception:
                    malformed_notes.append("Failed to decode a text/plain part")
            elif content_type == "text/html" and not body_html_raw:
                try:
                    body_html_raw = part.get_content()
                except Exception:
                    malformed_notes.append("Failed to decode a text/html part")
    else:
        content_type = msg.get_content_type()
        try:
            content = msg.get_content()
        except Exception:
            content = ""
            malformed_notes.append("Failed to decode message body")
        if content_type == "text/html":
            body_html_raw = content
        else:
            body_text = content

    body_html_sanitized = sanitize_html(body_html_raw) if body_html_raw else ""

    return ParsedEmail(
        raw_bytes=raw_bytes,
        sha256=sha256,
        message_id=msg.get("Message-ID"),
        subject=msg.get("Subject"),
        from_header_raw=msg.get("From"),
        from_display=from_display,
        from_address=from_address,
        to=msg.get("To"),
        cc=msg.get("Cc"),
        bcc=msg.get("Bcc"),
        reply_to=msg.get("Reply-To"),
        return_path=msg.get("Return-Path"),
        date_header=msg.get("Date"),
        received_headers=list(received_headers),
        auth_results_headers=list(auth_results),
        dkim_signature_headers=list(dkim_sigs),
        arc_headers=list(arc_headers),
        all_headers=all_headers,
        body_text=body_text or "",
        body_html_raw=body_html_raw or "",
        body_html_sanitized=body_html_sanitized,
        attachments=attachments,
        malformed_notes=malformed_notes,
    )
