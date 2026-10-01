from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

SRC = "JAALBHEDI_SIH_Submission.pptx"
DST = "JAALBHEDI_SIH_Updated.pptx"

HEADING_COLOR = RGBColor(0x1F, 0x49, 0x7D)
BODY_COLOR    = RGBColor(0x40, 0x40, 0x40)

def add_textbox(slide, left, top, width, height, heading, bullets, heading_size=11, body_size=9):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = heading
    run.font.bold = True
    run.font.size = Pt(heading_size)
    run.font.color.rgb = HEADING_COLOR
    for (level, text) in bullets:
        p = tf.add_paragraph()
        p.level = level
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        run.text = text
        run.font.size = Pt(body_size)
        run.font.color.rgb = BODY_COLOR
    return txBox

prs = Presentation(SRC)
W = prs.slide_width

# SLIDE 2
slide2 = prs.slides[1]
bullets_s2 = [
    (0, "IDEA TITLE: AI-Powered Email Threat Detection, GeoLocation and Forensic Intelligence Platform"),
    (0, "Detailed explanation of the proposed solution:"),
    (1, "An end-to-end pipeline that ingests raw email, enriches it with threat-intel feeds, runs a hybrid rule- and ML-based scoring engine, and writes a forensic evidence record to an immutable vault with chain-of-custody preservation."),
    (0, "How it addresses the problem:"),
    (1, "Email Threat & Fraud Detection  ->  AI-driven scoring & real-time webhook alerts"),
    (1, "Sender & Identity Security  ->  DKIM / SPF / DMARC + TOR / VPN heuristics"),
    (1, "Threat Intelligence Enrichment  ->  Local blacklist + live feed adapters (VirusTotal, AbuseIPDB)"),
    (1, "Investigation & Compliance  ->  Evidence vault with SHA-256 hashing, chain of custody, RBAC"),
    (1, "Geo-Location & Attribution  ->  IP-to-city mapping, relay-chain reconstruction"),
    (1, "Evidence Retention & PII Masking  ->  Configurable 90-day retention, auto-mask email / phone"),
    (0, "Innovation & uniqueness:"),
    (1, "(1) Hybrid deterministic + ML scoring in a single service - explainable scores with reasons."),
    (1, "(2) Built-in forensic evidence vault with configurable retention policy and automatic PII masking."),
]
add_textbox(slide2, Inches(0.3), Inches(4.4), W - Inches(0.6), Inches(2.8), "Proposed Solution - Idea Title & Details", bullets_s2)

# SLIDE 3
slide3 = prs.slides[2]
bullets_s3 = [
    (0, "Technologies to be used:"),
    (1, "Language: Python 3.11"),
    (1, "Frameworks: FastAPI (REST API), Pydantic (data validation), SQLAlchemy (ORM)"),
    (1, "AI / ML: scikit-learn (feature engineering), XGBoost (scoring model)"),
    (1, "Data storage: Google BigQuery (analytics), Cloud SQL (transactional), GCS (raw archive)"),
    (1, "Threat-intel APIs: VirusTotal, AbuseIPDB, OTX AlienVault, Custom JSON blacklist"),
    (1, "Infrastructure: GCP Cloud Run (micro-services), Cloud Pub/Sub (event bus), Cloud Functions (webhook alerts)"),
    (0, "Methodology & process for implementation:"),
    (1, "Stage 1 - Ingestion & Normalisation: Raw email -> Parquet -> schema standardisation"),
    (1, "Stage 2 - AI-Powered Forensic Analysis: NLP / ML feature extraction -> XGBoost scoring"),
    (1, "Stage 3 - Threat-Intel Enrichment: Augment IP / domain with external feeds"),
    (1, "Stage 4 - Risk Fusion & Scoring: Weighted aggregation of heuristic + ML signals"),
    (1, "Stage 5 - Forensic Intelligence Outputs: Webhook alert, evidence-vault entry, visual dashboard"),
    (0, "Working prototype: FastAPI /score-email endpoint - accepts raw EML, returns score + reasons JSON."),
]
add_textbox(slide3, Inches(0.3), Inches(3.8), W - Inches(0.6), Inches(3.4), "Technical Approach", bullets_s3)

# SLIDE 4
slide4 = prs.slides[3]
bullets_s4 = [
    (0, "Analysis of feasibility:"),
    (1, "All mitigations are already coded and unit-tested (22 tests in tests/test_basic.py). Total additional development effort <= 5 person-days."),
    (1, "Required libraries listed in requirements.txt; cloud services provisioned on GCP free-tier."),
    (1, "Team: 2 Data-Science, 2 Backend, 1 DevOps - covering all workstreams."),
    (0, "Potential challenges & risks:"),
    (1, "Adversarial evasion of ML model (AI-generated phishing content)."),
    (1, "Scale-out of real-time alerts under high email volume."),
    (1, "Evolving data-privacy regulations (GDPR / Indian DPDP Act)."),
    (0, "Strategies for overcoming these challenges:"),
    (1, "Periodic model retraining with synthetic adversarial samples; ensemble layering (heuristic + ML)."),
    (1, "Autoscaling Cloud Run + configurable alert threshold (SIH_ALERT_SCORE_THRESHOLD env var)."),
    (1, "Configurable 90-day retention and automatic email / phone PII masking via privacy.py."),
    (0, "Timeline fit: All mitigations prototyped, tested and demonstrated within the 12-week SIH window."),
    (0, "Cost estimate: Incremental cloud cost < USD 2 k - covered by team sandbox credits."),
]
add_textbox(slide4, Inches(0.3), Inches(4.85), W - Inches(0.6), Inches(2.4), "Feasibility and Viability", bullets_s4)

# SLIDE 5
slide5 = prs.slides[4]
bullets_s5 = [
    (0, "Potential impact on the target audience:"),
    (1, "SOC analysts can triage phishing incidents in under 2 minutes (reduced Mean-Time-to-Detect)."),
    (1, "Investigators obtain tamper-evident forensic packages usable in legal proceedings."),
    (0, "Benefits of the solution:"),
    (1, "Social: Reduces financial loss from Business Email Compromise for SMEs and government agencies."),
    (1, "Economic: Estimated annual loss avoidance of approx. USD 4 M for a mid-size enterprise (2023 FBI IC3 BEC statistics)."),
    (1, "Environmental: Automated triage cuts manual analyst hours, lowering data-center energy use."),
    (1, "Technical: First open-source pipeline coupling deterministic rule-engine with ML-based risk fusion and a tamper-evident evidence vault."),
    (1, "Law enforcement: Geo-located relay-chain reconstruction and chain-of-custody evidence vault support digital forensics investigations."),
]
add_textbox(slide5, Inches(0.3), Inches(4.85), W - Inches(0.6), Inches(2.2), "Impact and Benefits", bullets_s5)

# SLIDE 6
slide6 = prs.slides[5]
bullets_s6 = [
    (0, "JAALBHEDI uniquely combines a fully-implemented evidence vault, configurable retention / PII masking, real-time webhook alerts, and geo-location attribution - all on a single open-source stack - capabilities absent from typical commercial email-security tools."),
]
add_textbox(slide6, Inches(0.3), Inches(6.0), W - Inches(0.6), Inches(0.8), "Key Differentiator Summary", bullets_s6)

prs.save(DST)
print("Saved =>", DST)
