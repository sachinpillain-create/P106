import React, { useState, useEffect } from 'react';
import { ForensicLogo } from './ForensicLogo';
import { Cpu, Zap, AlertTriangle, Clock, User, Bell, Volume2, VolumeX } from 'lucide-react';

interface HeaderProps {
  onSearchClick?: () => void;
  incidentsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick, incidentsCount = 4 }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioMuted, setAudioMuted] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString().replace('T', ' ').substring(0, 19);
      setCurrentTime(`${iso} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="main-app-header"
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#070e1d]/90 backdrop-blur-xl border-b border-[#3c494e]/40 shadow-[0_1px_12px_rgba(0,0,0,0.6)]"
    >
      <div className="w-full h-16 px-4 flex items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <ForensicLogo size="md" showText={true} />
        </div>

        {/* Center: Realtime Telemetry HUD Badges */}
        <div className="hidden xl:flex items-center gap-2 font-['JetBrains_Mono'] text-[11px]">
          {/* CUDA Core */}
          <div
            id="hud-cuda-core"
            className="flex items-center gap-1.5 bg-[#191f2f] border border-[#3c494e]/50 px-2.5 py-1 rounded shadow-inner"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6af7ba] shadow-[0_0_6px_#6af7ba] animate-pulse"></span>
            <span className="text-[#bbc9cf]">CUDA CORE:</span>
            <span className="text-[#6af7ba] font-bold">ON [A100-80G]</span>
          </div>

          {/* CPU Load */}
          <div
            id="hud-cpu-load"
            className="flex items-center gap-1.5 bg-[#191f2f] border border-[#3c494e]/50 px-2.5 py-1 rounded shadow-inner"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_6px_#00d4ff] animate-ping"></span>
            <span className="text-[#bbc9cf]">CPU LOAD:</span>
            <span className="text-[#00d4ff] font-bold">24.8%</span>
          </div>

          {/* Active Incidents */}
          <div
            id="hud-active-incidents"
            className="flex items-center gap-1.5 bg-[#191f2f] border border-[#e00363]/40 px-2.5 py-1 rounded shadow-inner"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#e00363] shadow-[0_0_6px_#e00363] animate-pulse"></span>
            <span className="text-[#bbc9cf]">INCIDENTS:</span>
            <span className="text-[#ffb1c0] font-bold">{incidentsCount.toString().padStart(2, '0')} ACTIVE</span>
          </div>

          {/* Live UTC Clock */}
          <div
            id="hud-utc-clock"
            className="flex items-center gap-1.5 bg-[#191f2f] border border-[#3c494e]/50 px-2.5 py-1 rounded shadow-inner"
          >
            <Clock className="w-3.5 h-3.5 text-[#859398]" />
            <span className="text-[#bbc9cf] font-['JetBrains_Mono'] text-[11px] tabular-nums">
              {currentTime || '2025-05-18 14:48:02 UTC'}
            </span>
          </div>
        </div>

        {/* Right: Security Clearance & Operator */}
        <div className="flex items-center gap-3">
          {/* Audio HUD Toggle */}
          <button
            id="btn-hud-audio-toggle"
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-1.5 text-[#859398] hover:text-[#00d4ff] hover:bg-[#191f2f] rounded transition-colors"
            title={audioMuted ? 'Telemetry Audio: Muted' : 'Telemetry Audio: Enabled'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#6af7ba]" />}
          </button>

          {/* Operator Profile */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-['JetBrains_Mono'] text-[11px] text-[#6af7ba] font-bold tracking-tight uppercase">
              TIER-3 FORENSIC LEAD
            </span>
            <span className="font-['JetBrains_Mono'] text-[9px] text-[#859398] uppercase tracking-wider">
              RBAC: ELEVATED // NODE-09
            </span>
          </div>

          <div
            id="user-avatar-badge"
            className="w-8 h-8 rounded-full bg-[#00d4ff]/20 border border-[#00d4ff]/50 flex items-center justify-center text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.3)] cursor-pointer hover:scale-105 transition-transform"
          >
            <User className="w-4 h-4 text-[#00d4ff]" />
          </div>
        </div>
      </div>
    </header>
  );
};
