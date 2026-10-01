import React, { useState, useEffect } from 'react';
import { MOCK_PACKETS } from '../../data/mockTelemetry';
import { PacketItem } from '../../types';
import {
  Binary,
  Play,
  Pause,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  FileCode,
  ShieldAlert
} from 'lucide-react';

export const PacketHexStream: React.FC = () => {
  const [packets, setPackets] = useState<PacketItem[]>(MOCK_PACKETS);
  const [selectedPacket, setSelectedPacket] = useState<PacketItem>(MOCK_PACKETS[2]);
  const [filterQuery, setFilterQuery] = useState('');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Live packet feed simulator
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      const randomSrc = Math.random() > 0.5 ? '185.220.101.44' : '194.26.29.112';
      const randomDst = randomSrc === '185.220.101.44' ? '194.26.29.112' : '185.220.101.44';
      const protocols: ('TCP' | 'TLSv1.3' | 'SMTP' | 'DNS')[] = ['TCP', 'TLSv1.3', 'SMTP', 'DNS'];
      const chosenProto = protocols[Math.floor(Math.random() * protocols.length)];

      const newPacket: PacketItem = {
        no: packets.length + 1,
        time: (packets.length * 0.042).toFixed(6),
        source: randomSrc,
        destination: randomDst,
        protocol: chosenProto,
        length: Math.floor(64 + Math.random() * 1200),
        info:
          chosenProto === 'SMTP'
            ? 'DATA: Subject: [URGENT] Verify Mandatory Salary Allocation'
            : chosenProto === 'TLSv1.3'
            ? 'Application Data (Encrypted Stream, Len=742)'
            : '49152 → 443 [ACK] Seq=1420 Ack=892 Win=65535',
        severity: chosenProto === 'SMTP' ? 'alert' : 'normal',
        hexDump: [
          '45 00 02 18 1f 40 40 00 40 06 c2 1a 1d 70 b9 dc',
          '65 2c 00 19 c0 00 4b 89 2a 18 8f a1 2c 0a a0 12',
          '74 6f 72 2d 65 78 69 74 2d 6e 6f 64 65 2d 30 34'
        ],
        asciiDump: [
          'E....@@.@...p..',
          'e,....K.*...,...',
          'tor-exit-node-04'
        ]
      };

      setPackets((prev) => (prev.length > 50 ? [...prev.slice(1), newPacket] : [...prev, newPacket]));
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveStreaming, packets.length]);

  const filteredPackets = packets.filter(
    (p) =>
      p.protocol.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.source.includes(filterQuery) ||
      p.destination.includes(filterQuery) ||
      p.info.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-12 gap-6 text-[#dce2f8]">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#151b2b] px-4 py-2.5 rounded-lg border border-[#3c494e]/40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Binary className="w-4 h-4 text-[#00d4ff]" />
            <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase tracking-wider">
              PACKET CAPTURE &amp; LIVE RAW HEX DISSECTOR
            </span>
          </div>
          <span className="text-[#3c494e] font-['JetBrains_Mono'] text-xs hidden sm:inline">|</span>
          <span className="font-['JetBrains_Mono'] text-xs text-[#859398]">
            TAP: eth0 (Ingress Socket 185.220.101.44) • Promiscuous Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-['JetBrains_Mono'] text-xs font-bold transition-colors ${
              isLiveStreaming
                ? 'bg-[#e00363]/20 border border-[#e00363] text-[#ffb1c0]'
                : 'bg-[#00d4ff]/20 border border-[#00d4ff] text-[#00d4ff]'
            }`}
          >
            {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isLiveStreaming ? 'PAUSE STREAM' : 'RESUME CAPTURE'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-[#151b2b] p-3 rounded-xl border border-[#3c494e]/40">
        <Filter className="w-4 h-4 text-[#00d4ff]" />
        <input
          type="text"
          placeholder="Filter packets by protocol (SMTP, TCP, TLS), IP address or payload string..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="flex-1 bg-[#070e1d] border border-[#3c494e] focus:border-[#00d4ff] rounded px-3 py-1.5 text-xs text-[#dce2f8] font-['JetBrains_Mono'] outline-none"
        />
        <span className="font-['JetBrains_Mono'] text-xs text-[#859398] whitespace-nowrap">
          Showing {filteredPackets.length} / {packets.length} Frames
        </span>
      </div>

      {/* Split: Frame List & Hex Dissector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Frame Table (6 cols) */}
        <div className="lg:col-span-6 flex flex-col bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md gap-3">
          <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
            Frame Stream Ingestion
          </span>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left font-['JetBrains_Mono'] text-xs">
              <thead className="bg-[#070e1d] text-[#859398] uppercase text-[10px] border-b border-[#3c494e]/40 sticky top-0">
                <tr>
                  <th className="py-2 px-2">No.</th>
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Source</th>
                  <th className="py-2 px-2">Destination</th>
                  <th className="py-2 px-2">Proto</th>
                  <th className="py-2 px-2">Len</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c494e]/30">
                {filteredPackets.map((pkt) => {
                  const isSelected = selectedPacket?.no === pkt.no;
                  return (
                    <tr
                      key={pkt.no}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#191f2f] border-l-2 border-[#00d4ff]'
                          : 'hover:bg-[#191f2f]/60'
                      }`}
                    >
                      <td className="py-2 px-2 font-bold text-[#00d4ff]">{pkt.no}</td>
                      <td className="py-2 px-2 text-[#859398] text-[11px]">{pkt.time}</td>
                      <td className="py-2 px-2 text-[#dce2f8] text-[11px]">{pkt.source}</td>
                      <td className="py-2 px-2 text-[#dce2f8] text-[11px]">{pkt.destination}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pkt.protocol === 'SMTP'
                              ? 'bg-[#e00363]/20 text-[#ffb1c0]'
                              : pkt.protocol === 'TLSv1.3'
                              ? 'bg-[#00d4ff]/20 text-[#a8e8ff]'
                              : 'bg-[#232a3a] text-[#bbc9cf]'
                          }`}
                        >
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-[#859398]">{pkt.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Raw Hex Stream Dissector (6 cols) */}
        <div className="lg:col-span-6 flex flex-col bg-[#151b2b] p-4 rounded-xl border border-[#3c494e]/40 shadow-md gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#3c494e]/30">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#00d4ff]" />
              <span className="font-['JetBrains_Mono'] text-xs text-[#a8e8ff] font-bold uppercase">
                Hex Dissection: Frame #{selectedPacket.no} ({selectedPacket.protocol})
              </span>
            </div>
            <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398]">
              {selectedPacket.length} bytes
            </span>
          </div>

          <div className="p-2.5 bg-[#070e1d] rounded border border-[#3c494e]/40 font-['JetBrains_Mono'] text-xs text-[#bbc9cf]">
            <span className="text-[#859398] block text-[10px]">PACKET INFO:</span>
            <span className="text-white font-bold">{selectedPacket.info}</span>
          </div>

          {/* Strict 3-Column Hex Viewer */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] font-['JetBrains_Mono'] text-[#859398] uppercase px-1">
              <span>Offset</span>
              <span>Hex Dump (16 Bytes / Line)</span>
              <span>ASCII Representation</span>
            </div>

            <div className="p-3 bg-[#070e1d] rounded-lg border border-[#00d4ff]/20 font-['JetBrains_Mono'] text-[11px] flex flex-col gap-1 shadow-inner overflow-x-auto select-text">
              {selectedPacket.hexDump.map((hexLine, i) => {
                const offset = (i * 16).toString(16).padStart(8, '0');
                const asciiLine = selectedPacket.asciiDump[i] || '';

                return (
                  <div key={i} className="flex items-center gap-4 hover:bg-[#191f2f]/60 px-1 rounded">
                    {/* Column 1: Offset */}
                    <span className="text-[#64748b] select-none">{offset}</span>

                    {/* Column 2: Hex Bytes */}
                    <span className="text-[#00d4ff] tracking-widest flex-1 font-mono">
                      {hexLine}
                    </span>

                    {/* Column 3: ASCII */}
                    <span className="text-[#6af7ba] font-mono border-l border-[#3c494e]/40 pl-3">
                      {asciiLine}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Protocol Tree Breakdown */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#3c494e]/30 font-['JetBrains_Mono'] text-xs">
            <span className="text-[10px] text-[#859398] uppercase font-bold">Dissected Layer Stack:</span>
            <div className="p-2 bg-[#191f2f] rounded border border-[#3c494e]/30 flex flex-col gap-1 text-[11px]">
              <span className="text-[#bbc9cf]">▶ Frame #{selectedPacket.no}: {selectedPacket.length} bytes on wire</span>
              <span className="text-[#bbc9cf]">▶ Ethernet II, Src: 00:0c:29:e4:f8:12, Dst: 00:50:56:c0:00:08</span>
              <span className="text-[#bbc9cf]">▶ Internet Protocol Version 4, Src: {selectedPacket.source}, Dst: {selectedPacket.destination}</span>
              <span className="text-[#00d4ff] font-bold">▼ Transmission Control Protocol, Src Port: 49152, Dst Port: 25</span>
              <span className="text-[#ffb1c0] pl-3">▼ Simple Mail Transfer Protocol: Header Anomaly Detected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
