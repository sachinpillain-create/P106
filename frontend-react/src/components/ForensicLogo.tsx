import React from 'react';

interface ForensicLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ForensicLogo: React.FC<ForensicLogoProps> = ({ size = 'md', showText = true }) => {
  const hotlinkUrl =
    'https://lh3.googleusercontent.com/aida/AEtjO1WVEFVq7HIrfvw2iGi6zGbHFEerDQIb6rrYj3TpDj3kMzqHd171yZfhw8-zr1CSLhDgI7TcRKzGuG12hNcwgaV0XB0Eucm5hfFbQD1idhwyw7lbJGzyy0xnM_--ZdpNhzefRSqWokY7Z55Zov-DNb5gP2AjCj5AFYyyUdYQNBqPPoLlQVxo5OPRUElH_RnWFXBgyzoSAOTxJvwLFGtt5R5Um_-834nZkQAYy4c2aUdGxSuD8gSyWtcIDfA';

  const [imgError, setImgError] = React.useState(false);

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center gap-2.5 select-none" id="forensic-logo-container">
      {!imgError ? (
        <img
          src={hotlinkUrl}
          alt="Forensic Intel"
          className={`${iconSizes[size]} object-contain`}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Vector SVG representation matching Image 1 & 2 */
        <div
          className={`relative ${iconSizes[size]} rounded-[22%] bg-[#0c1322] border-2 border-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.4)] flex items-center justify-center overflow-hidden`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1.5" fill="none">
            {/* Top-Left to center Cyan line */}
            <line x1="8" y1="8" x2="20" y2="20" stroke="#00d4ff" strokeWidth="4" strokeLinecap="round" />
            {/* Top-Right to center Cyan line */}
            <line x1="32" y1="8" x2="20" y2="20" stroke="#00d4ff" strokeWidth="4" strokeLinecap="round" />
            {/* Bottom-Left to center Magenta line */}
            <line x1="8" y1="32" x2="20" y2="20" stroke="#e00363" strokeWidth="4" strokeLinecap="round" />
            {/* Bottom-Right to center Magenta line */}
            <line x1="32" y1="32" x2="20" y2="20" stroke="#e00363" strokeWidth="4" strokeLinecap="round" />
            {/* Center Pivot Circle */}
            <circle cx="20" cy="20" r="3.5" fill="#00d4ff" />
          </svg>
        </div>
      )}

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-['JetBrains_Mono'] text-xs font-semibold tracking-[0.14em] text-[#a8e8ff] uppercase">
              FORENSIC INTELLIGENCE WORKBENCH
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#6af7ba] shadow-[0_0_6px_#6af7ba]"></span>
          </div>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#859398] tracking-wider uppercase">
            v3.4.2-PROD // DEPLOY-ZONE: SEC-ALPHA
          </span>
        </div>
      )}
    </div>
  );
};
