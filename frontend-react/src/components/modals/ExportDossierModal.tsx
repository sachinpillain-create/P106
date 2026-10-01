import React from 'react';
import { X, FileText, Download, Printer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ForensicSpecimen } from '../../types';

interface ExportDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: ForensicSpecimen;
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({
  isOpen,
  onClose,
  specimen
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    const reportText = `FORENSIC INTELLIGENCE WORKBENCH - THREAT DOSSIER
=====================================================
CASE IDENTIFIER: ${specimen.caseId}
SESSION ID:      ${specimen.sessionId}
TARGET SPECIMEN: ${specimen.filename} (${specimen.filesize})
EVALUATION DATE: ${specimen.dateOpened}
CONFIDENCE RATE: ${specimen.confidence}%
OVERALL THREAT SCORE: ${specimen.overallScore} / 100 [${specimen.riskClassification}]

CRYPTOGRAPHIC FINGERPRINTS
---------------------------
SHA-256: ${specimen.sha256}
MD5:     ${specimen.md5}

SUB-SCORE MATRIX
-----------------
Domain Spoofing & Punycode: ${specimen.scores.domainSpoofing}%
Payload & Malicious Links:  ${specimen.scores.payloadLink}%
Sender Reputation Decay:    ${specimen.scores.senderReputationDecay}%
Header Anomaly & Relay Drift: ${specimen.scores.headerAnomaly}%

PROTOCOL AUTHENTICATION TELEMETRY
----------------------------------
SPF:   ${specimen.authTelemetry.spf.status} - ${specimen.authTelemetry.spf.details}
DKIM:  ${specimen.authTelemetry.dkim.status} - ${specimen.authTelemetry.dkim.details}
DMARC: ${specimen.authTelemetry.dmarc.status} - ${specimen.authTelemetry.dmarc.details}
ARC:   ${specimen.authTelemetry.arc.status} - ${specimen.authTelemetry.arc.details}

EXTRACTED SUSPICIOUS PAYLOADS
------------------------------
${specimen.payloads
  .map(
    (p) => `* [${p.category}] ${p.url}
  ${p.entropyLabel} | ${p.details}`
  )
  .join('\n\n')}

RELAY TRACE HOPS
-----------------
${specimen.hops
  .map(
    (h) => `Hop ${h.hopNumber}: ${h.ip} (${h.hostname})
  ${h.timestamp} [${h.country}] - Status: ${h.status}`
  )
  .join('\n\n')}

MITRE ATT&CK FRAMEWORK MAPPING
-------------------------------
${specimen.mitreTechniques.map((m) => `${m.code} - ${m.name}`).join('\n')}

CERTIFICATION
-------------
Analyzed by TIER-3 FORENSIC LEAD on NODE-09.
Deploy-Zone: SEC-ALPHA. Neural-Heuristic-X ML-YARA Pipeline.
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Forensic_Dossier_${specimen.caseId.replace('#', '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="export-dossier-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="export-dossier-modal"
        className="w-full max-w-2xl max-h-[90vh] bg-[#151b2b] border border-[#00d4ff]/40 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.3)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3c494e]/40 bg-[#0c1322]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-sm font-bold uppercase text-[#a8e8ff] tracking-wider">
              Forensic Investigation Dossier Report
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#859398] hover:text-[#00d4ff] transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Content Area */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 font-['Inter'] text-sm text-[#dce2f8]">
          {/* Executive Header Banner */}
          <div className="p-4 rounded-lg bg-[#070e1d] border border-[#3c494e]/60 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div className="flex flex-col">
              <span className="font-['JetBrains_Mono'] text-xs text-[#00d4ff] font-bold">
                INCIDENT CASE {specimen.caseId}
              </span>
              <span className="text-base font-bold text-white mt-0.5">{specimen.filename}</span>
              <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
                Session ID: {specimen.sessionId} • Opened: {specimen.dateOpened}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#e00363]">
                {specimen.overallScore}/100
              </span>
              <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 bg-[#e00363]/20 text-[#ffb1c0] rounded font-bold uppercase">
                {specimen.riskClassification}
              </span>
            </div>
          </div>

          {/* Cryptographic Signatures */}
          <div className="flex flex-col gap-2">
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#a8e8ff] uppercase">
              Cryptographic Integrity Verification
            </span>
            <div className="p-3 bg-[#070e1d] rounded border border-[#3c494e]/40 font-['JetBrains_Mono'] text-xs flex flex-col gap-1.5">
              <div>
                <span className="text-[#859398]">SHA-256: </span>
                <span className="text-[#bbc9cf] break-all">{specimen.sha256}</span>
              </div>
              <div>
                <span className="text-[#859398]">MD5: </span>
                <span className="text-[#bbc9cf]">{specimen.md5}</span>
              </div>
            </div>
          </div>

          {/* Authentication Audit */}
          <div className="flex flex-col gap-2">
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#a8e8ff] uppercase">
              Email Authentication Telemetry Audit
            </span>
            <div className="grid grid-cols-2 gap-2 font-['JetBrains_Mono'] text-xs">
              <div className="p-2.5 bg-[#070e1d] rounded border border-[#3c494e]/40">
                <span className="text-[#859398]">SPF: </span>
                <span
                  className={
                    specimen.authTelemetry.spf.status === 'PASS' ? 'text-[#6af7ba]' : 'text-[#ffb1c0]'
                  }
                >
                  {specimen.authTelemetry.spf.status}
                </span>
                <p className="text-[11px] text-[#859398] mt-1 font-['Inter']">
                  {specimen.authTelemetry.spf.details}
                </p>
              </div>
              <div className="p-2.5 bg-[#070e1d] rounded border border-[#3c494e]/40">
                <span className="text-[#859398]">DKIM: </span>
                <span
                  className={
                    specimen.authTelemetry.dkim.status === 'VALID' ? 'text-[#6af7ba]' : 'text-[#ffb1c0]'
                  }
                >
                  {specimen.authTelemetry.dkim.status}
                </span>
                <p className="text-[11px] text-[#859398] mt-1 font-['Inter']">
                  {specimen.authTelemetry.dkim.details}
                </p>
              </div>
            </div>
          </div>

          {/* MITRE ATT&CK */}
          <div className="flex flex-col gap-2">
            <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#a8e8ff] uppercase">
              MITRE ATT&CK Enterprise Techniques
            </span>
            <div className="flex flex-wrap gap-2">
              {specimen.mitreTechniques.map((tech) => (
                <span
                  key={tech.code}
                  className="px-2.5 py-1 bg-[#191f2f] border border-[#00d4ff]/40 rounded text-xs font-['JetBrains_Mono'] text-[#a8e8ff]"
                >
                  {tech.code}: {tech.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#3c494e]/40 bg-[#0c1322]">
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            RFC 7208 / 6376 / 7489 Compliant Report
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] border border-[#3c494e] text-[#dce2f8] rounded font-['JetBrains_Mono'] text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#00d4ff]" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 border border-[#00d4ff] text-[#00d4ff] rounded font-['JetBrains_Mono'] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,212,255,0.25)]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
