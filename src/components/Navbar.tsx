import { Check, Copy, Crown, LogOut, Radio, Share2, Shield, Tv, Users } from 'lucide-react';
import React, { useState } from 'react';
import { ConnectionStatus } from '../hooks/useSocket';

interface NavbarProps {
  roomId: string | null;
  participantCount: number;
  socketStatus: ConnectionStatus;
  myRole?: 'host' | 'moderator' | 'participant' | null;
  onLeaveRoom: () => void;
  onOpenShare?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  participantCount,
  socketStatus,
  myRole,
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
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
          <Tv className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-wide">Watch Party</span>
          <span className="hidden sm:inline text-zinc-600 text-xs ml-2">Sync</span>
        </div>
      </div>

      {/* Room Actions */}
      {roomId ? (
        <div className="flex items-center gap-2">

          {/* Connection status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                socketStatus === 'connected'
                  ? 'bg-green-500'
                  : socketStatus === 'reconnecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-zinc-400 font-medium">
              {socketStatus === 'connected' ? 'Live' : socketStatus}
            </span>
          </div>

          {/* Room code copy */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition-all text-xs font-mono"
            title="Copy invite link"
          >
            <Radio className="w-3 h-3 text-zinc-500" />
            <span className="uppercase tracking-wider font-semibold">{roomId}</span>
            {copied ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-500" />
            )}
          </button>

          {/* Share */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* My Role badge */}
          {myRole === 'host' && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-yellow-800/50 text-yellow-400 text-xs font-semibold">
              <Crown className="w-3 h-3" />
              <span>Host</span>
            </div>
          )}
          {myRole === 'moderator' && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-blue-800/50 text-blue-400 text-xs font-semibold">
              <Shield className="w-3 h-3" />
              <span>Mod</span>
            </div>
          )}

          {/* Participant count */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-white">{participantCount}</span>
          </div>

          {/* Leave */}
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-red-900/30 border border-zinc-800 hover:border-red-800/60 text-zinc-400 hover:text-red-400 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>Server Ready</span>
        </div>
      )}
    </header>
  );
};
