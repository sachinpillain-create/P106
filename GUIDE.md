# SIH26106 Prototype — Setup & Build Guide

**AI-Powered Email Threat Detection, GeoLocation and Forensic Intelligence Platform**
Target machine: Intel i5-13420H · 16 GB RAM · NVIDIA RTX 3050 Laptop GPU (6 GB) · Windows 11

This guide walks you from a fresh laptop to a running, demoable prototype. It matches the
architecture in the PRD: **CPU handles all deterministic forensics, GPU accelerates the
ML classifier only, and the whole system keeps working if the GPU is unavailable.**

---

## 0. What you're getting

```
sih26106/
  backend/
    app.py                    FastAPI entrypoint
    api/routes.py              All API endpoints (case -> upload -> analyze -> report)
    parsers/email_parser.py    RFC 5322 / MIME parsing, hashing
    forensics/header_analyzer.py   Received-chain reconstruction, trust boundaries
    auth/spf_dkim_dmarc.py     Authentication-Results parsing + optional DNS checks
    indicators/ioc_extractor.py URL/lookalike-domain/content-cue detection
    intelligence/geoip.py      MaxMind GeoLite2 local lookups
    intelligence/dns_rdap.py   MX/RDAP domain intelligence
    ml/train_baseline.py       Trains the CPU TF-IDF baseline classifier
    ml/inference.py            Hybrid CPU/GPU inference engine (the core of "hybrid" architecture)
    scoring/engine.py          Explainable weighted score fusion
    graph/correlation.py       NetworkX investigation graph
    reports/forensic_report.py PDF + JSON forensic report generation
    security/sanitizer.py      HTML sanitization, upload limits, path safety
    security/evidence_vault.py Fernet encryption for evidence at rest (Phase 2)
    security/rbac.py           Role-based access control, API-key enforced (Phase 2)
    security/report_signing.py HMAC/RSA-PSS digital report signing + verification (Phase 2)
    graph/campaign_clustering.py TF-IDF campaign clustering across emails (Phase 2)
    db/                        SQLAlchemy models + SQLite session management
  frontend/index.html          Single-page dashboard (served at /app)
  data/
    sample_dataset.csv         30-row labeled dataset (REPLACE before real training)
    geoip/README.md            How to get the free MaxMind database
  tests/
    test_basic.py              14 automated tests covering the pipeline
    sample_phishing.eml        Crafted demo phishing email (synthetic, safe)
  scripts/create_sample_eml.py Regenerates the demo email
  requirements.txt
```

Everything has already been built and tested end-to-end in a Linux sandbox (no GPU) —
22/22 automated tests pass, and the full case → upload → analyze → sign → verify → PDF
report flow was verified against crafted phishing emails, including evidence encryption
at rest, digital-signature tamper detection, RBAC role enforcement, and campaign
clustering across related emails. What's left is laptop-specific: installing CUDA-enabled
PyTorch, getting the GeoIP database, and optionally fine-tuning a real transformer
classifier.

---

## 1. Install prerequisites (Windows 11)

1. **Python 3.11 or 3.12** — https://www.python.org/downloads/windows/ (check "Add to PATH" during install)
2. **Git** (optional but recommended) — https://git-scm.com/download/win
3. **NVIDIA drivers** — make sure your RTX 3050 has a current Game Ready or Studio driver
   (Settings → check in NVIDIA Control Panel, or run `nvidia-smi` in PowerShell — it should
   list your GPU and a CUDA version).

Open **PowerShell** and confirm:
```powershell
python --version        # should show 3.11.x or 3.12.x
nvidia-smi               # should show RTX 3050 and a CUDA version (e.g. 12.4)
```

---

## 2. Unpack the project and create a virtual environment

```powershell
cd C:\Users\<you>\Documents
# unzip sih26106.zip here, then:
cd sih26106

python -m venv venv
venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt
```

You now have FastAPI, the forensics/auth/scoring modules, scikit-learn, NetworkX, ReportLab,
and geoip2 installed. This is enough to run the **entire prototype on CPU** already —
the GPU-accelerated transformer is an upgrade you add in Section 4.

---

## 3. First run (CPU-only, works immediately)

```powershell
# 1. Train the baseline classifier (takes a few seconds)
python -m backend.ml.train_baseline --data data/sample_dataset.csv

# 2. Start the server
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Open a browser to:
- **http://localhost:8000/app/** — the dashboard
- **http://localhost:8000/docs** — interactive API reference (Swagger UI)
- **http://localhost:8000/api/health** — confirms CPU/GPU status as JSON

In the dashboard: click **Create new case** → **Choose File** → pick
`tests/sample_phishing.eml` → **Ingest & hash evidence** → **Run full analysis**.
You should see the full threat score breakdown, relay chain, authentication panel,
and URL indicators populate, matching what's shown in this conversation's screenshots.

> ⚠️ The sample dataset in `data/sample_dataset.csv` has only 30 rows and exists purely
> to prove the training pipeline works. Replace it with a real labeled phishing/BEC
> dataset before you trust the classifier's numbers (see Section 6).

---

## 4. Enable GPU acceleration (RTX 3050, Stage B classifier)

The baseline TF-IDF model always runs on CPU (by design — PRD Section 18 Stage A). To get
the GPU-accelerated transformer (Stage B) working:

### 4.1 Install CUDA-enabled PyTorch

Check your CUDA version from `nvidia-smi`, then install the matching PyTorch build.
For most current RTX 3050 laptops (CUDA 12.x driver):

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cu121
pip install transformers accelerate
```

Verify:
```powershell
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```
This should print `True RTX 3050 Laptop GPU` (or similar). If it prints `False`, your
PyTorch build doesn't match your driver's CUDA version — check
https://pytorch.org/get-started/locally/ and pick the matching command.

### 4.2 Get a labeled phishing/BEC dataset

The PRD (Section 19) wants a real dataset with train/test split by campaign or domain
(to avoid leakage). Good starting points:
- Kaggle: search "phishing email dataset" (several public, labeled datasets exist)
- Nazario phishing corpus (classic academic phishing corpus)
- Enron dataset (for legitimate/benign email baseline)

Format it as a CSV with `text` and `label` columns exactly like `data/sample_dataset.csv`,
just with thousands of rows and balanced classes (`phishing`, `legitimate`, and optionally
`impersonated`/`fraud` if you want finer-grained categories).

### 4.3 Fine-tune a compact transformer

Create `backend/ml/train_transformer.py` (not included by default, since dataset choice
is yours) following this pattern — this respects the PRD's 6GB VRAM budget:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
import pandas as pd
from datasets import Dataset

MODEL_NAME = "distilbert-base-uncased"   # compact, fits comfortably in 6GB VRAM

df = pd.read_csv("data/your_real_dataset.csv")
labels = sorted(df["label"].unique())
label2id = {l: i for i, l in enumerate(labels)}
id2label = {i: l for l, i in label2id.items()}
df["label_id"] = df["label"].map(label2id)

dataset = Dataset.from_pandas(df[["text", "label_id"]]).train_test_split(test_size=0.2, seed=42)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
def tokenize(batch):
    return tokenizer(batch["text"], truncation=True, padding="max_length", max_length=256)
dataset = dataset.map(tokenize, batched=True)

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=len(labels), id2label=id2label, label2id=label2id
)

args = TrainingArguments(
    output_dir="models/transformer_phishing",
    per_device_train_batch_size=4,       # PRD 18/24: small batches for 6GB VRAM
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    fp16=True,                            # PRD 18: mixed precision where stable
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    logging_steps=20,
)

trainer = Trainer(
    model=model, args=args,
    train_dataset=dataset["train"], eval_dataset=dataset["test"],
)
trainer.train()
trainer.save_model("models/transformer_phishing")
tokenizer.save_pretrained("models/transformer_phishing")
```

```powershell
pip install datasets
python -m backend.ml.train_transformer
```

Once `models/transformer_phishing/` exists, `backend/ml/inference.py` will automatically
pick it up and run it on CUDA — no other code changes needed. Restart the server and
check `/api/health`: `cuda_available` should now show `true`, and analysis results will
show `"device_used": "cuda"` for the ML signal family.

If the transformer ever fails to load (bad checkpoint, out-of-memory, driver issue),
`classify()` in `inference.py` automatically falls back to the CPU baseline — this is
tested and intentional (PRD Section 15).

---

## 5. Get the local GeoIP database (for the map/geolocation panel)

Without this, geolocation results show `source: "no_local_database"` — everything else
still works. To populate real country/city/ASN data:

1. Free account: https://www.maxmind.com/en/geolite2/signup
2. Generate a license key under **My Account → Manage License Keys**
3. Download `GeoLite2-City.mmdb` and `GeoLite2-ASN.mmdb`
4. Place both in `data/geoip/`

Restart the server — no config changes needed, `backend/intelligence/geoip.py` detects
the files automatically.

---

## 6. Configure protected domains and trusted relays

Two settings in `backend/api/routes.py` you should edit for your specific demo:

```python
# Domains you want lookalike-detection to protect (e.g. your institution, or brands
# your demo scenario impersonates)
PROTECTED_DOMAINS = ["yourcollege.edu", "paypal.com", "yourbank.com"]

# Hostnames of mail relays YOU control/trust (e.g. your institution's real mail
# gateway) — used by the Received-chain trust-boundary logic in header_analyzer.py.
# Leave empty to conservatively treat every hop as untrusted (safe default).
TRUSTED_RELAY_HOSTNAMES = ["mail.yourcollege.edu"]
```

---

## 7. Running the test suite

```powershell
pip install pytest
pytest tests/test_basic.py -v
```

All 14 tests should pass. These cover hashing determinism, header parsing, trust-boundary
logic, auth parsing, URL/lookalike detection, HTML sanitization, and the full score-fusion
pipeline — re-run this after any code change.

---

## 8. Demo script (PRD Section 20)

This matches the PRD's recommended judge demonstration flow:

1. Open the dashboard, click **Create new case**.
2. Upload `tests/sample_phishing.eml` (or regenerate a fresh one with
   `python scripts/create_sample_eml.py`, or craft your own impersonation scenario).
3. Point out the **SHA-256 hash** appearing immediately — evidence preserved before
   any analysis runs.
4. Click **Run full analysis**. Walk through, top to bottom:
   - **Threat score** — call out that it's a weighted sum of 5 explainable signal
     families, not a black box.
   - **Authentication panel** — SPF/DKIM/DMARC all failing on the crafted sample.
   - **Received-chain relay path** — show the hop table and the trust-level tags;
     explain *why* hops are marked untrusted (sender-writable) rather than assumed true.
   - **Geolocation panel** — explicitly state this is *infrastructure* location, not
     attacker location (the caveat is baked into every result).
   - **URL & content indicators** — the IP-literal URL and the punycode lookalike domain.
   - Note the **device badge** (`cpu` or `cuda`) next to the ML signal — if you've done
     Section 4, this is your moment to show GPU acceleration live via Task Manager's
     GPU graph while clicking Analyze.
5. Click **Generate PDF/JSON report** → open the PDF → show the chain-of-custody section
   and disclaimer.
6. (Optional, if you have 2+ related emails in one case) Hit
   `GET /api/cases/{case_id}/graph` in `/docs` to show shared-infrastructure correlation
   across emails.

---

## 9. Common issues

| Symptom | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: backend` | Running uvicorn from wrong directory | Run from the `sih26106/` root, not inside `backend/` |
| `cuda_available: false` after installing torch | PyTorch CPU-only wheel installed | Reinstall with the `--index-url` cu121 command in Section 4.1 |
| GeoIP always shows `no_local_database` | `.mmdb` files missing or misnamed | Confirm exact filenames `GeoLite2-City.mmdb` / `GeoLite2-ASN.mmdb` in `data/geoip/` |
| Baseline model `FileNotFoundError` | Forgot to train before first run | Run `python -m backend.ml.train_baseline` once |
| Upload returns 413 | File exceeds 25 MB limit | Adjust `MAX_UPLOAD_BYTES` in `backend/security/sanitizer.py` if you have a legitimate reason to raise it |
| DNS/RDAP lookups always empty | `enable_network` checkbox unchecked, or no internet during demo | This is intentional graceful degradation (PRD 15) — check the box if you have internet, otherwise it's fine for an offline demo |

---

## 10. Phase 2 features now included

These were originally listed as "left for you to extend" — they're now built, tested,
and wired into the API:

### Real DKIM cryptographic verification
`backend/auth/spf_dkim_dmarc.py` now uses `dkimpy` to actually fetch the signing
domain's public key over DNS and recompute the signature (not just parse whatever the
header claims). Check `authentication.dkim_cryptographically_verified` in the analysis
response — `true` means real crypto verification ran (requires "Enable network lookups"
checked); `false` means it fell back to header-claimed results only.

### Encrypted evidence vault
Every uploaded `.eml` is now encrypted at rest with Fernet (AES-128 + HMAC) before being
written to `evidence/`. A local key is auto-generated on first run at `data/vault.key` —
**back this file up** if you need to decrypt evidence later; losing it makes stored
evidence unrecoverable by design. See `backend/security/evidence_vault.py` for the
production-hardening notes (this is a laptop-appropriate key store, not a real KMS).

### Digital report signing
Every generated report now includes a `digital_signature` block (HMAC-SHA256 by
default). Verify any report with:
```
POST /api/reports/verify
Body: the full report JSON
```
It returns `{"valid": true/false, ...}` — `false` means the report was altered after
generation. A stronger RSA-PSS asymmetric mode is also implemented
(`sign_report_rsa`/`verify_report_rsa` in `report_signing.py`) if you want a third party
(e.g. a judge or law enforcement contact) to verify authenticity using only your public
key file (`data/rsa_public.pem`), never your signing secret.

### Role-based access control (RBAC)
Disabled by default (every request is treated as "admin" — frictionless for solo demo
use). To enable it for a multi-person team demo, set three environment variables before
starting the server:
```powershell
$env:SIH_APIKEY_ANALYST="choose-a-key"
$env:SIH_APIKEY_INVESTIGATOR="choose-a-key"
$env:SIH_APIKEY_ADMIN="choose-a-key"
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```
Then pass `X-API-Key: <key>` on requests. Role hierarchy: `analyst` < `investigator`
< `admin`. Report generation/download requires `investigator+`; case deletion requires
`admin`. Check `/api/rbac/status` to confirm whether it's active.

### Campaign clustering
`GET /api/cases/{case_id}/campaigns` groups emails in a case into probable campaigns
using TF-IDF content similarity combined with the existing infrastructure-sharing graph
— two emails are linked if their wording is near-duplicate (same phishing kit/template)
and/or they share an IP, domain, or ASN. Confidence is `"High"` when both signals agree,
`"Medium"` when only content matches. See `backend/graph/campaign_clustering.py` for the
documented upgrade path to true sentence-embedding similarity on your RTX 3050 if you
need to catch paraphrased (not just templated) campaign variants.

### Fully working transformer training script
`backend/ml/train_transformer.py` is complete and ready to run once you've done Section
4.1 (CUDA PyTorch install) — early stopping, mixed precision on CUDA, precision/recall/F1
tracking, and a `training_manifest.json` recording dataset/model versions per PRD Section
19. Run it exactly as shown in Section 4.3 above.

---

## 11. Updated test coverage

`tests/test_basic.py` now has 22 tests (up from 14), covering the new evidence
encryption round-trip and tamper detection, report signing round-trip and tamper
detection, RBAC role hierarchy enforcement, and campaign clustering. Run
`pytest tests/test_basic.py -v` after any change — all 22 should pass.

---

## 12. Where each tool from our earlier discussion fits in going forward

- **This backend/frontend code** — built and verified here; copy directly onto your laptop.
- **Antigravity** — use it locally for the CUDA/PyTorch install verification (Section 4),
  running the server, and live-iterating if you hit laptop-specific errors I can't
  reproduce in this sandbox (no GPU here).
- **Google AI Studio** — optional, for generating additional synthetic phishing/legitimate
  training examples if your real dataset is too small/imbalanced for Section 4.2, or for
  quickly sanity-checking classification quality before committing to a fine-tuning run.
