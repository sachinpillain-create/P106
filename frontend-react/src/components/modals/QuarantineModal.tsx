import React, { useState } from 'react';
import { X, Lock, ShieldAlert, CheckCircle2, AlertOctagon } from 'lucide-react';
import { ForensicSpecimen } from '../../types';

interface QuarantineModalProps {
  isOpen: boolean;
  onClose: () => void;
  specimen: ForensicSpecimen;
  onQuarantined: () => void;
}

export const QuarantineModal: React.FC<QuarantineModalProps> = ({
  isOpen,
  onClose,
  specimen,
  onQuarantined
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [purgeMailboxes, setPurgeMailboxes] = useState(true);
  const [blockSenderDomain, setBlockSenderDomain] = useState(true);
  const [isolateEndpointSessions, setIsolateEndpointSessions] = useState(false);

  if (!isOpen) return null;

  const handleExecuteQuarantine = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      setIsCompleted(true);
      setTimeout(() => {
        onQuarantined();
        onClose();
        setIsCompleted(false);
      }, 1400);
    }, 1200);
  };

  return (
    <div
      id="quarantine-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="quarantine-modal"
        className="w-full max-w-lg bg-[#151b2b] border border-[#e00363]/60 rounded-xl shadow-[0_0_35px_rgba(224,3,99,0.4)] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e00363]/30 bg-[#0c1322]">
          <div className="flex items-center gap-2 text-[#ffb1c0]">
            <Lock className="w-5 h-5 text-[#e00363]" />
            <span className="font-['JetBrains_Mono'] text-sm font-bold uppercase tracking-wider">
              Execute Containment: Quarantine Mailbox Item
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#859398] hover:text-[#ffb1c0] transition-colors rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="p-3 bg-[#660029]/30 border border-[#e00363]/40 rounded-lg flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-[#e00363] shrink-0 mt-0.5" />
            <div className="flex flex-col text-xs font-['Inter'] text-[#ffd9df]">
              <span className="font-bold font-['JetBrains_Mono'] uppercase tracking-wider text-[#ffb1c0]">
                High-Impact Mitigation Action
              </span>
              <span>
                Targeting specimen: <strong className="text-white">{specimen.filename}</strong>{' '}
                associated with Case {specimen.caseId}.
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 font-['JetBrains_Mono'] text-xs">
            <span className="text-[#bbc9cf] uppercase font-bold">Automated Enforcement Steps:</span>

            <label className="flex items-center gap-2.5 p-2 bg-[#070e1d] rounded border border-[#3c494e]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={purgeMailboxes}
                onChange={(e) => setPurgeMailboxes(e.target.checked)}
                className="accent-[#e00363]"
              />
              <span className="text-[#dce2f8]">
                Purge item from all recipient inboxes via Microsoft 365 / Google Workspace API
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-[#070e1d] rounded border border-[#3c494e]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={blockSenderDomain}
                onChange={(e) => setBlockSenderDomain(e.target.checked)}
                className="accent-[#e00363]"
              />
              <span className="text-[#dce2f8]">
                Add originating IP [185.220.101.44] and domain to perimeter edge firewall blackhole
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2 bg-[#070e1d] rounded border border-[#3c494e]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={isolateEndpointSessions}
                onChange={(e) => setIsolateEndpointSessions(e.target.checked)}
                className="accent-[#e00363]"
              />
              <span className="text-[#dce2f8]">
                Force revoke active authentication tokens for users who interacted with links
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#3c494e]/40">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 text-xs font-['JetBrains_Mono'] text-[#859398] hover:text-[#dce2f8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteQuarantine}
              disabled={isExecuting}
              className="px-5 py-2.5 bg-[#e00363]/25 hover:bg-[#e00363]/40 border border-[#e00363] text-[#ffb1c0] rounded font-['JetBrains_Mono'] text-xs font-bold uppercase shadow-[0_0_15px_rgba(224,3,99,0.4)] transition-all flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#ffb1c0] border-t-transparent rounded-full animate-spin"></span>
                  Enforcing Containment...
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#6af7ba]" />
                  Quarantine Active!
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Confirm & Quarantine Item
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
