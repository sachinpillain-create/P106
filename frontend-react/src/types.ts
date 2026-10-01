export type OperationalUnit =
  | 'tactical-command'
  | 'live-memory-triage'
  | 'packet-inspector'
  | 'threat-forensics-matrix'
  | 'incident-investigation'
  | 'system-telemetry';

export interface ThreatScoreBreakdown {
  domainSpoofing: number; // e.g. 96
  payloadLink: number; // e.g. 92
  senderReputationDecay: number; // e.g. 84
  headerAnomaly: number; // e.g. 78
}

export interface RelayHop {
  hopNumber: string;
  ip: string;
  hostname: string;
  timestamp: string;
  role: string;
  country: string;
  status: 'UNTRUSTED / SUSPECT' | 'ZERO TRUST / MALICIOUS' | 'NEUTRAL CLOUD' | 'TRUSTED GATEWAY';
  statusColor: 'secondary' | 'outline' | 'tertiary';
}

export interface ExtractedPayload {
  url: string;
  category: 'CREDENTIAL HARVESTER' | 'DARKGATE DROPPER' | 'LEGITIMATE BENIGN' | 'C2 CALLBACK' | 'QUISH REDIRECT';
  severity: 'critical' | 'high' | 'benign';
  entropy: number;
  entropyLabel: string;
  details: string;
  vtDetections?: string;
  hosting?: string;
  domainAge?: string;
}

export interface SocialEngineeringIndicator {
  title: string;
  icon: string;
  description: string;
  severity: 'critical' | 'high' | 'warning';
}

export interface ForensicSpecimen {
  id: string;
  caseId: string;
  filename: string;
  filesize: string;
  engine: string;
  pipeline: string;
  sessionId: string;
  dateOpened: string;
  overallScore: number;
  riskClassification: 'CRITICAL THREAT // MALICIOUS' | 'HIGH RISK SUSPICIOUS' | 'MODERATE ADVISORY' | 'BENIGN VERIFIED';
  mimeHeaders: string[];
  sha256: string;
  md5: string;
  scores: ThreatScoreBreakdown;
  authTelemetry: {
    spf: { status: 'FAIL' | 'PASS' | 'SOFTFAIL'; details: string };
    dkim: { status: 'INVALID SIG' | 'VALID' | 'MISSING'; details: string };
    dmarc: { status: 'REJECT ENFORCED' | 'NONE' | 'QUARANTINE'; details: string };
    arc: { status: 'SEAL BROKEN' | 'PASS' | 'ABSENT'; details: string };
  };
  hops: RelayHop[];
  originGeo: {
    ip: string;
    location: string;
    asn: string;
    rdns: string;
    latency: string;
    coords: string;
  };
  forwardingGeo: {
    ip: string;
    location: string;
    asn: string;
    abuse: string;
    latency: string;
    coords: string;
  };
  payloads: ExtractedPayload[];
  socialIndicators: SocialEngineeringIndicator[];
  mitreTechniques: { code: string; name: string }[];
  confidence: number;
}

export interface MemoryProcess {
  pid: number;
  ppid: number;
  name: string;
  path: string;
  threads: number;
  handles: number;
  user: string;
  anomaly: string;
  severity: 'critical' | 'warning' | 'clean';
  rwxRegions: number;
  injectedDlls: string[];
}

export interface PacketItem {
  no: number;
  time: string;
  source: string;
  destination: string;
  protocol: 'TCP' | 'TLSv1.3' | 'SMTP' | 'DNS' | 'HTTP/2' | 'ARP';
  length: number;
  info: string;
  severity: 'flagged' | 'normal' | 'alert';
  hexDump: string[];
  asciiDump: string[];
}

export interface YaraRule {
  id: string;
  name: string;
  author: string;
  category: 'Phishing' | 'Dropper' | 'C2' | 'Ransomware' | 'APT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  tags: string[];
  matchesCount: number;
  ruleCode: string;
  lastUpdated: string;
}

export interface IncidentAlert {
  id: string;
  title: string;
  severity: 'P1 - CRITICAL' | 'P2 - HIGH' | 'P3 - MEDIUM' | 'P4 - LOW';
  status: 'CONTAINED' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED';
  time: string;
  assignee: string;
  tactics: string[];
  affectedEndpoints: number;
}
