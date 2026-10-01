import React, { useState, useRef } from 'react';
import { ForensicSpecimen } from '../../types';
import {
  FolderKanban,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Bolt,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
  Server,
  Link as LinkIcon,
  Clock,
  FileText,
  Code,
  Share2,
  ShieldAlert,
  ArrowDown,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface TacticalCommandProps {
  specimen: ForensicSpecimen;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  onOpenCreateCase: () => void;
  onOpenExportDossier: () => void;
  onOpenStixJson: () => void;
  onOpenQuarantine: () => void;
  onFileUpload: (file: File) => void;
}

export const TacticalCommand: React.FC<TacticalCommandProps> = ({
  specimen,
  onRunAnalysis,
  isAnalyzing,
  onOpenCreateCase,
  onOpenExportDossier,
  onOpenStixJson,
  onOpenQuarantine,
  onFileUpload
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiToken, setApiToken] = useState('fiw_live_sec_78f9a210bc931839aF');
  const [enrichmentDns, setEnrichmentDns] = useState(true);
  const [enrichmentVt, setEnrichmentVt] = useState(true);
  const [enrichmentTor, setEnrichmentTor] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fullParseView, setFullParseView] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    triggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateKey = () => {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setApiToken(`fiw_live_sec_${randomHex.substring(0, 14)}39aF`);
    triggerToast('API Key rotated successfully');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
      triggerToast(`Loaded specimen: ${e.dataTransfer.files[0].name}`);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
      triggerToast(`Loaded specimen: ${e.target.files[0].name}`);
    }
  };

  const handlePushToSiem = () => {
    triggerToast('Event dispatched to Microsoft Sentinel & Splunk HEC');
  };

  // SVG Radial Gauge Calculation for Threat Score
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.159
  const scorePercent = specimen.overallScore;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="flex flex-col w-full pb-12 gap-6 text-[#dce2f8]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151b2b] border border-[#00d4ff] text-[#a8e8ff] px-4 py-2.5 rounded-lg shadow-[0_0_20px_rgba(0,212,255,0.4)] font-['JetBrains_Mono'] text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#6af7ba]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP WORKSPACE HUD STATUS STRIP */}
      <div
        id="top-workspace-hud"
        className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] px-3.5 py-2 rounded-lg border border-[#3c494e]/40 shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#e00363] animate-ping"></span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#ffb1c0] uppercase font-bold tracking-widest">
              LIVE INVESTIGATION PIPELINE
            </span>
          </div>
          <span className="text-[#3c494e] font-['JetBrains_Mono'] text-xs hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs">
            <span className="text-[#859398]">TARGET FILE:</span>
            <span className="text-[#a8e8ff] font-bold">{specimen.filename}</span>
            <span className="text-[#859398]">({specimen.filesize})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#191f2f] border border-[#3c494e]/40 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6af7ba]" />
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bbc9cf]">ENGINE:</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#6af7ba] font-bold">
              {specimen.engine}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-[#191f2f] border border-[#3c494e]/40 px-2 py-0.5 rounded">
            <Server className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#bbc9cf]">PIPELINE:</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#00d4ff] font-bold">
              {specimen.pipeline}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#2e3545] border border-[#3c494e]/60 px-2 py-0.5 rounded">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398]">SESSION ID:</span>
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#dce2f8] font-bold">
              {specimen.sessionId}
            </span>
          </div>
        </div>
      </div>

      {/* DUAL COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
        {/* LEFT COLUMN: INTAKE & CONTROLS (4 Cols on LG) */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          {/* 1. CASE MANAGEMENT CARD */}
          <div
            id="card-case-management"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-3 relative overflow-hidden"
          >
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#00d4ff]/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold tracking-wider uppercase">
                  Case Management
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#6af7ba] bg-[#003824] px-1.5 py-0.5 rounded border border-[#005c3e] font-bold">
                OPERATIONAL
              </span>
            </div>

            {/* Primary CTA: Create New Case */}
            <button
              id="btn-create-case"
              onClick={onOpenCreateCase}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#00d4ff]/15 hover:bg-[#00d4ff]/25 border border-[#00d4ff] text-[#b4ebff] rounded transition-all shadow-[0_0_12px_rgba(0,212,255,0.2)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] cursor-pointer"
              type="button"
            >
              <span className="font-['JetBrains_Mono'] text-xs uppercase tracking-wider font-bold">
                + CREATE NEW CASE
              </span>
            </button>

            {/* Active Case Details Container */}
            <div className="flex flex-col bg-[#191f2f] rounded-lg p-2.5 gap-1.5 border border-[#3c494e]/30">
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398]">ACTIVE RECORD:</span>
                <span className="font-['JetBrains_Mono'] text-[10px] px-1.5 py-0.5 rounded bg-[#e00363]/20 text-[#ffb1c0] font-bold border border-[#e00363]/40">
                  INSPECTION ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-sm font-bold text-[#00d4ff]">
                  {specimen.caseId}
                </span>
                <button
                  onClick={() => copyToClipboard(specimen.caseId, 'Case ID')}
                  className="p-1 hover:bg-[#232a3a] rounded text-[#859398] hover:text-[#00d4ff] transition-colors flex items-center cursor-pointer"
                  title="Copy Case Identifier"
                >
                  {copiedKey === 'Case ID' ? (
                    <Check className="w-3.5 h-3.5 text-[#6af7ba]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 text-[#859398] border-t border-[#3c494e]/30">
                <span className="font-['JetBrains_Mono'] text-[10px]">OPENED:</span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bbc9cf]">
                  {specimen.dateOpened}
                </span>
              </div>
            </div>
          </div>

          {/* 2. EVIDENCE INTAKE & SPECIMEN CARD */}
          <div
            id="card-evidence-intake"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-3 relative"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold tracking-wider uppercase">
                  Evidence Intake
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                EXT: .EML / .MSG
              </span>
            </div>

            {/* File Upload Dropzone */}
            <div
              id="specimen-dropzone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex flex-col items-center justify-center p-4 rounded-lg bg-[#070e1d]/90 hover:bg-[#191f2f] border border-dashed border-[#3c494e] hover:border-[#00d4ff] hover:shadow-[0_0_16px_rgba(0,212,255,0.15)] transition-all cursor-pointer"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".eml,.msg,.txt,.raw"
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <span className="font-['JetBrains_Mono'] text-xs text-[#dce2f8] font-bold text-center">
                DRAG &amp; DROP .EML SPECIMEN
              </span>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] mt-0.5">
                MAX FILE PAYLOAD: 50MB
              </span>

              {/* Attached specimen badge */}
              <div className="mt-3 w-full flex items-center justify-between bg-[#232a3a] px-2.5 py-1.5 rounded border border-[#3c494e]/40">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6af7ba] shrink-0" />
                  <span className="font-['JetBrains_Mono'] text-[11px] text-[#dce2f8] truncate">
                    {specimen.filename}
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#6af7ba] font-bold ml-2 whitespace-nowrap">
                  {specimen.filesize}
                </span>
              </div>
            </div>

            {/* Raw Text / Header Terminal Area */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] uppercase">
                  Extracted MIME Headers
                </span>
                <span
                  onClick={() => setFullParseView(!fullParseView)}
                  className="font-['JetBrains_Mono'] text-[10px] text-[#00d4ff] cursor-pointer hover:underline"
                >
                  {fullParseView ? 'Compact View' : 'Full Parse'}
                </span>
              </div>

              <div
                id="raw-mime-headers-terminal"
                className={`w-full ${
                  fullParseView ? 'h-64' : 'h-36'
                } bg-[#070e1d] p-2.5 rounded-lg border border-[#3c494e]/40 overflow-y-auto font-['JetBrains_Mono'] text-[11px] text-[#bbc9cf] flex flex-col gap-1 shadow-inner select-text transition-all`}
              >
                {specimen.mimeHeaders.map((header, idx) => {
                  const colonIndex = header.indexOf(':');
                  const key = colonIndex !== -1 ? header.substring(0, colonIndex + 1) : '';
                  const val = colonIndex !== -1 ? header.substring(colonIndex + 1) : header;
                  const isFail = header.toLowerCase().includes('fail');
                  const isAlert = header.toLowerCase().includes('urgent');

                  return (
                    <div key={idx} className={isFail ? 'text-[#ffb1c0]' : isAlert ? 'text-[#a8e8ff]' : ''}>
                      <span className="text-[#859398]">{key}</span>
                      <span>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Network Lookup Switches / Checkboxes */}
            <div className="flex flex-col gap-2 bg-[#070e1d]/70 p-2.5 rounded-lg border border-[#3c494e]/30">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] uppercase font-bold tracking-wider">
                Automated Enrichment
              </span>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enrichmentDns}
                  onChange={(e) => setEnrichmentDns(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#00d4ff] accent-[#00d4ff]"
                />
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#dce2f8] group-hover:text-[#00d4ff] transition-colors">
                  Live DNS &amp; RDAP Reverse Query
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enrichmentVt}
                  onChange={(e) => setEnrichmentVt(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#00d4ff] accent-[#00d4ff]"
                />
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#dce2f8] group-hover:text-[#00d4ff] transition-colors">
                  Passive Total / VirusTotal Telemetry
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enrichmentTor}
                  onChange={(e) => setEnrichmentTor(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-[#2e3545] accent-[#00d4ff]"
                />
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] group-hover:text-[#dce2f8] transition-colors">
                  Tor Exit Node Check
                </span>
              </label>
            </div>

            <button
              onClick={() => triggerToast('Header re-parsed and indexed in RAM cache')}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] border border-[#3c494e] text-[#bbc9cf] rounded transition-colors font-['JetBrains_Mono'] text-xs uppercase cursor-pointer"
              type="button"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#00d4ff]" />
              Ingest &amp; Re-Index Header
            </button>

            {/* Cryptographic Hash Verification Box */}
            <div className="flex flex-col gap-2 bg-[#191f2f] p-2.5 rounded-lg border border-[#3c494e]/30">
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] uppercase font-bold">
                  Cryptographic Fingerprints
                </span>
                <Lock className="w-3.5 h-3.5 text-[#6af7ba]" />
              </div>

              {/* SHA-256 */}
              <div className="flex flex-col gap-1 bg-[#070e1d] p-1.5 rounded border border-[#3c494e]/30">
                <div className="flex justify-between items-center">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#00d4ff] font-bold">
                    SHA-256
                  </span>
                  <span
                    onClick={() => copyToClipboard(specimen.sha256, 'SHA-256')}
                    className="font-['JetBrains_Mono'] text-[9px] text-[#859398] hover:text-[#00d4ff] cursor-pointer flex items-center gap-1"
                  >
                    {copiedKey === 'SHA-256' ? (
                      <Check className="w-2.5 h-2.5 text-[#6af7ba]" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                    {copiedKey === 'SHA-256' ? 'COPIED' : 'COPY'}
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bbc9cf] truncate select-all">
                  {specimen.sha256}
                </span>
              </div>

              {/* MD5 */}
              <div className="flex flex-col gap-1 bg-[#070e1d] p-1.5 rounded border border-[#3c494e]/30">
                <div className="flex justify-between items-center">
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#00d4ff] font-bold">
                    MD5
                  </span>
                  <span
                    onClick={() => copyToClipboard(specimen.md5, 'MD5')}
                    className="font-['JetBrains_Mono'] text-[9px] text-[#859398] hover:text-[#00d4ff] cursor-pointer flex items-center gap-1"
                  >
                    {copiedKey === 'MD5' ? (
                      <Check className="w-2.5 h-2.5 text-[#6af7ba]" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                    {copiedKey === 'MD5' ? 'COPIED' : 'COPY'}
                  </span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#bbc9cf] truncate select-all">
                  {specimen.md5}
                </span>
              </div>
            </div>

            {/* Glowing Cyber Execution CTA */}
            <button
              id="btn-run-forensic-analysis"
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="group relative w-full overflow-hidden rounded-xl p-3 bg-gradient-to-r from-[#e00363] via-[#00d4ff] to-[#e00363] bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500 shadow-[0_0_20px_rgba(224,3,99,0.35)] hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] flex items-center justify-center gap-2 cursor-pointer border border-[#00d4ff]/40"
              type="button"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span className="font-['JetBrains_Mono'] text-xs text-white font-bold tracking-wider uppercase drop-shadow-md">
                    ANALYZING SPECIMEN HEURISTICS...
                  </span>
                </>
              ) : (
                <>
                  <Bolt className="w-4 h-4 text-white animate-pulse" />
                  <span className="font-['JetBrains_Mono'] text-xs text-white font-bold tracking-wider uppercase drop-shadow-md">
                    RUN FORENSIC ANALYSIS
                  </span>
                </>
              )}
            </button>
          </div>

          {/* 3. ACCESS CONTROL & API SPEC */}
          <div
            id="card-security-clearance"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
                  Security Clearance
                </span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#6af7ba]" />
            </div>

            <div className="flex items-center gap-2 bg-[#191f2f] px-2.5 py-1.5 rounded font-['JetBrains_Mono'] text-[11px] text-[#dce2f8] border border-[#3c494e]/30">
              <span className="w-2 h-2 rounded-full bg-[#6af7ba] shadow-[0_0_6px_#6af7ba]"></span>
              <span>CLEARANCE LEVEL 4 / SEC-OPS LEAD</span>
            </div>

            {/* API Masked Box */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between items-center">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] uppercase">
                  API Auth Token
                </span>
                <button
                  onClick={handleRotateKey}
                  className="font-['JetBrains_Mono'] text-[10px] text-[#00d4ff] hover:underline cursor-pointer"
                >
                  Rotate Key
                </button>
              </div>
              <div className="bg-[#070e1d] px-2.5 py-1.5 rounded flex justify-between items-center font-['JetBrains_Mono'] text-xs border border-[#3c494e]/30">
                <span className="text-[#bbc9cf] font-mono">
                  {showApiKey ? apiToken : `${apiToken.substring(0, 12)}••••••••••••••••39aF`}
                </span>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[#859398] hover:text-[#00d4ff] cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Rate Limit Bar */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between items-center font-['JetBrains_Mono'] text-[10px]">
                <span className="text-[#859398]">RATE LIMIT:</span>
                <span className="text-[#6af7ba] font-bold">9,420 / 10,000 req/hr</span>
              </div>
              <div className="w-full h-1.5 bg-[#070e1d] rounded overflow-hidden border border-[#3c494e]/30">
                <div
                  className="h-full bg-[#6af7ba] rounded shadow-[0_0_8px_#6af7ba]"
                  style={{ width: '94.2%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORENSIC TELEMETRY & RESULTS (8 Cols on LG) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          {/* 1. THREAT SCORE HERO SECTION */}
          <div
            id="card-threat-score"
            className="flex flex-col bg-[#151b2b] rounded-xl p-4 border border-[#3c494e]/40 shadow-xl relative overflow-hidden"
          >
            {/* Ambient radial glow */}
            <div className="absolute -right-20 -top-20 w-72 h-72 bg-[#e00363]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between pb-2 gap-2 border-b border-[#3c494e]/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e00363] animate-pulse"></span>
                <span className="font-['JetBrains_Mono'] text-xs text-[#ffb1c0] font-bold uppercase tracking-widest">
                  Aggregated Risk Classification
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                EVALUATION MODEL: NEURAL-HEURISTIC-X
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-3">
              {/* SVG Radial Gauge */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-[#070e1d] rounded-xl border border-[#3c494e]/40">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    {/* Background Ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#232a3a"
                      strokeWidth="10"
                    />
                    {/* Active High-Risk Ring */}
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke="#e00363"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-['Plus_Jakarta_Sans'] text-4xl font-bold text-[#ffb1c0] tracking-tighter leading-none">
                      {specimen.overallScore}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] uppercase tracking-wider mt-1">
                      / 100 SCORE
                    </span>
                  </div>
                </div>

                <div className="mt-3 px-2 py-1 rounded bg-[#e00363]/20 border border-[#e00363]/40 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ffb1c0] animate-bounce" />
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb1c0] font-bold tracking-wider">
                    {specimen.riskClassification}
                  </span>
                </div>
              </div>

              {/* Sub-score Breakdown Progress Meters */}
              <div className="md:col-span-8 flex flex-col gap-3">
                {/* Domain Spoofing Risk */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-['JetBrains_Mono'] text-xs">
                    <span className="text-[#dce2f8] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#ffb1c0]" />
                      Domain Spoofing &amp; Punycode Risk
                    </span>
                    <span className="text-[#ffb1c0] font-bold">
                      {specimen.scores.domainSpoofing}% (CRITICAL)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden border border-[#3c494e]/30">
                    <div
                      className="h-full bg-[#e00363] rounded shadow-[0_0_8px_#e00363] transition-all duration-700"
                      style={{ width: `${specimen.scores.domainSpoofing}%` }}
                    ></div>
                  </div>
                </div>

                {/* Payload & Malicious Link Risk */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-['JetBrains_Mono'] text-xs">
                    <span className="text-[#dce2f8] flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-[#ffb1c0]" />
                      Payload &amp; Malicious Webhook Link Risk
                    </span>
                    <span className="text-[#ffb1c0] font-bold">
                      {specimen.scores.payloadLink}% (CRITICAL)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden border border-[#3c494e]/30">
                    <div
                      className="h-full bg-[#e00363] rounded shadow-[0_0_8px_#e00363] transition-all duration-700"
                      style={{ width: `${specimen.scores.payloadLink}%` }}
                    ></div>
                  </div>
                </div>

                {/* Sender Reputation Decay */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-['JetBrains_Mono'] text-xs">
                    <span className="text-[#dce2f8] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#ffb1c0]" />
                      Sender Reputation Decay Index
                    </span>
                    <span className="text-[#ffb1c0] font-bold">
                      {specimen.scores.senderReputationDecay}% (HIGH RISK)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden border border-[#3c494e]/30">
                    <div
                      className="h-full bg-[#e00363] rounded shadow-[0_0_8px_#e00363] transition-all duration-700"
                      style={{ width: `${specimen.scores.senderReputationDecay}%` }}
                    ></div>
                  </div>
                </div>

                {/* Header Anomaly & Relay Drift */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-['JetBrains_Mono'] text-xs">
                    <span className="text-[#dce2f8] flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-[#00d4ff]" />
                      Header Anomaly &amp; Relay Drift
                    </span>
                    <span className="text-[#00d4ff] font-bold">
                      {specimen.scores.headerAnomaly}% (ELEVATED)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden border border-[#3c494e]/30">
                    <div
                      className="h-full bg-[#00d4ff] rounded shadow-[0_0_8px_#00d4ff] transition-all duration-700"
                      style={{ width: `${specimen.scores.headerAnomaly}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. EMAIL AUTHENTICATION TELEMETRY MATRIX */}
          <div
            id="card-email-auth-matrix"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
                  Protocol Authentication Telemetry
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                STANDARDS: RFC 7208 / 6376 / 7489
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* SPF Box */}
              <div className="bg-[#191f2f] p-3 rounded-lg flex flex-col justify-between gap-1.5 border border-[#3c494e]/30">
                <div className="flex justify-between items-center">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#dce2f8] font-bold">
                    SPF (Sender Policy Framework)
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold ${
                      specimen.authTelemetry.spf.status === 'PASS'
                        ? 'bg-[#005c3e] text-[#6af7ba]'
                        : 'bg-[#e00363] text-white'
                    }`}
                  >
                    {specimen.authTelemetry.spf.status}
                  </span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#859398] leading-relaxed">
                  {specimen.authTelemetry.spf.details}
                </p>
              </div>

              {/* DKIM Box */}
              <div className="bg-[#191f2f] p-3 rounded-lg flex flex-col justify-between gap-1.5 border border-[#3c494e]/30">
                <div className="flex justify-between items-center">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#dce2f8] font-bold">
                    DKIM Signatures
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold ${
                      specimen.authTelemetry.dkim.status === 'VALID'
                        ? 'bg-[#005c3e] text-[#6af7ba]'
                        : 'bg-[#e00363] text-white'
                    }`}
                  >
                    {specimen.authTelemetry.dkim.status}
                  </span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#859398] leading-relaxed">
                  {specimen.authTelemetry.dkim.details}
                </p>
              </div>

              {/* DMARC Box */}
              <div className="bg-[#191f2f] p-3 rounded-lg flex flex-col justify-between gap-1.5 border border-[#3c494e]/30">
                <div className="flex justify-between items-center">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#dce2f8] font-bold">
                    DMARC Enforcement
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#00d4ff] text-[#001f27] font-['JetBrains_Mono'] text-[10px] font-bold">
                    {specimen.authTelemetry.dmarc.status}
                  </span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#859398] leading-relaxed">
                  {specimen.authTelemetry.dmarc.details}
                </p>
              </div>

              {/* ARC Chain Box */}
              <div className="bg-[#191f2f] p-3 rounded-lg flex flex-col justify-between gap-1.5 border border-[#3c494e]/30">
                <div className="flex justify-between items-center">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#dce2f8] font-bold">
                    ARC (Authenticated Received Chain)
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold ${
                      specimen.authTelemetry.arc.status === 'PASS'
                        ? 'bg-[#005c3e] text-[#6af7ba]'
                        : 'bg-[#e00363] text-white'
                    }`}
                  >
                    {specimen.authTelemetry.arc.status}
                  </span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#859398] leading-relaxed">
                  {specimen.authTelemetry.arc.details}
                </p>
              </div>
            </div>
          </div>

          {/* 3. RECEIVED-CHAIN RELAY HOP TABLE */}
          <div
            id="card-relay-hops"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
                  MTA Received Relay Hops
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                TOTAL HOPS: 0{specimen.hops.length} (482ms TOTAL TRANSIT)
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {specimen.hops.map((hop, index) => (
                <React.Fragment key={hop.hopNumber}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-2.5 bg-[#191f2f] rounded-lg border border-[#3c494e]/30 gap-2 hover:border-[#00d4ff]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-['JetBrains_Mono'] text-xs font-bold ${
                          hop.statusColor === 'secondary'
                            ? 'bg-[#e00363]/20 text-[#ffb1c0] border border-[#e00363]/40'
                            : hop.statusColor === 'tertiary'
                            ? 'bg-[#005236] text-[#6af7ba] border border-[#005c3e]'
                            : 'bg-[#232a3a] text-[#bbc9cf] border border-[#3c494e]'
                        }`}
                      >
                        {hop.hopNumber}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs">
                          <span
                            className={
                              hop.statusColor === 'secondary'
                                ? 'text-[#ffb1c0] font-bold'
                                : hop.statusColor === 'tertiary'
                                ? 'text-[#6af7ba] font-bold'
                                : 'text-[#dce2f8]'
                            }
                          >
                            {hop.ip}
                          </span>
                          <span className="text-[#859398]">({hop.hostname})</span>
                        </div>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                          {hop.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            hop.statusColor === 'secondary'
                              ? 'bg-[#e00363]'
                              : hop.statusColor === 'tertiary'
                              ? 'bg-[#6af7ba]'
                              : 'bg-[#859398]'
                          }`}
                        ></span>
                        {hop.country}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold ${
                          hop.statusColor === 'secondary'
                            ? 'bg-[#e00363]/20 text-[#ffb1c0] border border-[#e00363]/40'
                            : hop.statusColor === 'tertiary'
                            ? 'bg-[#005236] text-[#6af7ba] border border-[#005c3e]'
                            : 'bg-[#232a3a] text-[#bbc9cf] border border-[#3c494e]'
                        }`}
                      >
                        {hop.status}
                      </span>
                    </div>
                  </div>

                  {index < specimen.hops.length - 1 && (
                    <div className="flex justify-center -my-1 text-[#3c494e]">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 4. GEOLOCATION & ASN INTELLIGENCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hop 1 Geolocation Card */}
            <div
              id="card-origin-geo"
              className="bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-xs text-[#ffb1c0] font-bold uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#e00363]" /> Origin Geo-Node
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                  LATENCY: {specimen.originGeo.latency}
                </span>
              </div>

              <div className="flex flex-col gap-1 bg-[#191f2f] p-2.5 rounded-lg font-['JetBrains_Mono'] text-xs border border-[#3c494e]/30">
                <div className="flex justify-between">
                  <span className="text-[#859398]">IP ADDR:</span>
                  <span className="text-[#ffb1c0] font-bold">{specimen.originGeo.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859398]">GEOLOCATION:</span>
                  <span className="text-[#dce2f8]">{specimen.originGeo.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859398]">ASN PROVIDER:</span>
                  <span className="text-[#00d4ff]">{specimen.originGeo.asn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859398]">rDNS PTR:</span>
                  <span className="text-[#859398]">{specimen.originGeo.rdns}</span>
                </div>
              </div>

              {/* Mini Vector HUD Ping Map Representation */}
              <div className="relative w-full h-28 bg-[#070e1d] rounded-lg overflow-hidden flex items-center justify-center p-2 border border-[#3c494e]/30">
                <svg className="w-full h-full text-[#32394a] opacity-40" viewBox="0 0 300 100">
                  <line stroke="currentColor" strokeDasharray="4 4" x1="0" x2="300" y1="20" y2="20" />
                  <line stroke="currentColor" strokeDasharray="4 4" x1="0" x2="300" y1="50" y2="50" />
                  <line stroke="currentColor" strokeDasharray="4 4" x1="0" x2="300" y1="80" y2="80" />
                  <line stroke="currentColor" strokeDasharray="4 4" x1="60" x2="60" y1="0" y2="100" />
                  <line stroke="currentColor" strokeDasharray="4 4" x1="150" x2="150" y1="0" y2="100" />
                  <line stroke="currentColor" strokeDasharray="4 4" x1="240" x2="240" y1="0" y2="100" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="w-5 h-5 rounded-full bg-[#e00363]/30 flex items-center justify-center animate-ping">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e00363]"></span>
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb1c0] font-bold mt-1 shadow-sm">
                    {specimen.originGeo.coords}
                  </span>
                </div>
              </div>
            </div>

            {/* Hop 2 Geolocation Card */}
            <div
              id="card-forwarding-geo"
              className="bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-['JetBrains_Mono'] text-xs text-[#ffb1c0] font-bold uppercase flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#e00363]" /> Forwarding Relay ASN
                </span>
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                  LATENCY: {specimen.forwardingGeo.latency}
                </span>
              </div>

              <div className="flex flex-col gap-1 bg-[#191f2f] p-2.5 rounded-lg font-['JetBrains_Mono'] text-xs border border-[#3c494e]/30">
                <div className="flex justify-between">
                  <span className="text-[#859398]">IP ADDR:</span>
                  <span className="text-[#ffb1c0] font-bold">{specimen.forwardingGeo.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859398]">GEOLOCATION:</span>
                  <span className="text-[#dce2f8]">{specimen.forwardingGeo.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859398]">ASN PROVIDER:</span>
                  <span className="text-[#00d4ff]">{specimen.forwardingGeo.asn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#859398]">ABUSE CONTACT:</span>
                  <span className="text-[#b4ebff]">{specimen.forwardingGeo.abuse}</span>
                </div>
              </div>

              {/* Secondary Tactical HUD Ping Representation */}
              <div className="relative w-full h-28 bg-[#070e1d] rounded-lg overflow-hidden flex items-center justify-center p-2 border border-[#3c494e]/30">
                <svg className="w-full h-full text-[#32394a] opacity-40" viewBox="0 0 300 100">
                  <circle cx="150" cy="50" fill="none" r="40" stroke="currentColor" strokeDasharray="3 3" />
                  <circle cx="150" cy="50" fill="none" r="20" stroke="currentColor" strokeDasharray="3 3" />
                  <line stroke="currentColor" strokeDasharray="2 2" x1="150" x2="150" y1="0" y2="100" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="w-5 h-5 rounded-full bg-[#e00363]/30 flex items-center justify-center animate-ping">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e00363]"></span>
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb1c0] font-bold mt-1">
                    {specimen.forwardingGeo.coords}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. EXTRACTED URLS & BEHAVIORAL HEURISTICS MATRIX */}
          <div
            id="card-extracted-urls"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
                  Extracted Payloads &amp; URL Heuristics
                </span>
              </div>
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
                PARSED OBJECTS: 0{specimen.payloads.length}
              </span>
            </div>

            {/* URL Table */}
            <div className="flex flex-col gap-2">
              {specimen.payloads.map((payload, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 bg-[#191f2f] p-2.5 rounded-lg border border-[#3c494e]/30 hover:border-[#00d4ff]/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`font-['JetBrains_Mono'] text-xs font-bold break-all ${
                        payload.severity === 'benign' ? 'text-[#6af7ba]' : 'text-[#ffb1c0]'
                      }`}
                    >
                      {payload.url}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold uppercase ${
                        payload.severity === 'benign'
                          ? 'bg-[#005236] text-[#6af7ba] border border-[#005c3e]'
                          : 'bg-[#e00363] text-white'
                      }`}
                    >
                      {payload.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 font-['JetBrains_Mono'] text-[10px] text-[#859398] mt-1">
                    <span>{payload.entropyLabel}</span>
                    <span>{payload.details}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Behavioral Cues */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#3c494e]/30">
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] uppercase font-bold tracking-wider">
                Social Engineering Indicators &amp; Anomaly Signals
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {specimen.socialIndicators.map((ind, i) => (
                  <div
                    key={i}
                    className="bg-[#070e1d] p-2.5 rounded-lg border border-[#3c494e]/40 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-1.5 text-[#ffb1c0] font-['JetBrains_Mono'] text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#e00363]" />
                      {ind.title}
                    </div>
                    <p className="font-['JetBrains_Mono'] text-[10px] text-[#859398] leading-relaxed">
                      {ind.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. FORENSIC REPORTING & REMEDIATION PANEL */}
          <div
            id="card-remediation-actions"
            className="flex flex-col bg-[#151b2b] rounded-xl p-3.5 border border-[#3c494e]/40 shadow-md gap-3"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#859398]">
                <ShieldAlert className="w-4 h-4 text-[#00d4ff]" />
                <span className="font-['JetBrains_Mono'] text-xs uppercase font-bold text-[#bbc9cf]">
                  Forensic Verification Standard
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-xs text-[#859398] leading-relaxed">
                Forensic heuristics are calculated via neural vector analysis against MITRE
                ATT&amp;CK Framework{' '}
                <span className="text-[#00d4ff] font-bold">T1566.002</span> (Spearphishing Link)
                &amp; <span className="text-[#00d4ff] font-bold">T1204.002</span> (Malicious File).
                Relay trust confidence is{' '}
                <span className="text-[#6af7ba] font-bold">{specimen.confidence}%</span>.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3c494e]/30">
              {/* Secondary Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-export-pdf"
                  onClick={onOpenExportDossier}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] border border-[#3c494e] rounded text-[#dce2f8] transition-colors font-['JetBrains_Mono'] text-xs cursor-pointer"
                  type="button"
                >
                  <FileText className="w-3.5 h-3.5 text-[#00d4ff]" />
                  Export PDF Dossier
                </button>

                <button
                  id="btn-export-stix"
                  onClick={onOpenStixJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] border border-[#3c494e] rounded text-[#dce2f8] transition-colors font-['JetBrains_Mono'] text-xs cursor-pointer"
                  type="button"
                >
                  <Code className="w-3.5 h-3.5 text-[#00d4ff]" />
                  STIX / TAXII 2.1 JSON
                </button>

                <button
                  id="btn-push-siem"
                  onClick={handlePushToSiem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191f2f] hover:bg-[#232a3a] border border-[#3c494e] rounded text-[#dce2f8] transition-colors font-['JetBrains_Mono'] text-xs cursor-pointer"
                  type="button"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#00d4ff]" />
                  Push to SIEM / Sentinel
                </button>
              </div>

              {/* Quarantine Containment Action */}
              <button
                id="btn-quarantine-item"
                onClick={onOpenQuarantine}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e00363]/20 hover:bg-[#e00363]/30 border border-[#e00363] text-[#ffb1c0] rounded transition-colors font-['JetBrains_Mono'] text-xs uppercase font-bold shadow-[0_0_12px_rgba(224,3,99,0.3)] cursor-pointer"
                type="button"
              >
                <Lock className="w-3.5 h-3.5 text-[#ffb1c0]" />
                Quarantine Mailbox Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
