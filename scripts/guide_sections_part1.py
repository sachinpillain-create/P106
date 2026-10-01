"""
guide_sections_part1.py
Contains the document metadata, Section 1 (Executive Summary), Section 2 (System Architecture),
and Section 3 (The 12-Stage Forensic Pipeline) for the JAALBHEDI Master Technical Guide.
"""

from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def build_part1(doc, add_styled_heading, add_body_paragraph, add_bullet_point, add_callout, format_table):
    # =========================================================================
    # DOCUMENT TITLE & METADATA
    # =========================================================================
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(30)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("JAALBHEDI / FORENSIC INTELLIGENCE WORKBENCH (FIW)")
    run_title.bold = True
    run_title.font.name = 'Calibri'
    run_title.font.size = Pt(22)
    run_title.font.color.rgb = RGBColor(10, 37, 64)

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(16)
    run_sub = p_sub.add_run("The Master Prototype Technical Reference, Forensic Architecture & Presentation Defense Manual\n"
                            "Comprehensive, Exhaustive Technical Specification (Zero-Omission Guide)")
    run_sub.font.name = 'Calibri'
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(74, 85, 104)

    # Metadata Summary Table
    meta_headers = ["Project Parameter", "System Specification Details"]
    meta_widths = [Inches(2.2), Inches(4.8)]
    meta_data = [
        ["Problem Statement ID", "SIH26106 (Smart India Hackathon 2026 — Ministry of Home Affairs / Cyber Crime Cells)"],
        ["Problem Statement Title", "AI-Powered Email Threat Detection, GeoLocation and Forensic Intelligence Platform"],
        ["System Identity", "JAALBHEDI — Forensic Intelligence Workbench (FIW)"],
        ["Theme & Category", "Blockchain & Cybersecurity / Smart Automation — Software (Hybrid Edge Architecture)"],
        ["Verification Status", "100% Verified against Codebase (22/22 Automated Pytest Test Suites Passing)"],
        ["Hardware Profile Target", "Intel Core i5-13420H (10 Cores, 16 Threads) · 16 GB DDR5 RAM · NVIDIA RTX 3050 (6GB VRAM) · Windows 11"],
        ["Core Architecture", "Decoupled Hybrid Compute: 100% Deterministic Forensics on CPU + Contextual NLP on CUDA GPU"],
        ["Target Beneficiaries", "Law Enforcement Cyber Cells, State Police Forensic Labs, Enterprise SOC Tier-1/2 Analysts, Universities"],
    ]
    format_table(doc, meta_widths, meta_headers, meta_data)

    add_callout(
        doc,
        "EXPLANATORY REQUIREMENT NOTE:",
        "This master reference manual is intentionally authored to provide comprehensive, granular coverage of the entire JAALBHEDI prototype without omitting any minor forensic, algorithmic, or architectural detail. In strict accordance with technical documentation requirements, every specialized technical concept, forensic mechanism, protocol standard, and cryptographic primitive is introduced using its official industry terminology accompanied immediately by an explanatory definition enclosed in brackets: Terminology (Meaning / Explanation in brackets).",
        title="DOCUMENT DESIGN & CONVERSATIONAL DEFENSE PURPOSE",
        hex_color="0A2540",
        bg_color="F1F5F9"
    )

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & PROBLEM CONTEXT
    # =========================================================================
    add_styled_heading(doc, "1. Executive Summary & Problem Context", 1)
    
    add_body_paragraph(
        doc,
        "Electronic mail remains the primary initial attack vector across global cyber operations, accounting for over 90% of enterprise security breaches. Modern adversaries have evolved far beyond crude, mass-distributed spam campaigns; they now deploy hyper-targeted Spear-Phishing (A targeted form of phishing where adversaries conduct prior reconnaissance to craft highly personalized emails tailored to specific individuals or organizations to maximize deception), Business Email Compromise / BEC (A sophisticated class of financial fraud where attackers spoof or compromise corporate executive or vendor accounts to deceive employees into redirecting multimillion-dollar wire payments or disclosing proprietary trade secrets), CEO Fraud (An executive impersonation attack wherein threat actors forge the identity of a Chief Executive Officer or Managing Director to demand urgent, out-of-band financial transactions), Invoice Redirection Fraud (A specialized corporate deception tactic where legitimate vendor payment details are surreptitiously substituted with attacker-controlled banking accounts during pending commercial settlements), and Brand Spoofing (The deceptive visual and technical impersonation of a well-known institution, such as a major banking portal or cloud service provider, designed to harvest sensitive user credentials).",
        bold_prefix="The Weaponization of Corporate Email: "
    )

    add_body_paragraph(
        doc,
        "When confronted with these sophisticated threats, conventional enterprise defense tools—predominantly legacy Secure Email Gateways / SEGs (Cybersecurity devices or cloud services deployed directly along the Simple Mail Transfer Protocol delivery path that inspect incoming and outgoing email traffic against static signatures, reputation blacklists, and rudimentary keyword heuristics)—suffer from profound structural and forensic failures:",
        bold_prefix="The Critical Breakdown of Legacy Defenses: "
    )

    add_bullet_point(
        doc,
        "Conventional spam filters assign an arbitrary percentage risk score (e.g., '87% Spam') generated by a closed neural network without providing itemized, human-understandable evidence. Forensic analysts and incident responders cannot verify which specific header fields, routing anomalies, or content patterns triggered the alert.",
        bold_prefix="1. Opaque 'Black-Box' Decision Engines: "
    )
    add_bullet_point(
        doc,
        "Attackers routinely forge the visible 'From:' display header while maintaining valid domain syntax. When attackers operate their own Mail Transfer Agent / MTA (A software application that transfers electronic mail messages between network hosts using SMTP, such as Postfix or Microsoft Exchange), they can easily prepend forged intermediate delivery records to misdirect forensic investigations.",
        bold_prefix="2. Susceptibility to Forged Delivery Headers: "
    )
    add_bullet_point(
        doc,
        "Automated alerts from commercial cloud email filters lack cryptographic preservation and unalterable chain-of-custody logging. Consequently, their printouts and alert logs are routinely dismissed in courtrooms for failing to fulfill mandatory statutory standards, specifically Section 65B of the Indian Evidence Act (A statutory legal provision in Indian jurisprudence governing the admissibility of electronic records in judicial proceedings, mandating strict proof of device integrity and tamper-free record generation) and the updated Bharatiya Sakshya Adhiniyam 2023 / BSA (The modernized statutory criminal evidence code of India that updates and replaces the historic 1872 Evidence Act, reinforcing strict technical standards for digital evidence integrity).",
        bold_prefix="3. Complete Inadmissibility in Legal Proceedings: "
    )
    add_bullet_point(
        doc,
        "Many emerging 'AI email filters' blindly forward raw incoming corporate emails to third-party public cloud Large Language Model / LLM (Massive artificial intelligence neural networks trained on broad web-scale text corpora that generate natural language responses) Application Programming Interfaces / APIs (Standardized software interfaces allowing separate computer programs to communicate with each other over network protocols). This practice constitutes an egregious corporate privacy violation and breaches statutory regulations such as India's Digital Personal Data Protection Act / DPDP Act 2023 (Statutory national legislation regulating the processing, storage, consent management, and cross-border transfer of personal digital data).",
        bold_prefix="4. Data Privacy Violations via External Cloud APIs: "
    )

    add_body_paragraph(
        doc,
        "The Forensic Intelligence Workbench / FIW (The technical system name for the JAALBHEDI platform, functioning as an explainable, tamper-evident email threat intelligence and forensic investigation environment) directly resolves this crisis. JAALBHEDI fuses deterministic protocol forensics (based on formal Internet standards), mathematical indicators, and local hybrid machine learning into a single unified platform. It operates entirely on-premise without transmitting email bodies to external servers, preserves evidence immutability through AES-128 authenticated encryption, reconstructs multi-hop routing paths across strict trust boundaries, mathematically verifies cryptographic domain keys, extracts suspicious lexical cues, and yields an explainable 0 to 100 Threat Score wherein every single point is backed by an audit-ready technical justification.",
        bold_prefix="The JAALBHEDI Paradigm Shift: "
    )

    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE & HYBRID EDGE DESIGN
    # =========================================================================
    add_styled_heading(doc, "2. System Architecture & Hardware Target (Hybrid CPU/GPU Design)", 1)

    add_body_paragraph(
        doc,
        "A foundational strength of JAALBHEDI is its engineered alignment with real-world edge hardware environments. Unlike cloud-native enterprise security platforms that demand massive, recurring cloud infrastructure subscriptions, JAALBHEDI was architected and benchmarked specifically for a mid-range forensic workstation or laptop. The designated hardware baseline is an Acer Aspire 7 workstation containing:",
        bold_prefix="Target Hardware Profile: "
    )

    hw_headers = ["Hardware Component", "Technical Specifications", "Forensic Allocation in JAALBHEDI"]
    hw_widths = [Inches(1.8), Inches(2.7), Inches(2.5)]
    hw_data = [
        ["Central Processing Unit\n(CPU)", "Intel Core i5-13420H\n• 10 Physical Cores (4 P-Cores + 6 E-Cores)\n• 16 Threads, up to 4.60 GHz Boost\n• 12 MB Intel Smart Cache", "100% of Deterministic Forensics: RFC MIME parsing, SHA-256 hashing, Received-chain reconstruction, SPF/DKIM verification, Levenshtein edit distance, GeoIP, and Score Fusion."],
        ["System Memory\n(RAM)", "16 GB DDR5 Dual-Channel\n• 5200 MT/s Memory Clock Speed\n• High-bandwidth low-latency memory", "Holds in-memory SQLite database cache, pre-parsed MIME structures, MaxMind MMDB memory-mapped trees, and scikit-learn TF-IDF matrices."],
        ["Graphics Processing Unit\n(GPU)", "NVIDIA GeForce RTX 3050 Laptop GPU\n• 6 GB GDDR6 Dedicated VRAM\n• Ampere Architecture (GA107 Die)\n• 2048 CUDA Cores, 64 Tensor Cores", "Strictly dedicated to Stage B NLP inference: Accelerates Transformer multi-head attention matrix multiplication using PyTorch CUDA FP16 half-precision."],
        ["Operating System\n(OS)", "Windows 11 64-Bit\n• PowerShell 7 / Windows Terminal\n• WSL2 (Windows Subsystem for Linux) ready", "Host OS executing FastAPI ASGI backend, Python 3.11 virtual environment, Uvicorn server, and React / Vanilla web clients."],
    ]
    format_table(doc, hw_widths, hw_headers, hw_data)

    add_styled_heading(doc, "2.1 The Architectural Separation Principle: Determinism vs Probabilism", 2)
    add_body_paragraph(
        doc,
        "In digital forensics and legal testimony, combining artificial intelligence with deterministic protocol checks must follow strict architectural boundaries. If a system allows a neural network to guess whether a digital signature is valid, the entire finding is scientifically invalid. JAALBHEDI strictly bifurcates computational tasks into two distinct hardware domains:",
        bold_prefix="Core Architectural Tenet: "
    )

    add_bullet_point(
        doc,
        "Central Processing Unit (CPU — The primary electronic circuitry within a computer that executes instructions comprising a computer program by performing fundamental arithmetic, logic, controlling, and input/output operations). In JAALBHEDI, the CPU executes 100% of all deterministic forensic operations: hashing raw bytes with SHA-256, parsing RFC 5322 MIME headers, evaluating RFC 1918 subnets, verifying DKIM public-key signatures via dkimpy, computing Levenshtein edit distance against protected domains, resolving MaxMind GeoLite2 binary databases, executing AES-128-CBC Fernet vault encryption, applying HMAC/RSA digital signatures, and calculating the final weighted score fusion. Because these tasks involve sequential control logic, string manipulation, and bitwise arithmetic, the CPU handles them with microsecond latency and zero GPU memory overhead.",
        bold_prefix="1. The Deterministic Protocol Domain (CPU-Bound): "
    )

    add_bullet_point(
        doc,
        "Graphics Processing Unit (GPU — A specialized electronic processor composed of thousands of compact, high-efficiency cores designed to rapidly manipulate and alter memory to accelerate the creation of images and massively parallel tensor mathematics). In JAALBHEDI, the GPU is strictly and exclusively allocated to Stage B Natural Language Processing (NLP — A branch of computer science and artificial intelligence concerned with giving computers the ability to understand text and spoken words in much the same way human beings can). Specifically, the GPU accelerates deep Transformer (A neural network architecture introduced by Vaswani et al. based on multi-head self-attention mechanisms that process input tokens in parallel to capture deep contextual relationships across sentences) sequence classification using NVIDIA CUDA (Compute Unified Device Architecture — A proprietary parallel computing platform and application programming interface model developed by NVIDIA allowing software engineers to use CUDA-enabled GPUs for general-purpose mathematical processing). The RTX 3050 utilizes FP16 (Half-Precision 16-Bit Floating Point Format — A numerical computer data format that occupies 16 bits in computer memory, doubling computational throughput and halving memory footprint on Tensor Cores compared to standard 32-bit floating point).",
        bold_prefix="2. The Probabilistic Contextual NLP Domain (GPU-Bound): "
    )

    add_styled_heading(doc, "2.2 Graceful Degradation & Zero-Downtime Fallback Mechanics", 2)
    add_body_paragraph(
        doc,
        "A critical vulnerability in most modern AI security prototypes is fragility: if an external model file is missing, if CUDA drivers fail, or if GPU Video Random-Access Memory (VRAM — Dedicated ultra-high-speed memory installed on dedicated graphics cards used to store neural network parameters, model weights, and intermediate tensor activation states) is exhausted, the entire application crashes with an Out-of-Memory / OOM error. JAALBHEDI solves this via an automated, silent, zero-downtime fallback mechanism implemented inside backend/ml/inference.py:",
        bold_prefix="Resilient Fault-Tolerant Design: "
    )

    add_bullet_point(
        doc,
        "When an email is submitted for threat analysis, the classify() inference orchestrator first attempts to load the fine-tuned Transformer model (DistilBERT or MiniLM) onto the CUDA GPU device.",
        bold_prefix="Step 1 (Preferred GPU Execution): "
    )
    add_bullet_point(
        doc,
        "If any failure occurs—such as torch not being installed, NVIDIA CUDA drivers being absent, the GPU checkpoint folder not existing, or a CUDA Out-of-Memory exception being thrown—the system catches the exception silently within 5 milliseconds.",
        bold_prefix="Step 2 (Silent Exception Interception): "
    )
    add_bullet_point(
        doc,
        "The system instantaneously routes the text payload to Stage A: a lightweight, CPU-optimized Term Frequency-Inverse Document Frequency (TF-IDF — A numerical statistic intended to reflect how important a word is to a document in a collection or corpus) vectorizer coupled with a Logistic Regression (A supervised machine learning classification algorithm that models the probability of a discrete categorical outcome using a logistic sigmoid function) classifier trained on domain-specific lexical markers. The analysis completes seamlessly without raising an unhandled exception or dropping the user's connection.",
        bold_prefix="Step 3 (Instantaneous CPU Fallback): "
    )
    add_bullet_point(
        doc,
        "The ML prediction object explicitly records device_used: 'cuda' or device_used: 'cpu'. This parameter is surfaced directly onto the analyst's dashboard and forensic report as a visual badge, guaranteeing 100% transparency regarding which hardware subsystem produced the result.",
        bold_prefix="Step 4 (Device Attribution Provenance): "
    )

    add_styled_heading(doc, "2.3 Dual Operational Capabilities: Connected vs Air-Gapped Modes", 2)
    add_body_paragraph(
        doc,
        "Real-world forensic investigations frequently occur within strictly isolated, air-gapped military or police forensic laboratories where forensic workstations are forbidden from connecting to the public internet to prevent evidence leakage or remote malware communication. JAALBHEDI is natively engineered with a dual-mode operational switch:",
        bold_prefix="Operational Flexibility: "
    )

    add_bullet_point(
        doc,
        "In this standard mode, JAALBHEDI executes live Domain Name System (DNS — The hierarchical and decentralized naming system used to identify computers, services, and other resources reachable over the internet) TXT record queries to retrieve live SPF records, verifies live DKIM public keys directly from the domain's authoritative nameservers, and queries Registration Data Access Protocol (RDAP — A modern, structured RESTful protocol defined by ICANN that delivers domain registration data and ownership timestamps, succeeding legacy WHOIS) endpoints to evaluate domain registration age and registrar reputation.",
        bold_prefix="Mode A: Connected / Online Mode (Network Enabled): "
    )

    add_bullet_point(
        doc,
        "When the 'Enable network lookups' control is unchecked, JAALBHEDI completely disables all outbound socket connections. The authentication engine parses the existing, immutable Authentication-Results headers stamped into the email by the recipient's edge Mail Transfer Agent; the geolocation module queries the local offline MaxMind binary database stored on disk; and the ML engine executes offline on local CPU/GPU weights. All 22 automated test suites pass with 100% success in this completely offline mode, proving that JAALBHEDI has zero mandatory internet dependencies.",
        bold_prefix="Mode B: Air-Gapped / High-Security Offline Mode: "
    )

    # =========================================================================
    # SECTION 3: THE 12-STAGE FORENSIC PIPELINE
    # =========================================================================
    add_styled_heading(doc, "3. Complete Forensic Pipeline Breakdown (The 12 Exhaustive Stages)", 1)

    add_body_paragraph(
        doc,
        "To guarantee that an investigator can explain the JAALBHEDI prototype without leaving out any minor technical detail, this section walks through the complete lifecycle of evidence processing. The pipeline comprises twelve distinct, rigorously sequenced stages from initial intake to courtroom-ready export.",
        bold_prefix="End-to-End Pipeline Architecture: "
    )

    # Stage 1
    add_styled_heading(doc, "Stage 1: Case Management & Cryptographic Audit Ledger", 2)
    add_body_paragraph(
        doc,
        "The forensic process begins by initializing a formal case container via the POST /api/cases endpoint. A Universally Unique Identifier version 4 (UUIDv4 — A 128-bit pseudo-random mathematical identifier formatted as 32 hexadecimal digits separated by four hyphens, guaranteeing global uniqueness across distributed systems without central coordination) is generated as the case_id. Concurrently, an entry is written into the audit_events table within the SQLite database. Every subsequent user action—including evidence upload, full analysis execution, report export, and case deletion—is permanently logged in this ledger with an exact UTC (Coordinated Universal Time — The primary time standard by which the world regulates clocks and time) timestamp, the active actor role, the specific action taken, and the SHA-256 fingerprint of the affected evidence. This ledger guarantees an unbroken Chain of Custody (A documented, chronological trail demonstrating the unbroken custody, control, transfer, analysis, and physical disposition of digital evidence to satisfy legal admissibility standards).",
        bold_prefix="Audit Ledger Initialization: "
    )

    # Stage 2
    add_styled_heading(doc, "Stage 2: Evidence Intake, Ingestion & Immutable Vault Storage", 2)
    add_body_paragraph(
        doc,
        "Raw email files (.eml, .msg, or pasted MIME source) enter the system via the POST /api/cases/{case_id}/upload endpoint. The ingestion workflow follows a strict evidentiary preservation protocol:",
        bold_prefix="Cryptographic Intake Workflow: "
    )
    add_bullet_point(
        doc,
        "The raw byte length is checked against MAX_UPLOAD_BYTES (set to 25 Megabytes). If a file exceeds this ceiling, the API immediately halts execution with an HTTP 413 Payload Too Large exception to prevent Denial of Service (DoS — A cyber attack in which the perpetrator seeks to make a machine or network resource unavailable to its intended users by exhausting memory or CPU resources) vulnerabilities.",
        bold_prefix="1. Upload Ceiling Verification: "
    )
    add_bullet_point(
        doc,
        "Before any parsing, tokenization, or file system writes occur, JAALBHEDI calculates the Secure Hash Algorithm 256-bit (SHA-256 — A cryptographic hash function published by the National Institute of Standards and Technology that converts an arbitrary stream of input bytes into an immutable, unique 64-character hexadecimal digest) and Message Digest 5 (MD5 — A 128-bit cryptographic hash function widely used in digital forensics as a secondary legacy checksum for file verification). Crucially, the hash is computed directly over the raw, plaintext source bytes. This ensures that the fingerprint matches exactly what an external investigator or law enforcement officer obtains when running sha256sum on the source file using standard operating system tools.",
        bold_prefix="2. Deterministic Integrity Hashing: "
    )
    add_bullet_point(
        doc,
        "To protect Sensitive Personally Identifiable Information (PII — Any representation of information that permits the identity of an individual to whom the information applies to be reasonably inferred, including names, bank account numbers, and private correspondence) against disk theft or forensic workstation compromise, the raw bytes are encrypted at rest using Fernet (A high-level cryptographic recipe implemented in Python's cryptography package that guarantees symmetric encryption confidentiality and authenticity by combining AES-128 in Cipher Block Chaining mode with PKCS7 padding and an HMAC-SHA256 authentication tag). The encrypted ciphertext is written to evidence/{safe_filename}. The file permissions on disk are immediately locked to 0o444 (Read-Only Mode — An operating system file permission flag that prevents any user or process from modifying or overwriting the file contents).",
        bold_prefix="3. Encrypted Evidence Vault Storage: "
    )

    # Stage 3
    add_styled_heading(doc, "Stage 3: RFC 5322 & MIME Boundary Parsing", 2)
    add_body_paragraph(
        doc,
        "Once evidence is secured, the backend decrypts the ciphertext into memory and invokes backend/parsers/email_parser.py to unpack the email structure in strict compliance with RFC 5322 (The authoritative Internet Engineering Task Force standard defining the syntax, grammar, and structural rules for electronic mail message headers and bodies) and Multipurpose Internet Mail Extensions (MIME — A series of IETF standards defined in RFC 2045 through RFC 2049 that extend the basic email format to support non-ASCII text, multi-part message bodies, embedded HTML markup, and binary attachments).",
        bold_prefix="Structural Message Parsing: "
    )
    add_bullet_point(
        doc,
        "The parser extracts core envelope fields: Message-ID, Subject, From, Reply-To, Return-Path, Date, and all multi-line Received header blocks.",
        bold_prefix="Envelope Extraction: "
    )
    add_bullet_point(
        doc,
        "The parser decodes complex transfer encodings including Quoted-Printable (An encoding system defined in RFC 2045 that represents arbitrary 8-bit data using printable US-ASCII characters, typically denoted by '=XX' hex sequences) and Base64 (A binary-to-text encoding scheme that represents binary data in an ASCII string format by translating it into a radix-64 representation).",
        bold_prefix="MIME Decoding: "
    )
    add_bullet_point(
        doc,
        "If the email contains an HTML payload, the raw HTML markup is passed through Bleach (A whitelist-based Python HTML sanitization library that parses and cleans untrusted HTML markup by stripping disallowed tags, scripts, and attributes to prevent Cross-Site Scripting vulnerabilities). This prevents Cross-Site Scripting (XSS — A security vulnerability wherein malicious client-side scripts are injected into trusted web interfaces, potentially compromising an analyst's session or browser) from executing when the email body is rendered within the analyst HUD.",
        bold_prefix="HTML Sanitization (Bleach): "
    )

    # Stage 4
    add_styled_heading(doc, "Stage 4: Header Forensics & Received-Chain Relay Trace", 2)
    add_body_paragraph(
        doc,
        "Header forensics represents the primary investigative differentiator of JAALBHEDI. Attackers routinely manipulate visible email headers, but they cannot evade the physical transmission path recorded by mail transfer agents. The analyzer executes a multi-step algorithmic reconstruction:",
        bold_prefix="Relay Path Reconstruction: "
    )
    add_bullet_point(
        doc,
        "In raw MIME messages, each Mail Transfer Agent prepends its own Received: header to the top of the file as the message traverses the internet. Consequently, Received headers appear in newest-first order. JAALBHEDI reverses this list chronologically (bottom-to-top) to follow the physical journey of the packet from the sender's origin MTA to the recipient's internal inbox.",
        bold_prefix="1. Chronological Inversion: "
    )
    add_bullet_point(
        doc,
        "Using regular expressions conforming to RFC 5321 (Simple Mail Transfer Protocol — The foundational internet standard for email transmission across IP networks), the analyzer extracts the sending hostname ('from'), the originating IP address enclosed in brackets, the receiving host ('by'), the transport protocol ('with ESMTP'), the unique queue identifier ('id'), and the terminal timestamp separated by a semicolon.",
        bold_prefix="2. Grammar Regex Extraction: "
    )
    add_bullet_point(
        doc,
        "The extracted IP addresses are cross-referenced against RFC 1918 (Address Allocation for Private Internets — The IETF standard defining private IPv4 address spaces reserved for local internal networks, specifically 10.0.0.0/8, 172.16.0.0/12, and 192.168.0.0/16) as well as loopback (127.0.0.0/8) and link-local (169.254.0.0/16) subnets. Non-routable private IP addresses are identified and flagged so they are never erroneously assigned as public originators.",
        bold_prefix="3. RFC 1918 Private IP Pruning: "
    )
    add_bullet_point(
        doc,
        "JAALBHEDI does NOT make the naive assumption that every Received header is authentic. Attackers controlling their own mail server can forge arbitrary Received headers prior to handing the message off to external relays. JAALBHEDI solves this via a configurable Trust Boundary algorithm: The analyst can configure TRUSTED_RELAY_HOSTNAMES (the hostnames of their organization's known corporate mail gateway). The analyzer scans the chain; hops originating inside the trusted infrastructure are marked 'trusted'; the first external hop that handed the message to the trusted gateway is designated as the 'boundary'; and all prior hops further upstream are marked 'untrusted'. If no trusted hostnames are configured, the system conservatively marks all hops as untrusted-but-visible, preventing false investigative confidence.",
        bold_prefix="4. Trust Boundary Hop Classification: "
    )
    add_bullet_point(
        doc,
        "The analyzer identifies the earliest non-private, routable public IP address discovered chronologically in the chain. This IP is designated as the Candidate Origin IP, accompanied by an explicit caveat that it represents the earliest verifiable point of network injection.",
        bold_prefix="5. Earliest Candidate Origin IP Selection: "
    )
    add_bullet_point(
        doc,
        "JAALBHEDI inspects the RFC 5322 header trio: From, Reply-To, and Return-Path. It evaluates Display-Name vs Domain Mismatch (e.g., when the display name says 'State Bank of India Support' but the actual sending address is 'alerts@suspicious-domain.ru'), Reply-To Mismatch (where responses are covertly redirected to an external domain differing from the From domain), and Return-Path Mismatch (where automated bounce notifications point to a rogue drop-box). Each mismatch generates an itemized forensic finding weighted by severity (Low +10, Medium +20, High +35 points).",
        bold_prefix="6. Sender Identity Mismatch Heuristics: "
    )

    # Stage 5
    add_styled_heading(doc, "Stage 5: Cryptographic Protocol Authentication (SPF, DKIM, DMARC)", 2)
    add_body_paragraph(
        doc,
        "JAALBHEDI verifies the core trinity of email authentication protocols, distinguishing between pre-computed header assertions and genuine cryptographic proofs:",
        bold_prefix="Protocol Authentication Verification: "
    )
    add_bullet_point(
        doc,
        "Sender Policy Framework (SPF — An email authentication protocol defined in RFC 7208 that enables domain owners to publish DNS TXT records specifying the IP addresses authorized to send emails on behalf of their domain). JAALBHEDI evaluates whether the sending MTA IP is authorized, parsing results into PASS, FAIL, SOFTFAIL (~all), NEUTRAL, NONE, or PERMERROR.",
        bold_prefix="1. RFC 7208 SPF Evaluation: "
    )
    add_bullet_point(
        doc,
        "DomainKeys Identified Mail (DKIM — An email authentication protocol defined in RFC 6376 that uses public-key cryptography to verify that an email message originated from an authorized domain and that its body and header contents were not altered in transit). In addition to reading the stamped Authentication-Results header, JAALBHEDI incorporates a real cryptographic engine powered by dkimpy: When network access is enabled, it extracts the selector ('s=') and domain ('d=') from the DKIM-Signature header, performs a live DNS query to retrieve the published public key (from selector._domainkey.domain.com), and mathematically recomputes the SHA-256 cryptographic hashes across the headers and canonicalized body. If the signature matches the public key, dkim_cryptographically_verified is set to True. If verification fails or the signature is tampered, it asserts DKIM=FAIL.",
        bold_prefix="2. RFC 6376 DKIM Cryptographic Verification: "
    )
    add_bullet_point(
        doc,
        "Domain-based Message Authentication, Reporting, and Conformance (DMARC — An email authentication policy framework defined in RFC 7489 that leverages SPF and DKIM to determine the authenticity of an email message and specifies how receiving mail servers should handle failing messages). JAALBHEDI verifies whether the domain in the visible 'From:' header matches the domains validated by SPF and DKIM. It evaluates whether the domain owner has published an enforcement policy: 'p=none' (monitoring only), 'p=quarantine' (divert to spam folder), or 'p=reject' (block delivery outright).",
        bold_prefix="3. RFC 7489 DMARC Policy Alignment: "
    )

    # Stage 6
    add_styled_heading(doc, "Stage 6: Threat Indicators & IOC Extraction (URLs, Domains, Lexical Cues)", 2)
    add_body_paragraph(
        doc,
        "In accordance with strict forensic guidelines (PRD Section 8.4), JAALBHEDI extracts and normalizes all Indicators of Compromise (IOC — Forensic artifacts observed on a network or operating system that with high confidence indicate a computer intrusion or malicious cyber activity) from the email body, but NEVER visits or downloads remote links. Visiting attacker URLs during an investigation triggers Web Beacons (Transparent 1x1 tracking pixels or unique URLs embedded in email bodies designed to alert attackers that an email has been opened, thereby validating target victim active status). Extraction includes:",
        bold_prefix="Passive Indicator Extraction: "
    )
    add_bullet_point(
        doc,
        "URLs are parsed using urllib.parse to identify IP-Literal URLs (URLs where the host is an explicit IP address rather than a registered domain, e.g., http://192.0.2.1/login, heavily utilized in credential phishing to bypass domain reputation filters), Punycode / IDN Homograph URLs (Internationalized Domain Names translated into ASCII strings prefixed with 'xn--', used by attackers to substitute Cyrillic or Greek characters that look visually identical to Latin characters), Non-Standard Ports (URLs specifying ports other than 80 or 443, such as :8080 or :8443), and Open Redirect Parameters (URLs containing parameters like '?url=http://...' or '?redirect=http://...').",
        bold_prefix="1. Lexical URL Normalization & Flagging: "
    )
    add_bullet_point(
        doc,
        "JAALBHEDI protects high-value institutional and banking domains using Levenshtein Distance (A dynamic programming string metric calculating the minimum number of single-character edit operations—insertions, deletions, or substitutions—required to transform one string into another). If an embedded URL domain has an edit distance of 1 or 2 from a protected brand (e.g., 'paypa1.com' vs 'paypal.com', or 'yourco11ege.edu' vs 'yourcollege.edu'), it is immediately flagged as a high-severity lookalike domain.",
        bold_prefix="2. Lookalike Typo-Squatting Detection: "
    )
    add_bullet_point(
        doc,
        "The text is parsed against regex dictionaries targeting psychological social engineering cues: Urgency Cues ('act immediately', 'account suspended', 'final notice'), Credential Request Cues ('enter password', 'verify credentials', 'one-time password', 'security pin'), and Payment Request Cues ('wire transfer', 'update billing', 'routing number', 'invoice attached').",
        bold_prefix="3. Behavioral Content Cues: "
    )

    # Stage 7
    add_styled_heading(doc, "Stage 7: Infrastructure Geolocation & Threat Intelligence", 2)
    add_body_paragraph(
        doc,
        "JAALBHEDI translates candidate IP addresses into geographical and network routing intelligence using a local, offline MaxMind GeoLite2 binary database (.mmdb format). This database provides zero-latency memory-mapped lookups of physical coordinates (Latitude, Longitude), Country, Region, City, Internet Service Provider (ISP — An organization that provides services for accessing, using, or participating in the Internet), and Autonomous System Number (ASN — A globally unique identifier assigned to a group of IP routing prefixes operated by one or more network operators under a common routing policy).",
        bold_prefix="Geographic & Network Routing Attribution: "
    )
    add_callout(
        doc,
        "CRITICAL FORENSIC CAVEAT (PRD Section 15 & 25):",
        "JAALBHEDI explicitly labels all geolocation findings on the dashboard and in exported reports with the mandatory legal disclaimer: 'Geolocation reflects infrastructure location, not perpetrator physical location.' Attackers routinely route attack traffic through Virtual Private Networks (VPN), Tor exit nodes, compromised proxy servers, or foreign cloud hosting providers (e.g., DigitalOcean, Hetzner, AWS). Confusing server hosting location with attacker physical residence leads to false legal accusations.",
        title="LEGAL ATTRIBUTION DISCLAIMER",
        hex_color="007791",
        bg_color="F1F5F9"
    )

    # Stage 8
    add_styled_heading(doc, "Stage 8: Hybrid Machine Learning Threat Classification", 2)
    add_body_paragraph(
        doc,
        "The natural language payload (concatenated Subject and sanitized Body text) is dispatched to the hybrid ML inference engine. Depending on hardware availability, it executes Stage B (GPU Transformer) or Stage A (CPU TF-IDF Baseline), generating predicted class probabilities and explainable feature attributions.",
        bold_prefix="Contextual NLP Inference: "
    )

    # Stage 9
    add_styled_heading(doc, "Stage 9: Explainable 5-Family Weighted Score Fusion", 2)
    add_body_paragraph(
        doc,
        "The core mathematical synthesis of JAALBHEDI occurs in backend/scoring/engine.py. The final threat score S in [0, 100] is calculated by a weighted linear combination of five normalized signal families, ensuring that deterministic truth always grounds probabilistic AI. The complete mathematical formulation, penalty matrices, and severity thresholds are detailed in Section 4 of this guide.",
        bold_prefix="Deterministic Score Synthesis: "
    )

    # Stage 10
    add_styled_heading(doc, "Stage 10: Multi-Tenant Investigation Graph & Campaign Clustering", 2)
    add_body_paragraph(
        doc,
        "When an incident responder analyzes multiple suspicious emails within a case, JAALBHEDI activates two correlation modules:",
        bold_prefix="Cross-Incident Threat Correlation: "
    )
    add_bullet_point(
        doc,
        "Using NetworkX (A high-performance Python library for the creation, manipulation, and study of complex networks, graph structures, and relational topologies), the system constructs an undirected bipartite investigation graph. Emails are represented as central nodes linked to satellite entity nodes: IP addresses, domains, ASNs, sender addresses, and embedded URLs. The graph correlation engine isolates shared infrastructure across disparate emails, uncovering coordinated attack infrastructure.",
        bold_prefix="1. Relational Graph Correlation (NetworkX): "
    )
    add_bullet_point(
        doc,
        "Implemented in backend/graph/campaign_clustering.py, this module groups emails into campaigns using TF-IDF n-gram vectorization and Pairwise Cosine Similarity (A mathematical metric measuring the cosine of the angle between two non-zero vectors in an inner product space, evaluating topical and structural similarity regardless of document length). Email pairs with a cosine similarity >= 0.55 are linked using a Union-Find (A disjoint-set data structure that tracks partitioned non-overlapping subsets with near-constant time operations) algorithm. The system cross-references content clusters with the infrastructure graph: if emails share BOTH content templates and infrastructure, the campaign is assigned High Confidence; if they share only content templates, it is assigned Medium Confidence.",
        bold_prefix="2. Dual-Signal Campaign Clustering: "
    )

    # Stage 11
    add_styled_heading(doc, "Stage 11: Tamper-Evident Report Generation & Digital Signing", 2)
    add_body_paragraph(
        doc,
        "Forensic evidence must be exportable in formats suitable for corporate leadership, incident response partners, and judicial courts. JAALBHEDI generates two distinct report formats:",
        bold_prefix="Multi-Format Reporting: "
    )
    add_bullet_point(
        doc,
        "Structured Threat Information Expression version 2.1 (STIX 2.1 — A standardized, JSON-based serialization language developed by OASIS for communicating, storing, and sharing cyber threat intelligence in machine-readable format). STIX 2.1 dossiers can be ingested directly into enterprise SIEM (Security Information and Event Management) and SOAR (Security Orchestration, Automation, and Response) platforms.",
        bold_prefix="1. STIX 2.1 Intelligence Dossier: "
    )
    add_bullet_point(
        doc,
        "A formal, vector-rendered forensic intelligence PDF dossier generated dynamically using ReportLab (An open-source Python library for generating dynamic, vector-precise PDF documents programmatically). The PDF contains an executive threat summary, forensic findings, relay hop table, geolocation breakdown, and an unbroken audit ledger.",
        bold_prefix="2. Court-Admissible Forensic PDF: "
    )
    add_bullet_point(
        doc,
        "Before writing to disk, the report payload is canonicalized into deterministic JSON. In Mode 1 (Default), the payload is signed using HMAC-SHA256 (A keyed-hash message authentication code providing symmetric data integrity and authentication). In Mode 2 (Asymmetric), it is signed using 2048-bit RSA-PSS (Rivest-Shamir-Adleman Probabilistic Signature Scheme — An asymmetric digital signature algorithm incorporating randomized salt padding to provide provable security against existential forgery). A third party (e.g., a judge or opposing counsel) can verify the report's authenticity using only the public key (data/rsa_public.pem) via the POST /api/reports/verify endpoint. Any modification of a single byte, score, or timestamp causes verification to fail instantly.",
        bold_prefix="3. Digital Signature & Verification: "
    )

    # Stage 12
    add_styled_heading(doc, "Stage 12: Role-Based Access Control (RBAC) & Enterprise Governance", 2)
    add_body_paragraph(
        doc,
        "To protect forensic integrity in multi-analyst security operations centers, JAALBHEDI implements Role-Based Access Control (RBAC — A security authorization framework that restricts system operations and resource access according to defined user roles and privileges). Three hierarchical roles are enforced via FastAPI dependency injection checking the X-API-Key HTTP header:",
        bold_prefix="Access Control Architecture: "
    )
    add_bullet_point(
        doc,
        "Tier-1 SOC Analyst (Hierarchy Level 1). Can initialize cases, upload evidence, execute threat analysis, inspect headers, and view correlation graphs. Cannot decrypt raw vault evidence, generate digitally signed reports, or delete cases.",
        bold_prefix="1. Analyst Role (SIH_APIKEY_ANALYST): "
    )
    add_bullet_point(
        doc,
        "Senior Forensic Investigator (Hierarchy Level 2). Possesses all Analyst permissions, plus the legal authority to decrypt and download raw evidence from the encrypted vault and trigger the generation and digital signing of court-admissible forensic reports.",
        bold_prefix="2. Investigator Role (SIH_APIKEY_INVESTIGATOR): "
    )
    add_bullet_point(
        doc,
        "Forensic Lab Administrator (Hierarchy Level 3). Possesses full system authority, including the exclusive permission to delete cases and manage cryptographic vault keys. Crucially, case deletion logs an immutable audit event prior to purging, ensuring that record deletion can never occur silently.",
        bold_prefix="3. Admin Role (SIH_APIKEY_ADMIN): "
    )

    print("Part 1 built successfully.")
