"""
Security utilities. The core rule from PRD Section 14: every uploaded email
is treated as hostile input. Nothing here ever executes attachment content,
macros, JavaScript, or active HTML.
"""
import os
import re
import uuid
import bleach

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB upload limit (PRD 14: limit upload size)
MAX_MIME_DEPTH = 15  # PRD 14 & 25: prevent MIME-nesting / mail-bomb style abuse

ALLOWED_HTML_TAGS = [
    "p", "br", "b", "i", "u", "strong", "em", "span", "div",
    "a", "ul", "ol", "li", "table", "tr", "td", "th", "tbody", "thead",
    "blockquote", "h1", "h2", "h3", "h4", "h5", "h6",
]
ALLOWED_HTML_ATTRS = {
    "a": ["href", "title"],  # note: href is kept as inert text, never auto-navigated
    "*": ["style"],
}


def sanitize_html(raw_html: str) -> str:
    """
    Strip all active content (script, iframe, on* handlers, javascript: URLs,
    object/embed/form) from HTML before it is ever rendered in a UI.
    """
    if not raw_html:
        return ""

    cleaned = bleach.clean(
        raw_html,
        tags=ALLOWED_HTML_TAGS,
        attributes=ALLOWED_HTML_ATTRS,
        strip=True,
    )
    # Defense in depth: neutralize javascript: / data: URIs bleach might miss
    cleaned = re.sub(r"javascript:", "blocked:", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"vbscript:", "blocked:", cleaned, flags=re.IGNORECASE)
    return cleaned


def safe_filename(original_name: str) -> str:
    """
    Generate a path-safe, collision-resistant filename for evidence storage.
    Never trust the original filename for path construction (PRD 14: prevent
    path traversal).
    """
    ext = ".eml"
    if original_name and "." in original_name:
        candidate_ext = "." + original_name.rsplit(".", 1)[-1].lower()
        if re.fullmatch(r"\.[a-z0-9]{1,10}", candidate_ext):
            ext = candidate_ext
    return f"{uuid.uuid4().hex}{ext}"


def check_upload_size(size_bytes: int):
    if size_bytes > MAX_UPLOAD_BYTES:
        raise ValueError(
            f"Upload exceeds maximum allowed size of {MAX_UPLOAD_BYTES // (1024*1024)} MB"
        )


def mime_depth_within_limit(msg, depth: int = 0) -> bool:
    """Recursively check MIME nesting depth to guard against nesting-bomb style abuse."""
    if depth > MAX_MIME_DEPTH:
        return False
    if msg.is_multipart():
        for part in msg.get_payload():
            if not mime_depth_within_limit(part, depth + 1):
                return False
    return True
