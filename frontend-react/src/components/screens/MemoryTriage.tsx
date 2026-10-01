import React, { useState } from 'react';
import { MOCK_PROCESSES } from '../../data/mockTelemetry';
import { MemoryProcess } from '../../types';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Search,
  RefreshCw,
  Binary,
  Layers,
  ShieldAlert,
  Download
} from 'lucide-react';

export const MemoryTriage: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<MemoryProcess>(MOCK_PROCESSES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDumping, setIsDumping] = useState(false);
  const [dumpStatus, setDumpStatus] = useState<string | null>(null);

  const filteredProcesses = MOCK_PROCESSES.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pid.toString().includes(searchQuery) ||
      p.anomaly.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDumpMemory = () => {
    setIsDumping(true);
    setTimeout(() => {
      setIsDumping(false);
      setDumpStatus(`Memory dump for PID ${selectedProcess.pid} captured (memdump_${selectedProcess.name}_${selectedProcess.pid}.dmp - 34.2 MB)`);
      setTimeout(() => setDumpStatus(null), 4000);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full pb-12 gap-6 text-[#dce2f8]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] px-4 py-2.5 rounded-lg border border-[#3c494e]/40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
              LIVE MEMORY TRIAGE &amp; PROCESS INJECTION HUNTER
            </span>
          </div>
          <span className="text-[#3c494e] font-['JetBrains_Mono'] text-xs hidden sm:inline">|</span>
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            ENGINE: Volatility 3.2.0-PROD (Windows Kernel 10.0.19041)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded bg-[#e00363]/20 border border-[#e00363]/40 text-[#ffb1c0] font-bold animate-pulse">
            2 INJECTIONS DETECTED
          </span>
        </div>
      </div>

      {dumpStatus && (
        <div className="bg-[#003824] border border-[#005c3e] text-[#6af7ba] px-4 py-2.5 rounded-lg font-['JetBrains_Mono'] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{dumpStatus}</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Process Tree (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00d4ff]" />
              <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
                Active Process Memory Space
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#859398]" />
              <input
                type="text"
                placeholder="Filter by PID, name or anomaly..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#070e1d] border border-[#3c494e] focus:border-[#00d4ff] rounded pl-8 pr-3 py-1.5 text-xs text-[#dce2f8] font-['JetBrains_Mono'] outline-none w-56"
              />
            </div>
          </div>

          {/* Process Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-['JetBrains_Mono'] text-xs">
              <thead className="bg-[#070e1d] text-[#859398] uppercase text-[10px] border-b border-[#3c494e]/40">
                <tr>
                  <th className="py-2 px-3">PID</th>
                  <th className="py-2 px-3">Process Name</th>
                  <th className="py-2 px-3">PPID</th>
                  <th className="py-2 px-3">User Context</th>
                  <th className="py-2 px-3">RWX Pages</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c494e]/30">
                {filteredProcesses.map((proc) => {
                  const isSelected = selectedProcess.pid === proc.pid;
                  return (
                    <tr
                      key={proc.pid}
                      onClick={() => setSelectedProcess(proc)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#191f2f] border-l-2 border-[#00d4ff]'
                          : 'hover:bg-[#191f2f]/60'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#00d4ff]">{proc.pid}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{proc.name}</span>
                          <span className="text-[10px] text-[#859398] truncate max-w-[200px]">
                            {proc.path}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#859398]">{proc.ppid}</td>
                      <td className="py-2.5 px-3 text-[#bbc9cf] text-[11px]">{proc.user}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            proc.rwxRegions > 0
                              ? 'bg-[#e00363]/20 text-[#ffb1c0] border border-[#e00363]/40'
                              : 'text-[#859398]'
                          }`}
                        >
                          {proc.rwxRegions} RWX
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            proc.severity === 'critical'
                              ? 'bg-[#e00363] text-white'
                              : proc.severity === 'warning'
                              ? 'bg-[#e00363]/20 text-[#ffb1c0]'
                              : 'bg-[#005c3e] text-[#6af7ba]'
                          }`}
                        >
                          {proc.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Process Deep Dissection (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#3c494e]/30">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ffb1c0]" />
                <span className="font-['JetBrains_Mono'] text-xs font-bold text-[#ffb1c0] uppercase">
                  Anomaly Triage Details: PID {selectedProcess.pid}
                </span>
              </div>
              <button
                onClick={handleDumpMemory}
                disabled={isDumping}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 border border-[#00d4ff] text-[#00d4ff] rounded font-['JetBrains_Mono'] text-[11px] font-bold transition-all"
              >
                {isDumping ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                {isDumping ? 'Dumping...' : 'Dump VAD'}
              </button>
            </div>

            {/* Diagnostic Alert Box */}
            <div
              className={`p-3 rounded-lg border text-xs font-['JetBrains_Mono'] ${
                selectedProcess.severity === 'critical'
                  ? 'bg-[#660029]/30 border-[#e00363]/40 text-[#ffd9df]'
                  : 'bg-[#191f2f] border-[#3c494e]/40 text-[#bbc9cf]'
              }`}
            >
              <div className="font-bold text-[#ffb1c0] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#e00363]" />
                Forensic Signature Flag:
              </div>
              <p className="leading-relaxed">{selectedProcess.anomaly}</p>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 bg-[#070e1d] p-3 rounded-lg border border-[#3c494e]/30 font-['JetBrains_Mono'] text-xs">
              <div>
                <span className="text-[#859398] block text-[10px]">THREADS:</span>
                <span className="text-[#00d4ff] font-bold">{selectedProcess.threads}</span>
              </div>
              <div>
                <span className="text-[#859398] block text-[10px]">HANDLES:</span>
                <span className="text-[#00d4ff] font-bold">{selectedProcess.handles}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[#859398] block text-[10px]">EXECUTABLE IMAGE PATH:</span>
                <span className="text-white text-[11px] break-all">{selectedProcess.path}</span>
              </div>
            </div>

            {/* Injected DLLs */}
            <div className="flex flex-col gap-1.5">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] uppercase font-bold">
                Injected Modules &amp; Memory Hooks:
              </span>
              {selectedProcess.injectedDlls.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {selectedProcess.injectedDlls.map((dll, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-[#191f2f] rounded border border-[#e00363]/30 text-xs font-['JetBrains_Mono']"
                    >
                      <span className="text-[#ffb1c0]">{dll}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#e00363]/20 text-[#ffb1c0] rounded font-bold">
                        UNMAPPED HOOK
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 bg-[#070e1d] rounded border border-[#3c494e]/30 text-[11px] font-['JetBrains_Mono'] text-[#6af7ba] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No foreign unmapped DLL modules detected in process space.
                </div>
              )}
            </div>

            {/* Disassembly Terminal Output */}
            <div className="flex flex-col gap-1">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] uppercase font-bold flex items-center gap-1">
                <Terminal className="w-3 h-3 text-[#00d4ff]" /> Disassembly at Entry Offset
                (0x7FFA88102B)
              </span>
              <div className="bg-[#070e1d] p-2.5 rounded-lg border border-[#3c494e]/40 font-['JetBrains_Mono'] text-[11px] text-[#a8e8ff] flex flex-col gap-1">
                <div>
                  <span className="text-[#859398]">0x7FFA88102B: </span>
                  <span className="text-[#ffb1c0]">48 83 EC 28</span>
                  <span className="text-[#dce2f8] ml-2">sub rsp, 28h</span>
                </div>
                <div>
                  <span className="text-[#859398]">0x7FFA88102F: </span>
                  <span className="text-[#ffb1c0]">48 8D 0D 82 1F 00 00</span>
                  <span className="text-[#dce2f8] ml-2">lea rcx, [payload_shellcode]</span>
                </div>
                <div>
                  <span className="text-[#859398]">0x7FFA881036: </span>
                  <span className="text-[#ffb1c0]">FF 15 44 92 01 00</span>
                  <span className="text-[#e00363] font-bold ml-2">
                    call qword ptr [VirtualAlloc]
                  </span>
                </div>
                <div>
                  <span className="text-[#859398]">0x7FFA88103C: </span>
                  <span className="text-[#ffb1c0]">FF E0</span>
                  <span className="text-[#e00363] font-bold ml-2">jmp rax (RWX Transfer)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
