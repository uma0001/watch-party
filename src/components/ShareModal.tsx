import { AnimatePresence, motion } from 'motion/react';
import { Check, Copy, Mail, MessageCircle, Share2, Twitter, X } from 'lucide-react';
import React, { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  roomId: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, roomId, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?room=${roomId}` : '';
  const shareText = `Join my Watch Party! Room Code: ${roomId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent('Join my Watch Party!')}&body=${encodedText}%0A%0A${encodedUrl}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Share Watch Party</h3>
                <p className="text-xs text-zinc-500">Invite friends to join room <span className="font-mono font-semibold text-zinc-300">{roomId}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Invite Link */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Invite Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-zinc-400 text-xs font-mono truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Room Code */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Room Code
                </label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-700">
                  <span className="text-lg font-bold font-mono tracking-widest text-white uppercase">{roomId}</span>
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copiedCode ? 'Copied' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Social */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Share Via
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-sky-400" />
                    <span>Telegram</span>
                  </a>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-blue-400" />
                    <span>Twitter</span>
                  </a>
                  <a
                    href={emailUrl}
                    className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors"
                  >
                    <Mail className="w-5 h-5 text-zinc-400" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
