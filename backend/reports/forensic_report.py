"""
Forensic report & chain of custody — PRD Section 8.10. CPU-only.
Generates both a machine-readable JSON export and a human-readable PDF.
"""
import json
from datetime import datetime
from typing import Any, Dict

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)


def build_report_payload(
    case: dict,
    evidence: dict,
    email_summary: dict,
    header_findings: dict,
    auth_check: dict,
    indicators: dict,
    geo_results: list,
    domain_intel: dict,
    ml_prediction: dict,
    threat_score: dict,
    graph_summary: dict,
    audit_events: list,
) -> Dict[str, Any]:
    """Assemble the full structured report payload (used for JSON export
    and as the data source for the PDF renderer)."""
    return {
        "report_generated_at": datetime.utcnow().isoformat(),
        "case": case,
        "evidence": evidence,
        "email_summary": email_summary,
        "header_findings": header_findings,
        "authentication": auth_check,
        "content_indicators": indicators,
        "geolocation_results": geo_results,
        "domain_intelligence": domain_intel,
        "ml_result": ml_prediction,
        "threat_score": threat_score,
        "correlation_graph": graph_summary,
        "audit_trail": audit_events,
        "disclaimer": (
            "This report identifies probable infrastructure, authentication "
            "outcomes, and behavioral indicators. It does not identify a human "
            "attacker or guarantee physical location. Geolocation reflects "
            "infrastructure, not attacker location. Findings should be reviewed "
            "by a qualified analyst before action is taken."
        ),
    }


def export_json(payload: dict, output_path: str):
    with open(output_path, "w") as f:
        json.dump(payload, f, indent=2, default=str)
    return output_path


def export_pdf(payload: dict, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                             topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleCustom", parent=styles["Title"], fontSize=18)
    h2 = styles["Heading2"]
    body = styles["BodyText"]
    small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8, textColor=colors.grey)

    elements = []

    elements.append(Paragraph("Forensic Investigation Report", title_style))
    elements.append(Paragraph("SIH26106 — Email Threat Detection & Forensic Intelligence Platform", body))
    elements.append(Spacer(1, 0.5*cm))

    case = payload["case"]
    elements.append(Paragraph("1. Case Metadata", h2))
    case_table_data = [
        ["Case ID", case.get("case_id", "")],
        ["Status", case.get("status", "")],
        ["Analyst", case.get("analyst", "")],
        ["Created At", str(case.get("created_at", ""))],
    ]
    elements.append(_make_table(case_table_data))
    elements.append(Spacer(1, 0.3*cm))

    ev = payload["evidence"]
    elements.append(Paragraph("2. Evidence & Chain of Custody", h2))
    ev_table_data = [
        ["Evidence ID", ev.get("evidence_id", "")],
        ["Original Filename", ev.get("filename", "")],
        ["SHA-256", ev.get("sha256", "")],
        ["Ingested At", str(ev.get("ingested_at", ""))],
    ]
    elements.append(_make_table(ev_table_data))
    elements.append(Spacer(1, 0.3*cm))

    email_summary = payload["email_summary"]
    elements.append(Paragraph("3. Email Summary", h2))
    email_table_data = [
        ["Subject", str(email_summary.get("subject", ""))[:90]],
        ["From", str(email_summary.get("from_header_raw", ""))],
        ["Reply-To", str(email_summary.get("reply_to", ""))],
        ["Return-Path", str(email_summary.get("return_path", ""))],
        ["Date", str(email_summary.get("date_header", ""))],
    ]
    elements.append(_make_table(email_table_data))
    elements.append(Spacer(1, 0.3*cm))

    ts = payload["threat_score"]
    elements.append(Paragraph("4. Threat Score", h2))
    elements.append(Paragraph(
        f"<b>Final Score:</b> {ts.get('final_score')} / 100 &nbsp;&nbsp; "
        f"<b>Category:</b> {ts.get('category')} &nbsp;&nbsp; "
        f"<b>Confidence:</b> {ts.get('confidence')}", body
    ))
    elements.append(Spacer(1, 0.2*cm))
    contrib_rows = [["Signal Family", "Score (0-100)", "Weighted", "Device"]]
    for c in ts.get("contributions", []):
        contrib_rows.append([
            c.get("family", ""), str(c.get("raw_score_0_100", "")),
            str(round(c.get("weighted_contribution", 0), 1)), c.get("device", ""),
        ])
    elements.append(_make_table(contrib_rows, header=True))
    elements.append(Spacer(1, 0.2*cm))

    for c in ts.get("contributions", []):
        elements.append(Paragraph(f"<b>{c.get('family')}</b>", styles["Heading4"]))
        for reason in c.get("reasons", []):
            elements.append(Paragraph(f"• {reason}", small))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph("5. Header & Routing Findings", h2))
    for hop in payload["header_findings"].get("hops", []):
        elements.append(Paragraph(
            f"Hop {hop.get('hop_index')}: IP={hop.get('ip')} host={hop.get('hostname')} "
            f"trust={hop.get('trust_level')}", small
        ))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph("6. Geolocation Results", h2))
    for geo in payload.get("geolocation_results", []):
        elements.append(Paragraph(
            f"IP {geo.get('ip')}: {geo.get('city')}, {geo.get('region')}, {geo.get('country')} "
            f"(ASN {geo.get('asn')}, {geo.get('isp')}) — source: {geo.get('source')}", small
        ))
    elements.append(Paragraph(
        "<i>Note: represents infrastructure location, not attacker physical location.</i>", small
    ))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph("7. Limitations", h2))
    for lim in ts.get("limitations", []):
        elements.append(Paragraph(f"• {lim}", small))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph("8. Analyst Conclusion", h2))
    elements.append(Paragraph(case.get("conclusion") or "(not yet recorded)", body))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph("9. Audit Trail", h2))
    audit_rows = [["Timestamp", "Action", "Actor"]]
    for a in payload.get("audit_trail", []):
        audit_rows.append([str(a.get("timestamp", "")), a.get("action", ""), a.get("actor", "")])
    elements.append(_make_table(audit_rows, header=True))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph(payload["disclaimer"], small))

    if payload.get("digital_signature"):
        sig = payload["digital_signature"]
        elements.append(Spacer(1, 0.4*cm))
        elements.append(Paragraph("10. Digital Signature", h2))
        elements.append(Paragraph(
            f"Algorithm: {sig.get('algorithm')} &nbsp;&nbsp; Signed at: {sig.get('signed_at')}", small
        ))
        elements.append(Paragraph(f"Content SHA-256: {sig.get('content_sha256')}", small))
        elements.append(Paragraph(
            "Verify this report's integrity via POST /api/reports/verify with the "
            "full JSON export. A mismatch indicates the report was altered after generation.",
            small
        ))

    doc.build(elements)
    return output_path


def _make_table(data, header: bool = False):
    table = Table(data, colWidths=[5*cm, 10*cm] if len(data[0]) == 2 else None)
    style = [
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")))
        style.append(("TEXTCOLOR", (0, 0), (-1, 0), colors.white))
        style.append(("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"))
    table.setStyle(TableStyle(style))
    return table
