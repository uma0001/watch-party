import { Crown, MoreVertical, Shield, User, UserMinus, UserX } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Participant, Role } from '../types/watchParty';
import { ConfirmModal } from './ConfirmModal';

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string | null;
  isHost: boolean;
  onAssignRole: (userId: string, role: Role) => void;
  onRemoveParticipant: (userId: string) => void;
  onTransferHost: (userId: string) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<{
    type: 'kick' | 'transfer';
    user: Participant;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuUserId(null);
      }
    };
    if (activeMenuUserId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuUserId]);

  const handleKickConfirm = () => {
    if (!modalTarget) return;
    onRemoveParticipant(modalTarget.user.userId);
    setModalTarget(null);
  };

  const handleTransferConfirm = () => {
    if (!modalTarget) return;
    onTransferHost(modalTarget.user.userId);
    setModalTarget(null);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-400" />
          Party Members
        </h3>
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold">
          {participants.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {participants.map((p) => {
          const isMe = p.userId === currentUserId;
          const isUserHost = p.role === 'host';
          const isUserMod = p.role === 'moderator';

          return (
            <div
              key={p.userId}
              className={`px-3 py-2.5 rounded-lg border flex items-center justify-between ${
                isMe
                  ? 'bg-zinc-800/60 border-zinc-700'
                  : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
              } transition-colors`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isUserHost
                      ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50'
                      : isUserMod
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-800/40'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                  }`}
                >
                  {isUserHost ? (
                    <Crown className="w-3.5 h-3.5" />
                  ) : isUserMod ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-white text-xs truncate">{p.username}</span>
                    {isMe && (
                      <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-1.5 py-px rounded">
                        you
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-600 capitalize">{p.role}</div>
                </div>
              </div>

              {isHost && !isMe && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setActiveMenuUserId(activeMenuUserId === p.userId ? null : p.userId)}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  {activeMenuUserId === p.userId && (
                    <div className="absolute right-0 top-8 z-30 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 space-y-0.5">
                      {p.role === 'participant' ? (
                        <button
                          onClick={() => { onAssignRole(p.userId, 'moderator'); setActiveMenuUserId(null); }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-blue-400" />
                          Promote to Moderator
                        </button>
                      ) : (
                        <button
                          onClick={() => { onAssignRole(p.userId, 'participant'); setActiveMenuUserId(null); }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Demote to Participant
                        </button>
                      )}

                      <button
                        onClick={() => { setModalTarget({ type: 'transfer', user: p }); setActiveMenuUserId(null); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-yellow-400 hover:bg-yellow-900/20 flex items-center gap-2 transition-colors"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        Transfer Host
                      </button>

                      <div className="my-1 border-t border-zinc-800" />

                      <button
                        onClick={() => { setModalTarget({ type: 'kick', user: p }); setActiveMenuUserId(null); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Remove from Party
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={modalTarget?.type === 'kick'}
        title="Remove Participant"
        description={`Are you sure you want to remove ${modalTarget?.user.username} from this watch party?`}
        confirmLabel="Remove"
        isDestructive={true}
        onConfirm={handleKickConfirm}
        onCancel={() => setModalTarget(null)}
      />

      <ConfirmModal
        isOpen={modalTarget?.type === 'transfer'}
        title="Transfer Host"
        description={`Transfer host powers to ${modalTarget?.user.username}? You will become a Moderator.`}
        confirmLabel="Transfer"
        isDestructive={false}
        onConfirm={handleTransferConfirm}
        onCancel={() => setModalTarget(null)}
      />
    </div>
  );
};
