import React, { useState } from 'react';
import { MOCK_YARA_RULES } from '../../data/mockTelemetry';
import { YaraRule } from '../../types';
import {
  ShieldAlert,
  Code,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
  FileCheck,
  Search,
  Sliders,
  Database
} from 'lucide-react';

export const ArtifactsYara: React.FC = () => {
  const [rules, setRules] = useState<YaraRule[]>(MOCK_YARA_RULES);
  const [selectedRule, setSelectedRule] = useState<YaraRule>(MOCK_YARA_RULES[0]);
  const [editableCode, setEditableCode] = useState(MOCK_YARA_RULES[0].ruleCode);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const handleSelectRule = (rule: YaraRule) => {
    setSelectedRule(rule);
    setEditableCode(rule.ruleCode);
    setTestResult(null);
  };

  const handleRunRule = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      setTestResult(
        `✓ Rule compiled successfully. MATCH IDENTIFIED on specimen 'phish_payroll_update_urgent.eml' at offset 0x0000042A (String match $s1, $magic)`
      );
    }, 800);
  };

  return (
    <div className="flex flex-col w-full pb-12 gap-6 text-[#dce2f8]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] px-4 py-2.5 rounded-lg border border-[#3c494e]/40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
              YARA SIGNATURE COMPILER &amp; ARTIFACT HEURISTICS
            </span>
          </div>
          <span className="text-[#3c494e] font-['JetBrains_Mono'] text-xs hidden sm:inline">|</span>
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            YARA Engine v4.3.2 • Compiled Rules: {rules.length} Active Signatures
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded bg-[#005c3e] text-[#6af7ba] font-bold">
            SIGNATURES SYNCHRONIZED
          </span>
        </div>
      </div>

      {/* PE Section Entropy Analysis Banner */}
      <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
              Binary Section Entropy Profile (Shannon Entropy: Max 8.0)
            </span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#ffb1c0] font-bold bg-[#e00363]/20 px-2 py-0.5 rounded border border-[#e00363]/40">
            PACKED PAYLOAD SPIKE: 7.92 (HIGH CRYPTOGRAPHIC DENSITY)
          </span>
        </div>

        {/* Entropy Graph Visualization */}
        <div className="grid grid-cols-4 gap-3 font-['JetBrains_Mono'] text-xs pt-1">
          <div className="bg-[#070e1d] p-3 rounded-lg border border-[#3c494e]/40 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-[#bbc9cf] font-bold">.text (Code)</span>
              <span className="text-[#6af7ba]">6.12 / 8.0</span>
            </div>
            <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden">
              <div className="h-full bg-[#6af7ba]" style={{ width: '76.5%' }}></div>
            </div>
            <span className="text-[10px] text-[#859398]">Standard compiled x64 instructions</span>
          </div>

          <div className="bg-[#070e1d] p-3 rounded-lg border border-[#3c494e]/40 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-[#bbc9cf] font-bold">.rdata (Read-Only)</span>
              <span className="text-[#6af7ba]">4.82 / 8.0</span>
            </div>
            <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden">
              <div className="h-full bg-[#6af7ba]" style={{ width: '60.2%' }}></div>
            </div>
            <span className="text-[10px] text-[#859398]">Import tables and static strings</span>
          </div>

          <div className="bg-[#070e1d] p-3 rounded-lg border border-[#3c494e]/40 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-[#bbc9cf] font-bold">.data (Globals)</span>
              <span className="text-[#00d4ff]">3.10 / 8.0</span>
            </div>
            <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden">
              <div className="h-full bg-[#00d4ff]" style={{ width: '38.7%' }}></div>
            </div>
            <span className="text-[10px] text-[#859398]">Uninitialized data buffers</span>
          </div>

          <div className="bg-[#070e1d] p-3 rounded-lg border border-[#e00363]/40 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-[#ffb1c0] font-bold">.rsrc (Packed Stager)</span>
              <span className="text-[#e00363] font-bold">7.92 / 8.0</span>
            </div>
            <div className="w-full h-2 bg-[#191f2f] rounded overflow-hidden">
              <div
                className="h-full bg-[#e00363] shadow-[0_0_8px_#e00363]"
                style={{ width: '99%' }}
              ></div>
            </div>
            <span className="text-[10px] text-[#ffb1c0]">DarkGate encrypted payload blob</span>
          </div>
        </div>
      </div>

      {/* Split: Rule Browser & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rules Sidebar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md gap-3">
          <div className="flex items-center justify-between">
            <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
              Rule Repository
            </span>
            <button
              onClick={() => {
                const newRule: YaraRule = {
                  id: `YARA-${rules.length + 1}`,
                  name: `custom_heuristic_rule_${rules.length + 1}`,
                  author: 'Tier-3 Analyst',
                  category: 'Phishing',
                  severity: 'HIGH',
                  tags: ['custom', 'ioc'],
                  matchesCount: 0,
                  lastUpdated: new Date().toISOString().substring(0, 10),
                  ruleCode: `rule custom_heuristic_rule_${rules.length + 1} {
    meta:
        description = "Custom threat detection rule"
    strings:
        $str1 = "suspicious_token" ascii
    condition:
        $str1
}`
                };
                setRules([...rules, newRule]);
                handleSelectRule(newRule);
              }}
              className="p-1 hover:bg-[#232a3a] rounded text-[#00d4ff] flex items-center gap-1 text-[11px] font-['JetBrains_Mono'] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Rule
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {rules.map((rule) => {
              const isSelected = selectedRule.id === rule.id;
              return (
                <div
                  key={rule.id}
                  onClick={() => handleSelectRule(rule)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-[#191f2f] border-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                      : 'bg-[#070e1d] border-[#3c494e]/40 hover:border-[#3c494e]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-['JetBrains_Mono'] text-xs font-bold text-white truncate">
                      {rule.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-['JetBrains_Mono'] font-bold ${
                        rule.severity === 'CRITICAL'
                          ? 'bg-[#e00363]/20 text-[#ffb1c0]'
                          : 'bg-[#00d4ff]/20 text-[#a8e8ff]'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#859398]">
                    <span>Category: {rule.category}</span>
                    <span className="text-[#6af7ba] font-bold">{rule.matchesCount} Hits</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rule Editor and Test Execution (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md gap-3">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#3c494e]/30 gap-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[#00d4ff]" />
              <span className="font-['JetBrains_Mono'] text-xs font-bold text-white">
                Rule Definition: {selectedRule.name}
              </span>
            </div>

            <button
              onClick={handleRunRule}
              disabled={isCompiling}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 border border-[#00d4ff] text-[#00d4ff] rounded font-['JetBrains_Mono'] text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,212,255,0.25)] cursor-pointer"
            >
              {isCompiling ? (
                <span className="w-3.5 h-3.5 border-2 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isCompiling ? 'Evaluating...' : 'Compile & Scan Specimen'}
            </button>
          </div>

          {/* Editor Container */}
          <div className="bg-[#070e1d] p-3 rounded-lg border border-[#3c494e]/40 font-['JetBrains_Mono'] text-xs text-[#a8e8ff]">
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              rows={12}
              className="w-full bg-transparent outline-none resize-none font-['JetBrains_Mono'] text-xs leading-relaxed text-[#00d4ff] selection:bg-[#00d4ff]/30"
              spellCheck={false}
            />
          </div>

          {/* Test Scan Result Box */}
          {testResult && (
            <div className="p-3 bg-[#003824] border border-[#005c3e] rounded-lg font-['JetBrains_Mono'] text-xs text-[#6af7ba] flex items-start gap-2 shadow-[0_0_15px_rgba(106,247,186,0.15)] animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#6af7ba] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold uppercase tracking-wider">YARA Scan Result:</span>
                <span>{testResult}</span>
              </div>
            </div>
          )}

          {/* IOC Database Table */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#3c494e]/30">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] uppercase font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#00d4ff]" /> Extracted IOC Signatures Linked to
              Rule
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-['JetBrains_Mono'] text-xs">
              <div className="p-2 bg-[#070e1d] rounded border border-[#3c494e]/30 flex flex-col">
                <span className="text-[10px] text-[#859398]">IPV4 C2 RELAYS:</span>
                <span className="text-[#ffb1c0]">185.220.101.44</span>
                <span className="text-[#ffb1c0]">194.26.29.112</span>
              </div>
              <div className="p-2 bg-[#070e1d] rounded border border-[#3c494e]/30 flex flex-col">
                <span className="text-[10px] text-[#859398]">MALICIOUS DOMAINS:</span>
                <span className="text-[#ffb1c0] truncate">auth-login.corp-portal-sso.xyz</span>
                <span className="text-[#ffb1c0] truncate">cdn-files-invoice.ru</span>
              </div>
              <div className="p-2 bg-[#070e1d] rounded border border-[#3c494e]/30 flex flex-col">
                <span className="text-[10px] text-[#859398]">FILE HASH (SHA-256):</span>
                <span className="text-[#00d4ff] text-[10px] truncate">
                  e3b0c44298fc1c149afbf4c8996fb92427...
                </span>
                <span className="text-[#6af7ba] text-[10px]">SSDEEP: 768:48...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
