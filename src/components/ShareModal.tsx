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
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const emailUrl    = `mailto:?subject=${encodeURIComponent('Join my Watch Party!')}&body=${encodedText}%0A%0A${encodedUrl}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 text-gray-500 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Share Watch Party</h3>
                <p className="text-xs text-gray-400">Invite friends — room <span className="font-mono font-semibold text-gray-600">{roomId}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Invite Link</label>
                <div className="flex items-center gap-2">
                  <input type="text" readOnly value={shareUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-xs font-mono truncate focus:outline-none" />
                  <button onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0">
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Room Code</label>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-xl font-bold font-mono tracking-widest text-gray-900 uppercase">{roomId}</span>
                  <button onClick={handleCopyCode}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium transition-colors flex items-center gap-1.5">
                    {copiedCode ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Share Via</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { href: whatsappUrl, label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5 text-green-500" />, bg: 'hover:bg-green-50 hover:border-green-200' },
                    { href: telegramUrl, label: 'Telegram', icon: <Share2 className="w-5 h-5 text-sky-500" />, bg: 'hover:bg-sky-50 hover:border-sky-200' },
                    { href: twitterUrl,  label: 'Twitter',  icon: <Twitter className="w-5 h-5 text-blue-500" />, bg: 'hover:bg-blue-50 hover:border-blue-200' },
                    { href: emailUrl,    label: 'Email',    icon: <Mail className="w-5 h-5 text-gray-400" />,   bg: 'hover:bg-gray-100' },
                  ].map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      className={`p-3 rounded-xl bg-white border border-gray-200 ${s.bg} text-gray-600 flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors`}>
                      {s.icon}
                      <span>{s.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
