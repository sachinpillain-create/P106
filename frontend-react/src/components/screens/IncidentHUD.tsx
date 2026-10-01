import React, { useState } from 'react';
import { MOCK_INCIDENTS } from '../../data/mockTelemetry';
import { IncidentAlert } from '../../types';
import {
  Radar,
  AlertTriangle,
  Shield,
  Clock,
  User,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export const IncidentHUD: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentAlert[]>(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<IncidentAlert>(MOCK_INCIDENTS[0]);
  const [activeTacticFilter, setActiveTacticFilter] = useState<string | null>(null);

  const mitreTactics = [
    {
      tactic: 'Initial Access',
      count: 3,
      techniques: [
        { id: 'T1566.002', name: 'Spearphishing Link', active: true },
        { id: 'T1566.001', name: 'Spearphishing Attachment', active: true },
        { id: 'T1190', name: 'Exploit Public-Facing App', active: false }
      ]
    },
    {
      tactic: 'Execution',
      count: 2,
      techniques: [
        { id: 'T1204.002', name: 'Malicious File', active: true },
        { id: 'T1059.005', name: 'Visual Basic', active: true },
        { id: 'T1059.001', name: 'PowerShell', active: false }
      ]
    },
    {
      tactic: 'Defense Evasion',
      count: 3,
      techniques: [
        { id: 'T1027', name: 'Obfuscated Files or Info', active: true },
        { id: 'T1055', name: 'Process Injection', active: true },
        { id: 'T1070', name: 'Indicator Removal', active: false }
      ]
    },
    {
      tactic: 'Credential Access',
      count: 4,
      techniques: [
        { id: 'T1110', name: 'Brute Force / MFA Spray', active: true },
        { id: 'T1056', name: 'Input Capture / SSO Phish', active: true },
        { id: 'T1003', name: 'OS Credential Dumping', active: true }
      ]
    },
    {
      tactic: 'Command & Control',
      count: 2,
      techniques: [
        { id: 'T1071.001', name: 'Web Protocols', active: true },
        { id: 'T1090', name: 'Proxy / Tor Relays', active: true },
        { id: 'T1573', name: 'Encrypted Channel', active: false }
      ]
    }
  ];

  return (
    <div className="flex flex-col w-full pb-12 gap-6 text-[#dce2f8]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] px-4 py-2.5 rounded-lg border border-[#3c494e]/40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Radar className="w-4 h-4 text-[#e00363] animate-pulse" />
            <span className="font-['JetBrains_Mono'] text-xs text-[#ffb1c0] font-bold uppercase tracking-wider">
              GLOBAL INCIDENT HUD &amp; MITRE ATT&amp;CK HEATMAP
            </span>
          </div>
          <span className="text-[#3c494e] font-['JetBrains_Mono'] text-xs hidden sm:inline">|</span>
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            ACTIVE CAMPAIGNS: 04 • DEFENSE READINESS: DEFCON 2
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded bg-[#e00363]/20 border border-[#e00363]/40 text-[#ffb1c0] font-bold animate-pulse">
            ELEVATED THREAT VECTOR
          </span>
        </div>
      </div>

      {/* Incident Cards Queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {incidents.map((inc) => {
          const isSelected = selectedIncident.id === inc.id;
          return (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-[#191f2f] border-[#00d4ff] shadow-[0_0_16px_rgba(0,212,255,0.2)]'
                  : 'bg-[#151b2b] border-[#3c494e]/40 hover:border-[#3c494e]'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#00d4ff]">
                    {inc.id}
                  </span>
                  <span
                    className={`text-[9px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded font-bold ${
                      inc.severity.includes('P1')
                        ? 'bg-[#e00363]/20 text-[#ffb1c0] border border-[#e00363]/40'
                        : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                  {inc.title}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#3c494e]/30 font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                <span>{inc.time}</span>
                <span
                  className={`font-bold ${
                    inc.status === 'INVESTIGATING'
                      ? 'text-[#ffb1c0]'
                      : inc.status === 'CONTAINED'
                      ? 'text-[#6af7ba]'
                      : 'text-[#00d4ff]'
                  }`}
                >
                  {inc.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split View: Selected Incident Detail & MITRE ATT&CK Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Incident Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#3c494e]/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#ffb1c0]" />
              <span className="font-['JetBrains_Mono'] text-xs text-[#ffb1c0] font-bold uppercase">
                Active Incident Context: {selectedIncident.id}
              </span>
            </div>
            <span className="text-[10px] font-['JetBrains_Mono'] text-[#859398]">
              {selectedIncident.time}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white">{selectedIncident.title}</span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
              Lead Assignee: <strong className="text-[#a8e8ff]">{selectedIncident.assignee}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#070e1d] p-3 rounded-lg border border-[#3c494e]/40 font-['JetBrains_Mono'] text-xs">
            <div>
              <span className="text-[10px] text-[#859398] block">INCIDENT SEVERITY:</span>
              <span className="text-[#ffb1c0] font-bold">{selectedIncident.severity}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#859398] block">CONTAINMENT STATUS:</span>
              <span className="text-[#6af7ba] font-bold">{selectedIncident.status}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#859398] block">TARGETED ENDPOINTS:</span>
              <span className="text-[#00d4ff] font-bold">
                {selectedIncident.affectedEndpoints} Workstations
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#859398] block">KILL CHAIN TACTICS:</span>
              <span className="text-white font-bold">{selectedIncident.tactics.length} Phases</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 font-['JetBrains_Mono'] text-xs">
            <span className="text-[10px] text-[#859398] uppercase font-bold">
              Identified Threat Phases:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedIncident.tactics.map((tac, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-[#191f2f] border border-[#00d4ff]/30 text-[#a8e8ff] text-[11px]"
                >
                  {tac}
                </span>
              ))}
            </div>
          </div>

          {/* Tactical Vector Radar Map Simulation */}
          <div className="relative w-full h-40 bg-[#070e1d] rounded-lg overflow-hidden flex items-center justify-center p-3 border border-[#3c494e]/40">
            <svg className="w-full h-full text-[#32394a] opacity-35" viewBox="0 0 300 120">
              <circle cx="150" cy="60" r="50" fill="none" stroke="currentColor" strokeDasharray="3 3" />
              <circle cx="150" cy="60" r="25" fill="none" stroke="currentColor" strokeDasharray="3 3" />
              <line x1="150" y1="0" x2="150" y2="120" stroke="currentColor" strokeDasharray="2 2" />
              <line x1="0" y1="60" x2="300" y2="60" stroke="currentColor" strokeDasharray="2 2" />
            </svg>

            {/* Rotating radar sweep ray */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full border border-[#e00363]/40 border-t-transparent animate-spin"></div>
            </div>

            <div className="absolute flex flex-col items-center">
              <span className="w-3 h-3 rounded-full bg-[#e00363] shadow-[0_0_12px_#e00363] animate-ping"></span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb1c0] font-bold mt-1">
                ATTRIBUTION: TA577 / UNC4841 CLUSTER
              </span>
            </div>
          </div>
        </div>

        {/* MITRE ATT&CK Matrix Heatmap (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#3c494e]/30">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00d4ff]" />
              <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
                MITRE ATT&amp;CK Framework Matrix (v14.1 Enterprise)
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#6af7ba] font-bold">
              9 ACTIVE TECHNIQUES
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 font-['JetBrains_Mono'] text-xs">
            {mitreTactics.map((col, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="p-2 bg-[#070e1d] rounded border border-[#3c494e]/40 text-center">
                  <span className="text-[10px] text-white font-bold block truncate">
                    {col.tactic}
                  </span>
                  <span className="text-[9px] text-[#00d4ff]">{col.count} Techniques</span>
                </div>

                <div className="flex flex-col gap-1">
                  {col.techniques.map((tech) => (
                    <div
                      key={tech.id}
                      className={`p-2 rounded border text-[10px] transition-colors ${
                        tech.active
                          ? 'bg-[#660029]/40 border-[#e00363] text-[#ffd9df] shadow-[0_0_8px_rgba(224,3,99,0.2)]'
                          : 'bg-[#191f2f]/60 border-[#3c494e]/30 text-[#859398]'
                      }`}
                    >
                      <span className="font-bold block">{tech.id}</span>
                      <span className="leading-tight block mt-0.5 line-clamp-2">{tech.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Remediation Playbook Trigger */}
          <div className="p-3 bg-[#070e1d] rounded-lg border border-[#3c494e]/40 flex items-center justify-between mt-2 font-['JetBrains_Mono'] text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#6af7ba]" />
              <span className="text-[#bbc9cf]">
                Automated Playbook: <strong>SOAR_ISOLATE_CREDENTIAL_PHISH.yaml</strong>
              </span>
            </div>
            <button
              onClick={() => alert('Automated SOAR playbook triggered across 6 endpoints')}
              className="px-3 py-1 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 border border-[#00d4ff] text-[#00d4ff] rounded font-bold text-[11px] transition-all cursor-pointer"
            >
              Trigger Playbook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
