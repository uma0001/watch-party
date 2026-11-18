import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Send, Smile, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types/watchParty';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendMessage: (message: string) => void;
  onSendReaction?: (emoji: string) => void;
}

const QUICK_REACTION_EMOJIS = ['🔥', '❤️', '😂', '👏', '🎉', '🍿', '🚀', '💯', '😮', '🥳'];

const EMOJI_CATEGORIES = [
  {
    name: 'Live Reactions',
    emojis: ['🔥', '❤️', '😂', '👏', '🎉', '🍿', '🚀', '💯', '😮', '😍', '🥳', '🙌', '✨', '⚡', '⭐'],
  },
  {
    name: 'Expressions',
    emojis: ['😀', '😎', '🤩', '😭', '🤯', '😜', '🤔', '💀', '😴', '😇', '😈', '🤣', '👀', '🤙', '💪'],
  },
  {
    name: 'Party Vibes',
    emojis: ['🎈', '🎊', '🎁', '🍕', '🍔', '🍻', '🥤', '🎮', '🎧', '🎸', '🎬', '🍿', '🏆', '💎', '🎯'],
  },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleQuickEmojiSend = (emoji: string) => {
    if (onSendReaction) {
      onSendReaction(emoji);
    } else {
      onSendMessage(emoji);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col h-full max-h-[500px] relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <span>Party Chat</span>
        </h3>
        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-violet-400" />
          Live Chat
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 text-xs">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p>No chat messages yet.</p>
            <p className="text-[10px] mt-1">Send a message or tap an emoji reaction to start!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            const isSystem = msg.isSystem;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (isSystem) {
              return (
                <div key={msg.id} className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[10px] text-zinc-500 font-medium shrink-0 px-2">{msg.text}</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                  isMe ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1">
                  <span className="font-medium text-zinc-300">{msg.username}</span>
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Live Stream Quick Reaction Bar */}
      <div className="mt-3 pt-2 border-t border-zinc-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
          {QUICK_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmojiSend(emoji)}
              className="p-1.5 rounded-xl bg-zinc-950/80 hover:bg-indigo-950/60 border border-zinc-800 hover:border-indigo-500/40 text-base transition-all hover:scale-125 shrink-0 active:scale-95 shadow-sm"
              title={`Send ${emoji} instantly`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Picker Popover Modal */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-4 z-40 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800 text-xs font-semibold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-violet-400" /> Choose Emoji
              </span>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    {cat.name}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {cat.emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectEmoji(emoji)}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-lg transition-transform hover:scale-125 text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Form with Emoji Toggle */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Send a message..."
            maxLength={500}
            className="w-full pl-3.5 pr-9 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 text-zinc-400 hover:text-amber-400 transition-colors p-1"
            title="Emoji Picker"
          >
            <Smile className="w-4 h-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
