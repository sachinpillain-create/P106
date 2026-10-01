import { ForensicSpecimen } from '../types';

export const INITIAL_SPECIMEN: ForensicSpecimen = {
  id: 'SPEC-01',
  caseId: '#CAS-2025-0894X',
  filename: 'phish_payroll_update_urgent.eml',
  filesize: '142.4 KB',
  engine: 'ML-YARA-v8.4.1',
  pipeline: 'PARALLEL DUAL-PASS',
  sessionId: 'SEC-99120-FX',
  dateOpened: '2025-05-18 14:22:09 UTC',
  overallScore: 88,
  riskClassification: 'CRITICAL THREAT // MALICIOUS',
  mimeHeaders: [
    'Received: from tor-exit-node-04.amsterdam.nl (185.220.101.44) by mta-relay.bulletproof-host.is',
    'From: "HR Portal Payroll Alert" <security-alert@corp-update-secure.com>',
    'Return-Path: <bounce-daemon@tor-exit-node-04.amsterdam.nl>',
    'Authentication-Results: spf=fail; dkim=fail (rsa-sha256 mismatch); dmarc=fail action=quarantine',
    'Message-ID: <202505181421.AX99812@corp-update-secure.com>',
    'Subject: [URGENT] Verify Mandatory Salary Allocation Before 17:00 UTC',
    'X-Originating-IP: [185.220.101.44]',
    'X-Mailer: PHPMailer 6.1.4 (https://github.com/PHPMailer/PHPMailer)',
    'Content-Type: multipart/alternative; boundary="----=_Part_99182_7718291.1716042062"',
    'X-Spam-Flag: YES (Hits: 14.8/5.0 - BAYES_99, URIBL_BLACK, SPF_FAIL)'
  ],
  sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  md5: 'd41d8cd98f00b204e9800998ecf8427e',
  scores: {
    domainSpoofing: 96,
    payloadLink: 92,
    senderReputationDecay: 84,
    headerAnomaly: 78
  },
  authTelemetry: {
    spf: {
      status: 'FAIL',
      details: 'Origin IP 185.220.101.44 is not permitted by domain corp-update-secure.com (mechanisms: -all)'
    },
    dkim: {
      status: 'INVALID SIG',
      details: 'Selector s1 failed. Cryptographic rsa-sha256 digest hash mismatch against public DNS key.'
    },
    dmarc: {
      status: 'REJECT ENFORCED',
      details: 'Policy flags: p=reject; pct=100; sp=reject. Mail disposition quarantined by receiver gateway.'
    },
    arc: {
      status: 'SEAL BROKEN',
      details: 'ARC-Seal header corrupted at intermediate hop. Untrusted relay modifications detected.'
    }
  },
  hops: [
    {
      hopNumber: '01',
      ip: '185.220.101.44',
      hostname: 'tor-exit-node-04.amsterdam.nl',
      timestamp: 'Timestamp: 14:21:02 UTC • Origin Socket',
      role: 'Origin Socket',
      country: 'NL',
      status: 'UNTRUSTED / SUSPECT',
      statusColor: 'secondary'
    },
    {
      hopNumber: '02',
      ip: '194.26.29.112',
      hostname: 'mta-relay.bulletproof-host.is',
      timestamp: 'Timestamp: 14:21:18 UTC • MTA Forwarder',
      role: 'MTA Forwarder',
      country: 'IS',
      status: 'ZERO TRUST / MALICIOUS',
      statusColor: 'secondary'
    },
    {
      hopNumber: '03',
      ip: '104.47.74.168',
      hostname: 'mail-eop-eur.outbound.protection.outlook.com',
      timestamp: 'Timestamp: 14:21:44 UTC • Commercial Gateway',
      role: 'Commercial Gateway',
      country: 'IE',
      status: 'NEUTRAL CLOUD',
      statusColor: 'outline'
    },
    {
      hopNumber: '04',
      ip: '10.0.4.12',
      hostname: 'internal-edge-filter.soc.corp.local',
      timestamp: 'Timestamp: 14:22:01 UTC • SOC Ingestion Node',
      role: 'SOC Ingestion Node',
      country: 'CORP SEC',
      status: 'TRUSTED GATEWAY',
      statusColor: 'tertiary'
    }
  ],
  originGeo: {
    ip: '185.220.101.44',
    location: 'Amsterdam, Netherlands (NL)',
    asn: 'AS60729 (Zwiebelfreunde e.V.)',
    rdns: 'unknown-exit.torproject.org',
    latency: '42ms',
    coords: '52.3676° N, 4.9041° E'
  },
  forwardingGeo: {
    ip: '194.26.29.112',
    location: 'Reykjavik, Iceland (IS)',
    asn: 'AS44050 (FlokiNET Ltd.)',
    abuse: 'abuse@flokinet.is',
    latency: '98ms',
    coords: '64.1466° N, 21.9426° W'
  },
  payloads: [
    {
      url: 'https://auth-login.corp-portal-sso.xyz/v2/login.php',
      category: 'CREDENTIAL HARVESTER',
      severity: 'critical',
      entropy: 4.88,
      entropyLabel: 'Entropy: 4.88 (High)',
      details: 'Domain Age: 3 Days • Hosting: Bulletproof Iceland',
      hosting: 'Bulletproof Iceland',
      domainAge: '3 Days'
    },
    {
      url: 'https://cdn-files-invoice.ru/download.zip',
      category: 'DARKGATE DROPPER',
      severity: 'critical',
      entropy: 7.92,
      entropyLabel: 'Entropy: 7.92 (Packed Executable)',
      details: 'YARA: win_malware_dropper_gen • VirusTotal: 58/72 Detections',
      vtDetections: '58/72 Detections'
    },
    {
      url: 'https://fonts.googleapis.com/css2',
      category: 'LEGITIMATE BENIGN',
      severity: 'benign',
      entropy: 2.10,
      entropyLabel: 'Entropy: 2.10 (Standard CSS)',
      details: 'TLS: Valid Alphabet Inc. Cert • Reputation: Clean'
    }
  ],
  socialIndicators: [
    {
      title: 'Artificially High Urgency',
      icon: 'alarm',
      description: 'Explicit threats detected: "Immediate account termination in 2 hours" triggers panic heuristic.',
      severity: 'critical'
    },
    {
      title: 'Identity Mismatch',
      icon: 'badge',
      description: "Header displays 'IT Helpdesk Security' while envelope sender resolves to external untrusted relay.",
      severity: 'critical'
    },
    {
      title: 'Zero-Width Characters',
      icon: 'visibility_off',
      description: 'Unicode zero-width non-joiners (\\u200C) embedded in Subject tokens to evade heuristic DLP filters.',
      severity: 'critical'
    }
  ],
  mitreTechniques: [
    { code: 'T1566.002', name: 'Spearphishing Link' },
    { code: 'T1204.002', name: 'Malicious File' },
    { code: 'T1071.001', name: 'Web Protocols' }
  ],
  confidence: 94.2
};

export const ALTERNATIVE_CASES: ForensicSpecimen[] = [
  INITIAL_SPECIMEN,
  {
    id: 'SPEC-02',
    caseId: '#CAS-2025-0895Y',
    filename: 'DarkGate_VBScript_Campaign.eml',
    filesize: '286.1 KB',
    engine: 'ML-YARA-v8.4.1',
    pipeline: 'HEURISTIC HEAP-TRACE',
    sessionId: 'SEC-99214-DK',
    dateOpened: '2025-05-18 11:05:44 UTC',
    overallScore: 94,
    riskClassification: 'CRITICAL THREAT // MALICIOUS',
    mimeHeaders: [
      'Received: from 195.123.246.88 (vps-de-frankfurt.node.io) by mx.target-corp.com',
      'From: "Accounts Payable" <invoicing@supplier-portal-check.top>',
      'Return-Path: <bounce@supplier-portal-check.top>',
      'Subject: Past Due Invoice #INV-881944.zip (Urgent Settlement)',
      'X-Originating-IP: [195.123.246.88]',
      'Authentication-Results: spf=fail; dkim=none; dmarc=fail'
    ],
    sha256: '9a77b8109d9494300438cfebdf929eecad2d294867fa47573fbf5f43aa130419',
    md5: '71bc4569e54a39009f583e789dd11802',
    scores: {
      domainSpoofing: 98,
      payloadLink: 99,
      senderReputationDecay: 90,
      headerAnomaly: 85
    },
    authTelemetry: {
      spf: { status: 'FAIL', details: 'SPF alignment failed for domain supplier-portal-check.top' },
      dkim: { status: 'MISSING', details: 'No cryptographic signature header presented' },
      dmarc: { status: 'REJECT ENFORCED', details: 'DMARC policy p=reject triggered' },
      arc: { status: 'ABSENT', details: 'No authenticated received chain' }
    },
    hops: [
      {
        hopNumber: '01',
        ip: '195.123.246.88',
        hostname: 'vps-de-frankfurt.node.io',
        timestamp: 'Timestamp: 11:02:19 UTC • Bulletproof VPS',
        role: 'Origin Socket',
        country: 'DE',
        status: 'ZERO TRUST / MALICIOUS',
        statusColor: 'secondary'
      },
      {
        hopNumber: '02',
        ip: '45.145.66.19',
        hostname: 'relay-hop.tor-exit.ru',
        timestamp: 'Timestamp: 11:04:30 UTC • Intermediate Relay',
        role: 'MTA Forwarder',
        country: 'RU',
        status: 'UNTRUSTED / SUSPECT',
        statusColor: 'secondary'
      },
      {
        hopNumber: '03',
        ip: '10.0.4.12',
        hostname: 'internal-edge-filter.soc.corp.local',
        timestamp: 'Timestamp: 11:05:44 UTC • SOC Node',
        role: 'SOC Ingestion Node',
        country: 'CORP SEC',
        status: 'TRUSTED GATEWAY',
        statusColor: 'tertiary'
      }
    ],
    originGeo: {
      ip: '195.123.246.88',
      location: 'Frankfurt, Germany (DE)',
      asn: 'AS208091 (HostEurope Cloud)',
      rdns: 'vps-de-frankfurt.node.io',
      latency: '28ms',
      coords: '50.1109° N, 8.6821° E'
    },
    forwardingGeo: {
      ip: '45.145.66.19',
      location: 'Moscow, Russia (RU)',
      asn: 'AS49505 (Selectel Ltd.)',
      abuse: 'abuse@selectel.ru',
      latency: '112ms',
      coords: '55.7558° N, 37.6173° E'
    },
    payloads: [
      {
        url: 'https://cdn-invoice-update.cc/client_update.vbs',
        category: 'DARKGATE DROPPER',
        severity: 'critical',
        entropy: 7.98,
        entropyLabel: 'Entropy: 7.98 (Obfuscated VBScript)',
        details: 'Automated loader invoking autoit3.exe with packed DLL shellcode'
      },
      {
        url: 'https://c2-stage3-beacon.cc/api/v1/ping',
        category: 'C2 CALLBACK',
        severity: 'critical',
        entropy: 6.42,
        entropyLabel: 'Entropy: 6.42 (Encrypted Heartbeat)',
        details: 'Matches DarkGate beacon jitter configuration'
      }
    ],
    socialIndicators: [
      {
        title: 'Bait Invoice Lure',
        icon: 'receipt',
        description: 'Impersonation of genuine corporate supplier AP accounts with counterfeit transaction IDs.',
        severity: 'critical'
      },
      {
        title: 'Obfuscated Attachment Extension',
        icon: 'extension_off',
        description: 'Double extension trick "INV_881944.pdf.vbs" exploiting Windows hidden known file extensions.',
        severity: 'critical'
      }
    ],
    mitreTechniques: [
      { code: 'T1204.002', name: 'Malicious File' },
      { code: 'T1059.005', name: 'Visual Basic' },
      { code: 'T1055', name: 'Process Injection' }
    ],
    confidence: 97.8
  },
  {
    id: 'SPEC-03',
    caseId: '#CAS-2025-0896Z',
    filename: 'CEO_Wire_Transfer_BEC.eml',
    filesize: '64.2 KB',
    engine: 'ML-YARA-v8.4.1',
    pipeline: 'NLP-LOOKALIKE-ENGINE',
    sessionId: 'SEC-99308-BC',
    dateOpened: '2025-05-18 09:18:12 UTC',
    overallScore: 82,
    riskClassification: 'HIGH RISK SUSPICIOUS',
    mimeHeaders: [
      'Received: from mail-relay-92.sec-hosted.net (89.187.168.10)',
      'From: "Arthur Pendelton (CEO)" <arthur.pendelton@corpp-group.com>',
      'Reply-To: <ceo-office-direct@protonmail.com>',
      'Subject: Confidential M&A Acquisition Wire Instructions (Strictly NDA)',
      'Authentication-Results: spf=pass; dkim=pass; dmarc=none'
    ],
    sha256: '38a1158ccbe9e63459c34a2e88a0e28f237bf32d88a6d7f02273614271baee91',
    md5: '88bc34102919aa01827461937ffcc819',
    scores: {
      domainSpoofing: 94,
      payloadLink: 45,
      senderReputationDecay: 96,
      headerAnomaly: 89
    },
    authTelemetry: {
      spf: { status: 'PASS', details: 'Attacker registered typo-squatted domain corpp-group.com' },
      dkim: { status: 'VALID', details: 'Signed by malicious lookalike domain selector' },
      dmarc: { status: 'NONE', details: 'Spoofed lookalike domain has no restrictive DMARC' },
      arc: { status: 'PASS', details: 'ARC-Seal preserved across relay' }
    },
    hops: [
      {
        hopNumber: '01',
        ip: '89.187.168.10',
        hostname: 'mail-relay-92.sec-hosted.net',
        timestamp: 'Timestamp: 09:16:04 UTC • Origin Relay',
        role: 'Origin Socket',
        country: 'CH',
        status: 'UNTRUSTED / SUSPECT',
        statusColor: 'secondary'
      },
      {
        hopNumber: '02',
        ip: '10.0.4.12',
        hostname: 'internal-edge-filter.soc.corp.local',
        timestamp: 'Timestamp: 09:18:12 UTC • SOC Gateway',
        role: 'SOC Ingestion Node',
        country: 'CORP SEC',
        status: 'TRUSTED GATEWAY',
        statusColor: 'tertiary'
      }
    ],
    originGeo: {
      ip: '89.187.168.10',
      location: 'Zurich, Switzerland (CH)',
      asn: 'AS60068 (Datacamp Ltd)',
      rdns: 'mail-relay-92.sec-hosted.net',
      latency: '34ms',
      coords: '47.3769° N, 8.5417° E'
    },
    forwardingGeo: {
      ip: '10.0.4.12',
      location: 'Private Cloud (HQ)',
      asn: 'AS-CORP-INTERNAL',
      abuse: 'soc@corp.internal',
      latency: '2ms',
      coords: '37.7749° N, 122.4194° W'
    },
    payloads: [
      {
        url: 'mailto:ceo-office-direct@protonmail.com',
        category: 'CREDENTIAL HARVESTER',
        severity: 'high',
        entropy: 3.4,
        entropyLabel: 'Entropy: 3.4 (Reply-To Divergence)',
        details: 'Reply-To redirects communications off corporate mail systems'
      }
    ],
    socialIndicators: [
      {
        title: 'Executive Impersonation (BEC)',
        icon: 'supervisor_account',
        description: 'Lookalike domain registered 12 hours prior: corpp-group.com (double "p" typo).',
        severity: 'critical'
      },
      {
        title: 'Urgent Wire Request Pressure',
        icon: 'payments',
        description: 'Demands immediate $480,000 escrow transfer bypassing standard two-signatory audit.',
        severity: 'critical'
      }
    ],
    mitreTechniques: [
      { code: 'T1566.001', name: 'Spearphishing Attachment / BEC' },
      { code: 'T1586.002', name: 'Email Accounts' }
    ],
    confidence: 91.5
  }
];
