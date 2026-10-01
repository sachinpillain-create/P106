# JAALBHEDI (जाठभेदी) — SIH26106

> **AI-Powered Email Threat Detection, Multi-Hop GeoLocation & Forensic Intelligence Platform**  
> *Smart India Hackathon (SIH 2026) — Problem Statement ID: SIH26106*  
> *Target Architecture: Hybrid CPU/GPU (Optimized for Intel Core i5-13420H + NVIDIA RTX 3050 6GB with full CPU fallback)*

---

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.2+-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SIH 2026](https://img.shields.io/badge/SIH-2026-brightgreen)](https://sih.gov.in/)

---

## 📌 Executive Overview

**JAALBHEDI** is an end-to-end digital forensic intelligence platform designed for cyber defense investigators, law enforcement agencies, and enterprise SOC analysts. It addresses sophisticated email threats (spear-phishing, spoofing, BEC scams, and credential harvesting) by combining **deterministic forensic header tracing**, **cryptographic integrity verification**, **infrastructure intelligence**, and **hybrid AI threat classification**.

```
+--------------------------------------------------------------------------------------------------+
|                                    JAALBHEDI ARCHITECTURE                                        |
+--------------------------------------------------------------------------------------------------+
|  Raw Evidence (.eml)                                                                             |
|         │                                                                                        |
|         ▼                                                                                        |
|  [ RFC 5322 MIME Parser ] ───► SHA-256 Hash & Timestamp (Chain-of-Custody Ingestion)            |
|         │                                                                                        |
|         ├────────────────────────────────────────┬────────────────────────────────────────┐      |
|         ▼                                        ▼                                        ▼      |
|  [ Header Analyzer ]                      [ Auth Checks ]                          [ IOC Harvester ]  
|  • Received-chain unwinding               • SPF / DKIM / DMARC verification       • URL extraction    
|  • Candidate originating IP               • Display-From vs Return-Path check     • Lookalike domains 
|  • Trust boundary identification          • Domain alignment verification          • Urgent intent cues
|         │                                        │                                        │      |
|         └────────────────────────────────────────┼────────────────────────────────────────┘      |
|                                                  ▼                                               |
|                                    [ Intelligence Gathering ]                                    |
|                                    • MaxMind GeoLite2 IP GeoLocation                             |
|                                    • WHOIS / RDAP ASN & Domain Profiling                         |
|                                                  │                                               |
|                                                  ▼                                               |
|                                    [ Hybrid ML Classification ]                                  |
|                                    • CPU Baseline: TF-IDF + Logistic Regression                  |
|                                    • GPU Accelerated: PyTorch Transformer (RTX 3050 CUDA)        |
|                                                  │                                               |
|                                                  ▼                                               |
|                                    [ Threat Score Fusion Engine ]                                |
|                                    • Deterministic Forensic Weights + ML Confidence              |
|                                    • High / Medium / Low Verdict + Risk Explanations             |
|                                                  │                                               |
|         ┌────────────────────────────────────────┴────────────────────────────────────────┐      |
|         ▼                                                                                 ▼      |
|  [ Graph Correlation ]                                                            [ Security & Export ] 
|  • NetworkX Shared Infrastructure                                                 • AES-128 Evidence Vault 
|  • Cross-case campaign clustering                                                 • Tamper-Evident HMAC/RSA
|  • Visual entity relationship graph                                               • Signed PDF / JSON Report
+--------------------------------------------------------------------------------------------------+
```

---

## 🚀 Key Forensic Capabilities

### 1. Cryptographic Chain-of-Custody
Every uploaded `.eml` file is immediately fingerprinted with deterministic **SHA-256 hashing** at ingestion. In Phase 2 mode, evidence is stored encrypted at rest using **Fernet (AES-128-CBC + HMAC)** inside the secure evidence vault.

### 2. Multi-Hop Received Header Tracing
Reconstructs the full SMTP transmission path in chronological order, identifies internal vs external relays based on trust boundaries, and extracts the earliest reliable non-private sender IP address.

### 3. Authentication Verification (SPF, DKIM, DMARC)
Parses `Authentication-Results` headers and executes live DNS lookups to verify domain reputation, detecting spoofed display names, lookalike domains (using Levenshtein edit distance against protected domains), and sender mismatches.

### 4. GeoLocation & Network Topology
Resolves geographic coordinates (City, Country, Latitude, Longitude, ISP, ASN) for the originating and relay servers via MaxMind GeoIP and WHOIS/RDAP queries.

### 5. Hybrid CPU/GPU Machine Learning
- **Zero-Dependency Baseline (CPU)**: TF-IDF feature extractor paired with a tuned classifier for sub-millisecond, lightweight scoring.
- **Transformer Inference (GPU)**: CUDA acceleration on NVIDIA RTX 3050 laptops (with automatic fallback to CPU if GPU is unavailable).

### 6. Correlation Graph & Campaign Clustering
Correlates entities (sender domains, infrastructure IPs, subject lines, IOCs) across disparate cases using **NetworkX** and TF-IDF cosine similarity to unmask coordinated phishing campaigns.

### 7. Digitally Signed Forensic Reports
Exports comprehensive forensic dossiers in both **JSON** and **PDF** formats, digitally signed with **HMAC-SHA256** (or **RSA-PSS**) to guarantee evidentiary admissibility and tamper detection in court.

---

## 📂 Repository Structure

```
SIH26106/
├── backend/                       # Core FastAPI backend & forensic pipeline
│   ├── app.py                     # Application entrypoint & static mount
│   ├── api/routes.py              # REST API endpoints
│   ├── auth/                      # SPF, DKIM, DMARC validation
│   ├── db/                        # SQLite SQLAlchemy models & session
│   ├── forensics/                 # Header analysis & hop tracing
│   ├── graph/                     # NetworkX correlation & campaign clustering
│   ├── indicators/                # IOC extractor & lookalike detection
│   ├── intelligence/              # GeoIP resolution & DNS RDAP lookup
│   ├── ml/                        # Hybrid ML models (baseline + transformer)
│   ├── parsers/                   # RFC 5322 MIME parser & SHA-256 hashing
│   ├── reports/                   # PDF & JSON report generators
│   ├── scoring/                   # Multi-factor threat scoring engine
│   └── security/                  # Evidence vault, RBAC, digital signing
├── frontend/                      # Standalone zero-dependency dashboard UI
│   └── index.html                 # Complete interactive SOC workbench UI
├── frontend-react/                # Modern React + Vite + TypeScript interface
│   ├── src/                       # Tactical command UI components
│   ├── package.json               # Frontend dependencies
│   └── vite.config.ts             # Vite configuration
├── models/                        # Serialized ML models & metrics
│   ├── baseline_tfidf.joblib      # Pre-trained baseline model weights
│   └── baseline_metrics.json      # Model performance statistics
├── data/                          # Dataset & resources
│   ├── sample_dataset.csv         # Labeled email threat training dataset
│   ├── geoip/README.md            # MaxMind GeoLite2 setup instructions
│   └── reports/.gitkeep           # Storage directory for forensic reports
├── scripts/                       # Generation & utility scripts
│   ├── create_sample_eml.py       # Synthetic phishing email generator
│   └── build_*_guide.py           # Documentation compilers
├── tests/                         # Automated unit & integration tests
│   ├── test_basic.py              # Test suite covering PRD criteria
│   ├── sample_phishing.eml        # Crafted demo phishing email
│   └── sample_phishing_2.eml      # Multi-sample campaign email
├── GUIDE.md                       # Comprehensive setup, GPU, & demo guide
├── requirements.txt               # Python package dependencies
├── run.bat                        # Windows 1-click launch batch script
└── README.md                      # This documentation file
```

---

## ⚡ Quick Start

### Option A: 1-Click Launch on Windows (Recommended)

Simply double-click or run:
```cmd
run.bat
```
`run.bat` automatically:
1. Detects or creates the Python virtual environment (`venv`).
2. Checks and verifies core dependencies.
3. Automatically trains the baseline ML model if not already present.
4. Starts the Uvicorn server at `http://localhost:8000`.
5. Opens your default web browser directly to the dashboard at `http://localhost:8000/app/`.

---

### Option B: Manual CLI Setup (Windows / Linux / macOS)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   cd <YOUR_REPOSITORY_NAME>
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows:
   python -m venv venv
   venv\Scripts\activate

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Train the baseline classifier (takes < 2 seconds):**
   ```bash
   python -m backend.ml.train_baseline --data data/sample_dataset.csv
   ```

5. **Start the forensic intelligence server:**
   ```bash
   uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Access the application:**
   - **Interactive Forensic Dashboard:** [http://localhost:8000/app/](http://localhost:8000/app/)
   - **Interactive API Documentation (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Alternative ReDoc API Reference:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Running Automated Tests

Run the test suite to verify end-to-end functionality:
```bash
pytest tests/test_basic.py -v
```

The automated test suite verifies:
- Deterministic SHA-256 evidence hashing
- RFC 5322 header parsing & Received chain hop extraction
- Originating IP candidate selection & trust boundaries
- Authentication-Results header parsing (SPF/DKIM/DMARC)
- Levenshtein lookalike domain & typosquatting detection
- Threat scoring stability and graceful degradation
- End-to-end report generation and signature verification

---

## 📡 API Reference Overview

| HTTP Method | Endpoint | Description |
|:------------|:---------|:------------|
| `GET` | `/api/health` | System health check & GPU/CPU acceleration state |
| `POST` | `/api/cases` | Create a new forensic investigation case |
| `GET` | `/api/cases` | List all investigation cases |
| `POST` | `/api/cases/{case_id}/evidence` | Upload & ingest `.eml` evidence file (SHA-256 hashed) |
| `POST` | `/api/cases/{case_id}/analyze` | Trigger full forensic analysis pipeline |
| `GET` | `/api/cases/{case_id}/graph` | Retrieve NetworkX entity correlation graph |
| `GET` | `/api/cases/{case_id}/report` | Export digitally signed forensic report (JSON/PDF) |
| `POST` | `/api/verify-report` | Verify digital signature & integrity of a report |
| `GET` | `/api/campaigns` | View cross-case campaign clustering results |

---

## 🛡️ Security & Evidence Integrity

- **Evidence Vault**: Protects evidence at rest with symmetric authenticated encryption (**Fernet AES-128-CBC + HMAC-SHA256**).
- **Report Signing**: Generates cryptographic proof of report authenticity using HMAC-SHA256 (or asymmetric RSA-PSS), allowing courts and third-party investigators to verify that findings have not been altered.
- **RBAC**: Role-Based Access Control enforcing `analyst`, `lead`, and `admin` permissions on sensitive actions.

---

## 👥 Hackathon Team & Acknowledgements

Developed for **Smart India Hackathon (SIH 2026)**  
**Problem Statement ID:** SIH26106  
**Project Name:** JAALBHEDI (जाठभेदी)  

*Built with security, speed, and evidentiary rigor in mind.*
