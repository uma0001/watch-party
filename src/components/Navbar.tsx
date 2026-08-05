import { Check, Copy, LogOut, Radio, Share2, Tv, Users } from 'lucide-react';
import React, { useState } from 'react';
import { ConnectionStatus } from '../hooks/useSocket';

interface NavbarProps {
  roomId: string | null;
  participantCount: number;
  socketStatus: ConnectionStatus;
  onLeaveRoom: () => void;
  onOpenShare?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  participantCount,
  socketStatus,
  onLeaveRoom,
  onOpenShare,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
            Watch Party
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v1.0 Sync
            </span>
          </h1>
          <p className="text-xs text-zinc-400 hidden sm:block">Synchronized YouTube Experience</p>
        </div>
      </div>

      {/* Room Details & Actions */}
      {roomId ? (
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Socket Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  socketStatus === 'connected'
                    ? 'bg-emerald-400'
                    : socketStatus === 'reconnecting'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  socketStatus === 'connected'
                    ? 'bg-emerald-500'
                    : socketStatus === 'reconnecting'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="capitalize text-zinc-300 font-medium">
              {socketStatus === 'connected' ? 'Live Sync' : socketStatus}
            </span>
          </div>

          {/* Copy Invite Link / Room Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-white transition-all text-xs font-semibold group"
            title="Copy invite link to clipboard"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Room: <strong className="text-white uppercase tracking-wider">{roomId}</strong></span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-indigo-400 ml-0.5 group-hover:text-indigo-200" />
            )}
          </button>

          {/* Dedicated Share Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/20 text-xs font-semibold transition-all"
              title="Share Room options"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Participant count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-white">{participantCount}</span>
          </div>

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-rose-200 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Server Ready</span>
          </div>
        </div>
      )}
    </header>
  );
};
