import { Crown, MoreVertical, Shield, ShieldAlert, User, UserCheck, UserMinus, UserX } from 'lucide-react';
import React, { useState } from 'react';
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
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Party Members</span>
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
          {participants.length}
        </span>
      </div>

      {/* Participants Scroll List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {participants.map((p) => {
          const isMe = p.userId === currentUserId;
          const isUserHost = p.role === 'host';
          const isUserMod = p.role === 'moderator';

          return (
            <div
              key={p.userId}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between group relative ${
                isMe
                  ? 'bg-indigo-950/30 border-indigo-500/40'
                  : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Role Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isUserHost
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : isUserMod
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                  }`}
                >
                  {isUserHost ? (
                    <Crown className="w-4 h-4" />
                  ) : isUserMod ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white text-xs truncate">{p.username}</span>
                    {isMe && (
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 capitalize">{p.role}</div>
                </div>
              </div>

              {/* Host Control Actions */}
              {isHost && !isMe && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuUserId(activeMenuUserId === p.userId ? null : p.userId)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuUserId === p.userId && (
                    <div
                      className="absolute right-0 top-8 z-30 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1.5 space-y-1"
                      onMouseLeave={() => setActiveMenuUserId(null)}
                    >
                      {p.role === 'participant' ? (
                        <button
                          onClick={() => {
                            onAssignRole(p.userId, 'moderator');
                            setActiveMenuUserId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-indigo-600 hover:text-white flex items-center gap-2 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Promote to Moderator</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onAssignRole(p.userId, 'participant');
                            setActiveMenuUserId(null);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Demote to Participant</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setModalTarget({ type: 'transfer', user: p });
                          setActiveMenuUserId(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/20 flex items-center gap-2 transition-colors"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Transfer Host</span>
                      </button>

                      <div className="my-1 border-t border-zinc-800" />

                      <button
                        onClick={() => {
                          setModalTarget({ type: 'kick', user: p });
                          setActiveMenuUserId(null);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Kick Participant</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Confirmation Modals */}
      <ConfirmModal
        isOpen={modalTarget?.type === 'kick'}
        title="Kick Participant"
        description={`Are you sure you want to remove ${modalTarget?.user.username} from this watch party?`}
        confirmLabel="Remove User"
        isDestructive={true}
        onConfirm={handleKickConfirm}
        onCancel={() => setModalTarget(null)}
      />

      <ConfirmModal
        isOpen={modalTarget?.type === 'transfer'}
        title="Transfer Host Powers"
        description={`Are you sure you want to transfer the Host role to ${modalTarget?.user.username}? You will become a Moderator.`}
        confirmLabel="Transfer Role"
        isDestructive={false}
        onConfirm={handleTransferConfirm}
        onCancel={() => setModalTarget(null)}
      />
    </div>
  );
};
