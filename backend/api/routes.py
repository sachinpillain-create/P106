"""
API routes implementing the end-to-end flow from PRD Section 7:
create case -> upload -> hash/preserve -> parse -> auth checks -> IOC
extraction -> geo/domain intel -> ML inference -> score fusion -> graph ->
dashboard payload -> report export.
"""
import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.db.database import get_db
from backend.db import models
from backend.security.sanitizer import safe_filename, check_upload_size, MAX_UPLOAD_BYTES
from backend.security.evidence_vault import encrypt_bytes, decrypt_bytes
from backend.security.rbac import require_role, rbac_enabled
from backend.security.report_signing import sign_report_hmac, verify_report_hmac
from backend.parsers.email_parser import parse_email_bytes
from backend.forensics.header_analyzer import (
    parse_received_chain, earliest_reliable_candidate_ip, detect_display_reply_mismatch
)
from backend.auth.spf_dkim_dmarc import run_full_auth_check
from backend.indicators.ioc_extractor import extract_all_indicators
from backend.intelligence.geoip import lookup_ip
from backend.intelligence.dns_rdap import gather_domain_intelligence
from backend.ml.inference import classify
from backend.scoring.engine import compute_threat_score
from backend.graph.correlation import build_case_graph, find_shared_infrastructure, graph_to_json
from backend.graph.campaign_clustering import cluster_by_content_similarity, combine_with_infrastructure_sharing
from backend.reports.forensic_report import build_report_payload, export_json, export_pdf

router = APIRouter()

EVIDENCE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "evidence"
)
REPORTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "reports"
)
os.makedirs(EVIDENCE_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Configure your institution's / protected domains here for lookalike detection
PROTECTED_DOMAINS = ["yourcollege.edu", "yourcompany.com"]
# Configure hostnames of relays you trust (your own MX / gateway) for the
# header trust-boundary logic. Leave empty to conservatively mark everything
# as untrusted-but-visible.
TRUSTED_RELAY_HOSTNAMES = []


def _log_audit(db: Session, case_id: str, action: str, actor: Optional[str], detail: str = "", evidence_hash: Optional[str] = None):
    event = models.AuditEvent(
        event_id=str(uuid.uuid4()),
        case_id=case_id,
        action=action,
        actor=actor,
        detail=detail,
        evidence_hash=evidence_hash,
    )
    db.add(event)
    db.commit()


@router.post("/cases")
def create_case(analyst: Optional[str] = Form(None), db: Session = Depends(get_db)):
    case_id = str(uuid.uuid4())
    case = models.Case(case_id=case_id, analyst=analyst, status="open")
    db.add(case)
    db.commit()
    _log_audit(db, case_id, "case_created", analyst)
    return {"case_id": case_id, "status": "open"}


@router.get("/cases")
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).order_by(models.Case.created_at.desc()).all()
    return [
        {"case_id": c.case_id, "status": c.status, "analyst": c.analyst,
         "created_at": c.created_at.isoformat() if c.created_at else None}
        for c in cases
    ]


@router.post("/cases/{case_id}/upload")
async def upload_email(
    case_id: str,
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    enable_network: bool = Form(False),
    analyst_session: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    PRD Section 7, steps 2-3: upload .eml or paste raw source, hash and
    preserve evidence read-only.
    """
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if file is not None:
        raw_bytes = await file.read()
        original_name = file.filename or "upload.eml"
    elif raw_text is not None:
        raw_bytes = raw_text.encode("utf-8")
        original_name = "pasted_source.eml"
    else:
        raise HTTPException(status_code=400, detail="Provide either a file or raw_text")

    try:
        check_upload_size(len(raw_bytes))
    except ValueError as e:
        raise HTTPException(status_code=413, detail=str(e))

    # --- Evidence preservation: hash BEFORE any analysis, store immutable copy ---
    # Hash is computed on the ORIGINAL plaintext bytes so the chain-of-custody
    # hash matches what an investigator would get by hashing the source .eml
    # directly — encryption is a storage-at-rest protection layered on top,
    # not a substitute for evidence integrity hashing.
    parsed = parse_email_bytes(raw_bytes)

    stored_name = safe_filename(original_name)
    raw_path = os.path.join(EVIDENCE_DIR, stored_name)
    encrypted_bytes = encrypt_bytes(raw_bytes)
    with open(raw_path, "wb") as f:
        f.write(encrypted_bytes)
    os.chmod(raw_path, 0o444)  # read-only on disk — best-effort immutability

    evidence_id = str(uuid.uuid4())
    evidence = models.Evidence(
        evidence_id=evidence_id,
        case_id=case_id,
        filename=original_name,
        sha256=parsed.sha256,
        raw_path=raw_path,
        analyst_session=analyst_session,
    )
    db.add(evidence)
    db.commit()
    _log_audit(db, case_id, "evidence_ingested", analyst_session,
               detail=f"filename={original_name}", evidence_hash=parsed.sha256)

    email_id = str(uuid.uuid4())
    email_row = models.Email(
        email_id=email_id,
        evidence_id=evidence_id,
        message_id=parsed.message_id,
        subject=parsed.subject,
        from_display=parsed.from_display,
        from_address=parsed.from_address,
        reply_to=parsed.reply_to,
        return_path=parsed.return_path,
        date_header=parsed.date_header,
        body_text=parsed.body_text,
        body_html_sanitized=parsed.body_html_sanitized,
    )
    db.add(email_row)
    db.commit()

    return {
        "evidence_id": evidence_id,
        "email_id": email_id,
        "sha256": parsed.sha256,
        "subject": parsed.subject,
        "from": parsed.from_header_raw,
        "attachments": [a.__dict__ for a in parsed.attachments],
        "malformed_notes": parsed.malformed_notes,
        "enable_network": enable_network,
    }


@router.post("/emails/{email_id}/analyze")
def analyze_email(email_id: str, enable_network: bool = Form(False), db: Session = Depends(get_db)):
    """
    PRD Section 7, steps 4-11: run the full deterministic + ML pipeline and
    fuse into an explainable threat score.
    """
    email_row = db.query(models.Email).filter(models.Email.email_id == email_id).first()
    if not email_row:
        raise HTTPException(status_code=404, detail="Email not found")

    evidence = db.query(models.Evidence).filter(
        models.Evidence.evidence_id == email_row.evidence_id
    ).first()
    case_id = evidence.case_id

    with open(evidence.raw_path, "rb") as f:
        encrypted_bytes = f.read()
    raw_bytes = decrypt_bytes(encrypted_bytes)
    parsed = parse_email_bytes(raw_bytes)

    # --- Header forensics ---
    hops = parse_received_chain(parsed.received_headers, TRUSTED_RELAY_HOSTNAMES)
    for i, hop in enumerate(hops):
        db.add(models.HeaderHop(
            hop_id=str(uuid.uuid4()), email_id=email_id, hop_index=hop.hop_index,
            received_raw=hop.raw, ip=hop.ip, hostname=hop.hostname,
            timestamp=hop.timestamp, trust_level=hop.trust_level,
        ))
    db.commit()

    candidate_hop = earliest_reliable_candidate_ip(hops)
    mismatch_findings = detect_display_reply_mismatch(
        parsed.from_display, parsed.from_address, parsed.reply_to, parsed.return_path
    )

    # --- Authentication ---
    from_domain = parsed.from_address.rsplit("@", 1)[-1] if parsed.from_address and "@" in parsed.from_address else None
    auth_check = run_full_auth_check(
        parsed.auth_results_headers, from_domain, enable_dns=enable_network,
        raw_message_bytes=raw_bytes,
    )

    # --- Content / URL indicators ---
    indicators = extract_all_indicators(parsed.body_text, parsed.body_html_raw, PROTECTED_DOMAINS)
    for ind in indicators["content_cues"]:
        db.add(models.Indicator(
            indicator_id=str(uuid.uuid4()), email_id=email_id, type=ind["type"],
            value=ind["value"], severity=ind["severity"], source="content_rule", confidence="Medium",
        ))
    db.commit()

    # --- GeoIP / domain intelligence ---
    geo_results = []
    if candidate_hop and candidate_hop.ip:
        geo = lookup_ip(candidate_hop.ip)
        geo_results.append(geo)
        db.merge(models.IPIntel(
            ip=geo.ip, country=geo.country, region=geo.region, city=geo.city,
            latitude=geo.latitude, longitude=geo.longitude, asn=geo.asn, isp=geo.isp,
            is_hosting=geo.is_hosting_guess, is_private=geo.is_private,
            lookup_source=geo.source, lookup_timestamp=datetime.utcnow(),
        ))
        db.commit()

    domain_intel = {}
    if from_domain:
        domain_intel = gather_domain_intelligence(from_domain, enable_network=enable_network)

    # --- ML inference (GPU-preferred, CPU fallback — the hybrid core) ---
    ml_text = f"{parsed.subject or ''}\n{parsed.body_text or ''}"
    ml_prediction = classify(ml_text, prefer_transformer=True)
    db.add(models.MLResult(
        ml_result_id=str(uuid.uuid4()), email_id=email_id, model=ml_prediction.model_name,
        version=ml_prediction.model_version, predicted_class=ml_prediction.predicted_class,
        probability=ml_prediction.probability, latency_ms=ml_prediction.latency_ms,
        device_used=ml_prediction.device_used,
        top_features=json.dumps(ml_prediction.top_features or []),
    ))
    db.commit()

    # --- Explainable score fusion ---
    threat_score = compute_threat_score(
        auth_check=auth_check, hops=hops, mismatch_findings=mismatch_findings,
        indicators=indicators, ml_prediction=ml_prediction, domain_intel=domain_intel,
        ip_intel_list=geo_results, network_enabled=enable_network,
    )

    return {
        "email_id": email_id,
        "case_id": case_id,
        "header_findings": {
            "hops": [h.__dict__ for h in hops],
            "candidate_origin_ip": candidate_hop.__dict__ if candidate_hop else None,
            "mismatch_findings": mismatch_findings,
        },
        "authentication": auth_check,
        "content_indicators": indicators,
        "geolocation_results": [g.__dict__ for g in geo_results],
        "domain_intelligence": domain_intel,
        "ml_result": {
            "model_name": ml_prediction.model_name, "model_version": ml_prediction.model_version,
            "predicted_class": ml_prediction.predicted_class, "probability": ml_prediction.probability,
            "class_probabilities": ml_prediction.class_probabilities,
            "device_used": ml_prediction.device_used, "latency_ms": ml_prediction.latency_ms,
            "top_features": ml_prediction.top_features,
        },
        "threat_score": {
            "final_score": threat_score.final_score, "category": threat_score.category,
            "confidence": threat_score.confidence,
            "contributions": [c.__dict__ for c in threat_score.contributions],
            "limitations": threat_score.limitations,
        },
    }


@router.get("/cases/{case_id}/graph")
def get_case_graph(case_id: str, db: Session = Depends(get_db)):
    """PRD 8.7: investigation graph across all emails in a case."""
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    emails = (
        db.query(models.Email)
        .join(models.Evidence, models.Email.evidence_id == models.Evidence.evidence_id)
        .filter(models.Evidence.case_id == case_id)
        .all()
    )

    cases_data = []
    for e in emails:
        hops = db.query(models.HeaderHop).filter(models.HeaderHop.email_id == e.email_id).all()
        candidate = next((h for h in hops if h.ip), None)
        from_domain = e.from_address.rsplit("@", 1)[-1] if e.from_address and "@" in e.from_address else None
        indicators = db.query(models.Indicator).filter(
            models.Indicator.email_id == e.email_id, models.Indicator.type == "url"
        ).all()
        cases_data.append({
            "email_id": e.email_id, "from_address": e.from_address, "reply_to": e.reply_to,
            "from_domain": from_domain, "candidate_ip": candidate.ip if candidate else None,
            "asn": None, "urls": [i.value for i in indicators],
        })

    g = build_case_graph(cases_data)
    shared = find_shared_infrastructure(g)
    return {"graph": graph_to_json(g), "shared_infrastructure": shared}


@router.post("/cases/{case_id}/report")
def generate_report(
    case_id: str, analysis_payload: dict,
    role: str = Depends(require_role("investigator")),
    db: Session = Depends(get_db),
):
    """
    PRD 8.10: generate the forensic report (JSON + PDF) from a completed
    analysis. `analysis_payload` is the JSON body returned by /analyze,
    forwarded here so the report reflects exactly what the analyst saw.

    Requires "investigator" role or higher when RBAC is enabled (see
    backend/security/rbac.py) — report generation is chain-of-custody
    relevant and shouldn't be open to every viewer.
    """
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    email_id = analysis_payload.get("email_id")
    email_row = db.query(models.Email).filter(models.Email.email_id == email_id).first()
    evidence = db.query(models.Evidence).filter(
        models.Evidence.evidence_id == email_row.evidence_id
    ).first() if email_row else None

    audit_events = db.query(models.AuditEvent).filter(models.AuditEvent.case_id == case_id).all()

    payload = build_report_payload(
        case={"case_id": case.case_id, "status": case.status, "analyst": case.analyst,
              "created_at": case.created_at, "conclusion": case.conclusion},
        evidence={"evidence_id": evidence.evidence_id, "filename": evidence.filename,
                  "sha256": evidence.sha256, "ingested_at": evidence.ingested_at} if evidence else {},
        email_summary={"subject": email_row.subject, "from_header_raw": email_row.from_address,
                       "reply_to": email_row.reply_to, "return_path": email_row.return_path,
                       "date_header": email_row.date_header} if email_row else {},
        header_findings=analysis_payload.get("header_findings", {}),
        auth_check=analysis_payload.get("authentication", {}),
        indicators=analysis_payload.get("content_indicators", {}),
        geo_results=analysis_payload.get("geolocation_results", []),
        domain_intel=analysis_payload.get("domain_intelligence", {}),
        ml_prediction=analysis_payload.get("ml_result", {}),
        threat_score=analysis_payload.get("threat_score", {}),
        graph_summary={},
        audit_events=[{"timestamp": a.timestamp.isoformat() if a.timestamp else None,
                       "action": a.action, "actor": a.actor} for a in audit_events],
    )

    json_path = os.path.join(REPORTS_DIR, f"{case_id}_{email_id}.json")
    pdf_path = os.path.join(REPORTS_DIR, f"{case_id}_{email_id}.pdf")

    # Digital report signing (PRD Phase 2): sign the payload BEFORE export so
    # the signature covers exactly what's written to disk. A third party
    # (or you, later) can call /reports/verify to confirm the JSON report
    # hasn't been altered since generation.
    signature = sign_report_hmac(payload)
    payload["digital_signature"] = signature

    export_json(payload, json_path)
    export_pdf(payload, pdf_path)

    _log_audit(db, case_id, "report_generated", role, detail=f"email_id={email_id}, signed={signature['algorithm']}")

    return {"json_report_path": json_path, "pdf_report_path": pdf_path, "digital_signature": signature}


@router.post("/reports/verify")
def verify_report(report_json: dict):
    """
    Verifies a previously generated report's digital signature. Strips the
    signature block itself before re-hashing (the signature can't sign its
    own container), then confirms the remaining content matches what was
    signed at generation time.
    """
    signature = report_json.get("digital_signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Report has no digital_signature block")

    payload_without_sig = {k: v for k, v in report_json.items() if k != "digital_signature"}
    valid = verify_report_hmac(payload_without_sig, signature)
    return {"valid": valid, "algorithm": signature.get("algorithm"), "signed_at": signature.get("signed_at")}


@router.get("/cases/{case_id}/campaigns")
def get_campaign_clusters(case_id: str, db: Session = Depends(get_db)):
    """
    PRD Phase 2: campaign clustering across many emails + embedding-based
    semantic similarity (TF-IDF first pass — see graph/campaign_clustering.py
    for the upgrade path to true embeddings on the RTX 3050).

    Combines content-similarity clustering with the infrastructure-sharing
    signal already computed by the graph endpoint, so a campaign is flagged
    with higher confidence when emails share BOTH content and infrastructure.
    """
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    emails = (
        db.query(models.Email)
        .join(models.Evidence, models.Email.evidence_id == models.Evidence.evidence_id)
        .filter(models.Evidence.case_id == case_id)
        .all()
    )

    email_data = [
        {"email_id": e.email_id, "subject": e.subject, "body_text": e.body_text}
        for e in emails
    ]

    content_clusters = cluster_by_content_similarity(email_data)

    # Reuse the same infrastructure-sharing logic as the /graph endpoint
    graph_data = []
    for e in emails:
        hops = db.query(models.HeaderHop).filter(models.HeaderHop.email_id == e.email_id).all()
        candidate = next((h for h in hops if h.ip), None)
        from_domain = e.from_address.rsplit("@", 1)[-1] if e.from_address and "@" in e.from_address else None
        graph_data.append({
            "email_id": e.email_id, "from_address": e.from_address, "reply_to": e.reply_to,
            "from_domain": from_domain, "candidate_ip": candidate.ip if candidate else None,
            "asn": None, "urls": [],
        })
    g = build_case_graph(graph_data)
    shared_infra = find_shared_infrastructure(g)

    return combine_with_infrastructure_sharing(content_clusters, shared_infra)


@router.delete("/cases/{case_id}")
def delete_case(case_id: str, role: str = Depends(require_role("admin")), db: Session = Depends(get_db)):
    """
    Case deletion — requires "admin" role when RBAC is enabled. Deletes the
    case row and logs the deletion itself as an audit event on a
    still-queryable orphan record before removal, since a forensic platform
    should never silently lose the fact that a deletion occurred.
    """
    case = db.query(models.Case).filter(models.Case.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    _log_audit(db, case_id, "case_deletion_requested", role, detail="Case and associated records removed")

    evidences = db.query(models.Evidence).filter(models.Evidence.case_id == case_id).all()
    for ev in evidences:
        emails = db.query(models.Email).filter(models.Email.evidence_id == ev.evidence_id).all()
        for em in emails:
            db.query(models.HeaderHop).filter(models.HeaderHop.email_id == em.email_id).delete()
            db.query(models.Indicator).filter(models.Indicator.email_id == em.email_id).delete()
            db.query(models.MLResult).filter(models.MLResult.email_id == em.email_id).delete()
            db.delete(em)
        if os.path.exists(ev.raw_path):
            os.chmod(ev.raw_path, 0o600)
            os.remove(ev.raw_path)
        db.delete(ev)

    db.query(models.GraphEdge).filter(models.GraphEdge.case_id == case_id).delete()
    db.delete(case)
    db.commit()

    return {"status": "deleted", "case_id": case_id}


@router.get("/rbac/status")
def rbac_status():
    """Lets the dashboard show whether RBAC is active or in open demo mode."""
    return {"rbac_enabled": rbac_enabled()}


@router.get("/reports/download")
def download_report(path: str, role: str = Depends(require_role("investigator"))):
    if not os.path.abspath(path).startswith(os.path.abspath(REPORTS_DIR)):
        raise HTTPException(status_code=400, detail="Invalid report path")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path)
