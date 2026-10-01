import React, { useState } from 'react';
import { X, Code, Copy, Check, Download } from 'lucide-react';
import { ForensicSpecimen } from '../../types';

interface StixJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: ForensicSpecimen;
}

export const StixJsonModal: React.FC<StixJsonModalProps> = ({ isOpen, onClose, specimen }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stixBundle = {
    type: 'bundle',
    id: `bundle--${specimen.sha256.substring(0, 36)}`,
    spec_version: '2.1',
    objects: [
      {
        type: 'indicator',
        spec_version: '2.1',
        id: `indicator--${specimen.sha256.substring(0, 36)}`,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        name: `Malicious Email Specimen: ${specimen.filename}`,
        description: `Risk score: ${specimen.overallScore}/100. ${specimen.riskClassification}`,
        indicator_types: ['malicious-activity', 'phishing'],
        pattern: `[email-message:body_multipart[*].body_raw_ref.hashes.'SHA-256' = '${specimen.sha256}']`,
        pattern_type: 'stix',
        valid_from: new Date().toISOString(),
        confidence: Math.round(specimen.confidence)
      },
      ...specimen.hops
        .filter((h) => h.status.includes('SUSPECT') || h.status.includes('MALICIOUS'))
        .map((h, i) => ({
          type: 'ipv4-addr',
          spec_version: '2.1',
          id: `ipv4-addr--${h.ip.replace(/\./g, '-')}-${i}`,
          value: h.ip,
          x_threat_reputation: h.status
        })),
      ...specimen.payloads.map((p, i) => ({
        type: 'url',
        spec_version: '2.1',
        id: `url--${i}-${Math.random().toString(36).substring(2, 8)}`,
        value: p.url,
        x_category: p.category,
        x_entropy: p.entropy
      }))
    ]
  };

  const jsonString = JSON.stringify(stixBundle, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stix2.1_${specimen.caseId.replace('#', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="stix-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="stix-modal"
        className="w-full max-w-2xl max-h-[85vh] bg-[#151b2b] border border-[#00d4ff]/40 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.3)] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3c494e]/40 bg-[#0c1322]">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-sm font-bold uppercase text-[#a8e8ff] tracking-wider">
              STIX / TAXII 2.1 Threat Intelligence Bundle
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#859398] hover:text-[#00d4ff] transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-[#070e1d] overflow-y-auto flex-1 font-['JetBrains_Mono'] text-xs text-[#a8e8ff]">
          <pre className="select-all whitespace-pre-wrap leading-relaxed">{jsonString}</pre>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-[#3c494e]/40 bg-[#0c1322]">
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            OASIS Cyber Threat Intelligence (CTI) Standard
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] border border-[#3c494e] text-[#dce2f8] rounded font-['JetBrains_Mono'] text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#6af7ba]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 border border-[#00d4ff] text-[#00d4ff] rounded font-['JetBrains_Mono'] text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
