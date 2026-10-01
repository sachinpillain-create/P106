import React, { useState } from 'react';
import { X, FolderPlus, Upload, Shield, CheckCircle } from 'lucide-react';
import { ForensicSpecimen } from '../../types';
import { ALTERNATIVE_CASES } from '../../data/sampleCases';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (specimen: ForensicSpecimen) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated
}) => {
  const [caseTitle, setCaseTitle] = useState('Urgent Threat Triage');
  const [selectedPreset, setSelectedPreset] = useState<string>(ALTERNATIVE_CASES[0].id);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [assignedLead, setAssignedLead] = useState('Tier-3 Forensic Lead (Node-09)');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'ELEVATED'>('CRITICAL');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseSpecimen =
      ALTERNATIVE_CASES.find((c) => c.id === selectedPreset) || ALTERNATIVE_CASES[0];

    const newCaseId = `#CAS-2025-${Math.floor(1000 + Math.random() * 9000)}X`;
    const newSpecimen: ForensicSpecimen = {
      ...baseSpecimen,
      caseId: newCaseId,
      filename: customFile ? customFile.name : baseSpecimen.filename,
      filesize: customFile ? `${(customFile.size / 1024).toFixed(1)} KB` : baseSpecimen.filesize,
      dateOpened: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      sessionId: `SEC-${Math.floor(10000 + Math.random() * 90000)}-FX`
    };

    onCaseCreated(newSpecimen);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomFile(e.target.files[0]);
    }
  };

  return (
    <div
      id="create-case-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="create-case-modal"
        className="w-full max-w-lg bg-[#151b2b] border border-[#00d4ff]/30 rounded-xl shadow-[0_0_30px_rgba(0,212,255,0.2)] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3c494e]/40 bg-[#0c1322]">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-sm font-bold uppercase text-[#a8e8ff] tracking-wider">
              Initialize Forensic Investigation Case
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#859398] hover:text-[#00d4ff] transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block font-['JetBrains_Mono'] text-xs text-[#bbc9cf] uppercase mb-1.5">
              Investigation Title / Incident Ref
            </label>
            <input
              type="text"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              className="w-full bg-[#070e1d] border border-[#3c494e] focus:border-[#00d4ff] rounded px-3 py-2 text-sm text-[#dce2f8] outline-none font-['Inter']"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-['JetBrains_Mono'] text-xs text-[#bbc9cf] uppercase mb-1.5">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-[#070e1d] border border-[#3c494e] focus:border-[#00d4ff] rounded px-3 py-2 text-xs text-[#dce2f8] outline-none font-['JetBrains_Mono']"
              >
                <option value="CRITICAL">P1 - CRITICAL (Active)</option>
                <option value="HIGH">P2 - HIGH (Triage)</option>
                <option value="ELEVATED">P3 - ELEVATED</option>
              </select>
            </div>

            <div>
              <label className="block font-['JetBrains_Mono'] text-xs text-[#bbc9cf] uppercase mb-1.5">
                Assigned Forensic Unit
              </label>
              <input
                type="text"
                value={assignedLead}
                readOnly
                className="w-full bg-[#070e1d] border border-[#3c494e]/60 rounded px-3 py-2 text-xs text-[#859398] outline-none font-['JetBrains_Mono']"
              />
            </div>
          </div>

          <div>
            <label className="block font-['JetBrains_Mono'] text-xs text-[#bbc9cf] uppercase mb-1.5">
              Select Specimen Target Preset
            </label>
            <div className="flex flex-col gap-2">
              {ALTERNATIVE_CASES.map((specimen) => (
                <label
                  key={specimen.id}
                  className={`flex items-center justify-between p-2.5 rounded border cursor-pointer transition-colors ${
                    selectedPreset === specimen.id
                      ? 'bg-[#191f2f] border-[#00d4ff] text-[#a8e8ff]'
                      : 'bg-[#070e1d] border-[#3c494e]/40 text-[#859398] hover:border-[#3c494e]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="preset"
                      checked={selectedPreset === specimen.id}
                      onChange={() => {
                        setSelectedPreset(specimen.id);
                        setCustomFile(null);
                      }}
                      className="accent-[#00d4ff]"
                    />
                    <div className="flex flex-col">
                      <span className="font-['JetBrains_Mono'] text-xs font-bold">
                        {specimen.filename}
                      </span>
                      <span className="text-[10px] text-[#859398]">
                        Pipeline: {specimen.pipeline} • {specimen.filesize}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-['JetBrains_Mono'] font-bold ${
                      specimen.overallScore > 85
                        ? 'bg-[#e00363]/20 text-[#ffb1c0]'
                        : 'bg-[#00d4ff]/20 text-[#a8e8ff]'
                    }`}
                  >
                    SCORE: {specimen.overallScore}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Or upload custom specimen */}
          <div>
            <label className="block font-['JetBrains_Mono'] text-xs text-[#bbc9cf] uppercase mb-1.5">
              Or Upload Raw .EML / .MSG Specimen
            </label>
            <div className="border border-dashed border-[#3c494e] hover:border-[#00d4ff] rounded-lg p-3 text-center bg-[#070e1d]/60 cursor-pointer relative">
              <input
                type="file"
                accept=".eml,.msg,.txt,.raw"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#dce2f8]">
                  {customFile ? customFile.name : 'Click to select or drop local .eml specimen'}
                </span>
                <span className="text-[10px] text-[#859398]">Max payload: 50MB</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3c494e]/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-['JetBrains_Mono'] text-[#bbc9cf] hover:text-[#dce2f8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 text-[#00d4ff] border border-[#00d4ff] rounded font-['JetBrains_Mono'] text-xs font-bold uppercase shadow-[0_0_12px_rgba(0,212,255,0.3)] transition-all"
            >
              Initialize Case & Begin Triage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
