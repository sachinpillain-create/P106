import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Zap,
  Server,
  Database,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const NodeTelemetry: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(24.8);
  const [gpuMemory, setGpuMemory] = useState(62.4);
  const [queueLatency, setQueueLatency] = useState(1.2);

  // Live telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => +(24 + Math.random() * 3).toFixed(1));
      setQueueLatency((prev) => +(1.1 + Math.random() * 0.3).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const clusterNodes = [
    { id: 'NODE-01', role: 'MIME Ingestion & Header Parser', cpu: '18.4%', ram: '14.2 GB', status: 'ONLINE', latency: '0.8ms' },
    { id: 'NODE-04', role: 'ML-YARA Vector Classifier (A100)', cpu: '34.2%', ram: '62.4 GB', status: 'ONLINE', latency: '1.2ms' },
    { id: 'NODE-07', role: 'Live PCAP & Hex Stream Tap', cpu: '22.0%', ram: '8.6 GB', status: 'ONLINE', latency: '0.5ms' },
    { id: 'NODE-09', role: 'Forensic Lead Workbench (Active)', cpu: '24.8%', ram: '16.0 GB', status: 'ONLINE', latency: '1.2ms' },
    { id: 'NODE-12', role: 'Sandbox Detonation Core', cpu: '68.5%', ram: '32.1 GB', status: 'HIGH_LOAD', latency: '2.4ms' }
  ];

  return (
    <div className="flex flex-col w-full pb-12 gap-6 text-[#dce2f8]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] px-4 py-2.5 rounded-lg border border-[#3c494e]/40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
              HIGH-PERFORMANCE FORENSIC COMPUTE TELEMETRY
            </span>
          </div>
          <span className="text-[#3c494e] font-['JetBrains_Mono'] text-xs hidden sm:inline">|</span>
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            CLUSTER: SEC-ALPHA-GRID • DAEMON HEARTBEAT: 1000Hz
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-['JetBrains_Mono'] text-[11px] px-2 py-0.5 rounded bg-[#005c3e] text-[#6af7ba] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6af7ba] animate-pulse"></span>
            ALL 12 NODES OPERATIONAL
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-['JetBrains_Mono']">
        {/* Metric 1: CUDA Core */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#859398] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#6af7ba]" /> NVIDIA A100-80G
            </span>
            <span className="text-[#6af7ba] font-bold">58°C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-white">
              {gpuMemory} GB
            </span>
            <span className="text-[10px] text-[#859398]">VRAM ALLOCATION (78% of 80 GB)</span>
          </div>
          <div className="w-full h-1.5 bg-[#070e1d] rounded overflow-hidden">
            <div className="h-full bg-[#6af7ba]" style={{ width: '78%' }}></div>
          </div>
        </div>

        {/* Metric 2: CPU Load */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#859398] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00d4ff]" /> HOST CPU CORES
            </span>
            <span className="text-[#00d4ff] font-bold">64 Cores</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#00d4ff]">
              {cpuUsage}%
            </span>
            <span className="text-[10px] text-[#859398]">AGGREGATE UTILIZATION</span>
          </div>
          <div className="w-full h-1.5 bg-[#070e1d] rounded overflow-hidden">
            <div className="h-full bg-[#00d4ff]" style={{ width: `${cpuUsage}%` }}></div>
          </div>
        </div>

        {/* Metric 3: Pipeline Throughput */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#859398] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#a8e8ff]" /> NVME I/O PIPE
            </span>
            <span className="text-[#6af7ba] font-bold">READ/WRITE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-white">
              3.8 GB/s
            </span>
            <span className="text-[10px] text-[#859398]">REALTIME SPECIMEN STREAM</span>
          </div>
          <div className="w-full h-1.5 bg-[#070e1d] rounded overflow-hidden">
            <div className="h-full bg-[#a8e8ff]" style={{ width: '45%' }}></div>
          </div>
        </div>

        {/* Metric 4: Socket Latency */}
        <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 flex flex-col justify-between gap-3 shadow-md">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#859398] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffb1c0]" /> WORKER LATENCY
            </span>
            <span className="text-[#6af7ba] font-bold">SUB-2MS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#6af7ba]">
              {queueLatency} ms
            </span>
            <span className="text-[10px] text-[#859398]">ZERO-COPY IPC TRANSIT</span>
          </div>
          <div className="w-full h-1.5 bg-[#070e1d] rounded overflow-hidden">
            <div className="h-full bg-[#6af7ba]" style={{ width: '25%' }}></div>
          </div>
        </div>
      </div>

      {/* Cluster Nodes Breakdown */}
      <div className="bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md flex flex-col gap-3 font-['JetBrains_Mono']">
        <div className="flex items-center justify-between pb-2 border-b border-[#3c494e]/30">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-xs text-[#a8e8ff] font-bold uppercase">
              Operational Cluster Nodes &amp; Task Allocations
            </span>
          </div>
          <span className="text-[10px] text-[#859398]">5 Active Sockets Monitored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e1d] text-[#859398] uppercase text-[10px] border-b border-[#3c494e]/40">
              <tr>
                <th className="py-2.5 px-3">Node Identifier</th>
                <th className="py-2.5 px-3">Engine Role</th>
                <th className="py-2.5 px-3">CPU Usage</th>
                <th className="py-2.5 px-3">RAM In Use</th>
                <th className="py-2.5 px-3">Socket Latency</th>
                <th className="py-2.5 px-3 text-right">Node Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3c494e]/30">
              {clusterNodes.map((node) => (
                <tr key={node.id} className="hover:bg-[#191f2f]/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-[#00d4ff]">{node.id}</td>
                  <td className="py-3 px-3 text-white">{node.role}</td>
                  <td className="py-3 px-3 text-[#bbc9cf]">{node.cpu}</td>
                  <td className="py-3 px-3 text-[#bbc9cf]">{node.ram}</td>
                  <td className="py-3 px-3 text-[#6af7ba]">{node.latency}</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        node.status === 'ONLINE'
                          ? 'bg-[#005c3e] text-[#6af7ba]'
                          : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                      }`}
                    >
                      {node.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
