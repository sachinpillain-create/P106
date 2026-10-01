import { MemoryProcess, PacketItem, YaraRule, IncidentAlert } from '../types';

export const MOCK_PROCESSES: MemoryProcess[] = [
  {
    pid: 4820,
    ppid: 924,
    name: 'svchost.exe',
    path: 'C:\\Windows\\System32\\svchost.exe',
    threads: 18,
    handles: 412,
    user: 'NT AUTHORITY\\SYSTEM',
    anomaly: 'Hollowed Process (PE header unmapped, injected payload in RWX section)',
    severity: 'critical',
    rwxRegions: 3,
    injectedDlls: ['loader64.dll', 'hook_amsi.dll']
  },
  {
    pid: 3108,
    ppid: 4820,
    name: 'powershell.exe',
    path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    threads: 8,
    handles: 198,
    user: 'CORP\\m.jenkins',
    anomaly: 'EncodedCommand Base64 payload attempting memory reflection',
    severity: 'critical',
    rwxRegions: 1,
    injectedDlls: ['clr.dll', 'amsi.dll (Patched)']
  },
  {
    pid: 680,
    ppid: 592,
    name: 'lsass.exe',
    path: 'C:\\Windows\\System32\\lsass.exe',
    threads: 24,
    handles: 1240,
    user: 'NT AUTHORITY\\SYSTEM',
    anomaly: 'Process memory handle opened with PROCESS_VM_READ from PID 4820',
    severity: 'warning',
    rwxRegions: 0,
    injectedDlls: []
  },
  {
    pid: 1420,
    ppid: 924,
    name: 'explorer.exe',
    path: 'C:\\Windows\\explorer.exe',
    threads: 64,
    handles: 2890,
    user: 'CORP\\m.jenkins',
    anomaly: 'Normal desktop environment context',
    severity: 'clean',
    rwxRegions: 0,
    injectedDlls: []
  },
  {
    pid: 884,
    ppid: 924,
    name: 'spoolsv.exe',
    path: 'C:\\Windows\\System32\\spoolsv.exe',
    threads: 12,
    handles: 310,
    user: 'NT AUTHORITY\\SYSTEM',
    anomaly: 'Clean execution baseline',
    severity: 'clean',
    rwxRegions: 0,
    injectedDlls: []
  }
];

export const MOCK_PACKETS: PacketItem[] = [
  {
    no: 1,
    time: '0.000000',
    source: '185.220.101.44',
    destination: '194.26.29.112',
    protocol: 'TCP',
    length: 74,
    info: '49152 → 25 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM=1',
    severity: 'normal',
    hexDump: [
      '00 50 56 c0 00 08 00 0c 29 e4 f8 12 08 00 45 00',
      '00 3c 1a 2b 40 00 40 06 c8 44 b9 dc 65 2c c2 1a',
      '1d 70 c0 00 00 19 8f a1 2c 09 00 00 00 00 a0 02',
      'fa f0 32 c1 00 00 02 04 05 b4 04 02 08 0a 00 24'
    ],
    asciiDump: [
      '.PV.....)....E.',
      '.<.+@.@..D..e,.',
      '.p......,.......',
      '..2............$'
    ]
  },
  {
    no: 2,
    time: '0.042180',
    source: '194.26.29.112',
    destination: '185.220.101.44',
    protocol: 'TCP',
    length: 74,
    info: '25 → 49152 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0',
    severity: 'normal',
    hexDump: [
      '00 0c 29 e4 f8 12 00 50 56 c0 00 08 08 00 45 00',
      '00 3c 00 00 40 00 34 06 e2 6e c2 1a 1d 70 b9 dc',
      '65 2c 00 19 c0 00 4b 89 2a 18 8f a1 2c 0a a0 12',
      'fe 88 5c 42 00 00 02 04 05 b4 01 01 04 02 08 0a'
    ],
    asciiDump: [
      '..)....PV.....E.',
      '.<..@.4..n...p..',
      'e,....K.*...,...',
      '..\\B............'
    ]
  },
  {
    no: 3,
    time: '0.124502',
    source: '185.220.101.44',
    destination: '194.26.29.112',
    protocol: 'SMTP',
    length: 892,
    info: 'C: EHLO tor-exit-node-04.amsterdam.nl',
    severity: 'alert',
    hexDump: [
      '45 48 4c 4f 20 74 6f 72 2d 65 78 69 74 2d 6e 6f',
      '64 65 2d 30 34 2e 61 6d 73 74 65 72 64 61 6d 2e',
      '6e 6c 0d 0a 4d 41 49 4c 20 46 52 4f 4d 3a 3c 62',
      '6f 75 6e 63 65 2d 64 61 65 6d 6f 6e 40 74 6f 72'
    ],
    asciiDump: [
      'EHLO tor-exit-no',
      'de-04.amsterdam.',
      'nl..MAIL FROM:<b',
      'ounce-daemon@tor'
    ]
  },
  {
    no: 4,
    time: '0.248190',
    source: '185.220.101.44',
    destination: '194.26.29.112',
    protocol: 'TLSv1.3',
    length: 1420,
    info: 'Client Hello (SNI: auth-login.corp-portal-sso.xyz)',
    severity: 'alert',
    hexDump: [
      '16 03 01 02 00 01 00 01 fc 03 03 89 2b 4c a0 19',
      '2f eb 72 1a 44 c1 e8 00 12 77 ba ee d2 49 01 ca',
      '61 75 74 68 2d 6c 6f 67 69 6e 2e 63 6f 72 70 2d',
      '70 6f 72 74 61 6c 2d 73 73 6f 2e 78 79 7a 00 00'
    ],
    asciiDump: [
      '............+L..',
      '/.r.D....w...I..',
      'auth-login.corp-',
      'portal-sso.xyz..'
    ]
  }
];

export const MOCK_YARA_RULES: YaraRule[] = [
  {
    id: 'YARA-01',
    name: 'win_malware_dropper_gen',
    author: 'SOC Threat Intel Unit',
    category: 'Dropper',
    severity: 'CRITICAL',
    tags: ['pe', 'dropper', 'darkgate', 'packer'],
    matchesCount: 14,
    lastUpdated: '2025-05-18',
    ruleCode: `rule win_malware_dropper_gen {
    meta:
        description = "Detects obfuscated DarkGate / packed VBS stagers"
        threat_level = "Critical"
        mitre = "T1204.002"
    strings:
        $magic = { 4D 5A }
        $s1 = "AutoIt3ExecuteScript" ascii wide
        $s2 = "win_malware_dropper_gen" ascii
        $enc1 = { 8A 14 0E 30 14 0F 41 3B CA 72 F4 }
    condition:
        $magic at 0 and ($s1 or $s2 or $enc1)
}`
  },
  {
    id: 'YARA-02',
    name: 'phish_credential_harvest_sso',
    author: 'Email Forensic Core',
    category: 'Phishing',
    severity: 'CRITICAL',
    tags: ['html', 'sso', 'credential_theft', 'mimic'],
    matchesCount: 38,
    lastUpdated: '2025-05-17',
    ruleCode: `rule phish_credential_harvest_sso {
    meta:
        description = "Detects counterfeit corporate SSO sign-in forms"
    strings:
        $f1 = "Verify Mandatory Salary Allocation" nocase
        $f2 = "Immediate account termination" nocase
        $tag = "\\u200C" // zero width evasion
    condition:
        all of them
}`
  },
  {
    id: 'YARA-03',
    name: 'c2_darkgate_beacon_jitter',
    author: 'Network Intel Team',
    category: 'C2',
    severity: 'HIGH',
    tags: ['network', 'beacon', 'c2'],
    matchesCount: 9,
    lastUpdated: '2025-05-16',
    ruleCode: `rule c2_darkgate_beacon_jitter {
    meta:
        description = "Matches DarkGate HTTP beacon URI patterns"
    strings:
        $uri = "/v2/login.php?session=" ascii
        $user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    condition:
        $uri and $user_agent
}`
  }
];

export const MOCK_INCIDENTS: IncidentAlert[] = [
  {
    id: 'INC-2025-0894',
    title: 'Executive Phishing Campaign Targeting Payroll Credentials',
    severity: 'P1 - CRITICAL',
    status: 'INVESTIGATING',
    time: '14:22:09 UTC',
    assignee: 'Tier-3 Forensic Lead (You)',
    tactics: ['Initial Access', 'Credential Harvesting', 'Defense Evasion'],
    affectedEndpoints: 6
  },
  {
    id: 'INC-2025-0891',
    title: 'DarkGate VBScript Payload Infiltration via Supplier Lure',
    severity: 'P1 - CRITICAL',
    status: 'CONTAINED',
    time: '12:04:18 UTC',
    assignee: 'SecOps Incident Squad A',
    tactics: ['Execution', 'Process Injection', 'Command and Control'],
    affectedEndpoints: 2
  },
  {
    id: 'INC-2025-0879',
    title: 'MFA Push Fatigue & Session Hijack Attempt',
    severity: 'P2 - HIGH',
    status: 'ESCALATED',
    time: '08:41:50 UTC',
    assignee: 'Identity Defense Analyst',
    tactics: ['Credential Access', 'Persistence'],
    affectedEndpoints: 1
  },
  {
    id: 'INC-2025-0865',
    title: 'Tor Exit Relay Anomaly on External SMTP Ingress Gateway',
    severity: 'P3 - MEDIUM',
    status: 'RESOLVED',
    time: '04:15:22 UTC',
    assignee: 'Firewall Policy Bot',
    tactics: ['Reconnaissance'],
    affectedEndpoints: 0
  }
];
