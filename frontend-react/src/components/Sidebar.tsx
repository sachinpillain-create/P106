import React from 'react';
import { OperationalUnit } from '../types';
import {
  Terminal,
  Cpu,
  Binary,
  ShieldAlert,
  Radar,
  Activity,
  CheckCircle2,
  Zap,
  Server
} from 'lucide-react';

interface SidebarProps {
  activeUnit: OperationalUnit;
  onSelectUnit: (unit: OperationalUnit) => void;
  latencyMs?: number;
}

interface NavItem {
  id: OperationalUnit;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeUnit, onSelectUnit, latencyMs = 1.2 }) => {
  const navItems: NavItem[] = [
    { id: 'tactical-command', label: 'Tactical Command', icon: Terminal },
    { id: 'live-memory-triage', label: 'Memory Triage', icon: Cpu },
    { id: 'packet-inspector', label: 'Packet & Hex Stream', icon: Binary },
    { id: 'threat-forensics-matrix', label: 'Artifacts & YARA', icon: ShieldAlert },
    { id: 'incident-investigation', label: 'Incident HUD', icon: Radar, badge: '4 ACTIVE' },
    { id: 'system-telemetry', label: 'Node Telemetry', icon: Activity }
  ];

  return (
    <aside
      id="tactical-sidebar"
      className="fixed left-0 top-16 bottom-0 w-64 bg-[#151b2b]/95 backdrop-blur-xl border-r border-[#3c494e]/30 z-40 flex flex-col justify-between py-4 shadow-[0_1px_12px_rgba(0,0,0,0.5)]"
    >
      {/* Top section with units */}
      <div className="flex flex-col gap-3">
        <div className="px-4 flex items-center justify-between">
          <span className="font-['JetBrains_Mono'] text-[11px] text-[#859398] uppercase tracking-wider font-semibold">
            Operational Units
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#6af7ba] px-1.5 py-0.5 bg-[#003824]/60 border border-[#005c3e] rounded font-bold">
            READY
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeUnit === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectUnit(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded transition-all font-['JetBrains_Mono'] text-xs text-left ${
                  isActive
                    ? 'bg-[#2e3545] text-[#00d4ff] font-bold shadow-[inset_0_0_12px_rgba(0,212,255,0.1)] border-l-2 border-[#00d4ff]'
                    : 'text-[#bbc9cf] hover:bg-[#232a3a] hover:text-[#dce2f8]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00d4ff]' : 'text-[#859398]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#e00363]/20 text-[#ffb1c0] border border-[#e00363]/40 font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom status indicators */}
      <div className="px-4 flex flex-col gap-2 font-['JetBrains_Mono'] text-[10px]">
        {/* Active Node Info */}
        <div className="flex items-center justify-between p-2 rounded bg-[#070e1d] border border-[#3c494e]/30">
          <div className="flex items-center gap-1.5 text-[#859398]">
            <Server className="w-3.5 h-3.5 text-[#00d4ff]" />
            <span>NODE:</span>
          </div>
          <span className="text-[#a8e8ff] font-bold">SEC-ALPHA-09</span>
        </div>

        <div className="flex justify-between items-center bg-[#070e1d] p-2 rounded border border-[#3c494e]/30">
          <span className="text-[#859398]">DAEMON:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6af7ba] animate-pulse"></span>
            <span className="text-[#6af7ba] font-bold">ONLINE</span>
          </div>
        </div>

        <div className="flex justify-between items-center bg-[#070e1d] p-2 rounded border border-[#3c494e]/30">
          <span className="text-[#859398]">LATENCY:</span>
          <span className="text-[#00d4ff] font-bold">{latencyMs.toFixed(1)}ms</span>
        </div>
      </div>
    </aside>
  );
};
