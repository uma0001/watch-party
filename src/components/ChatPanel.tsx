import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Send, Smile } from 'lucide-react';
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
  { name: 'Live Reactions', emojis: ['🔥', '❤️', '😂', '👏', '🎉', '🍿', '🚀', '💯', '😮', '😍', '🥳', '🙌', '✨', '⚡', '⭐'] },
  { name: 'Expressions',   emojis: ['😀', '😎', '🤩', '😭', '🤯', '😜', '🤔', '💀', '😴', '😇', '😈', '🤣', '👀', '🤙', '💪'] },
  { name: 'Party Vibes',   emojis: ['🎈', '🎊', '🎁', '🍕', '🍔', '🍻', '🥤', '🎮', '🎧', '🎸', '🎬', '🍿', '🏆', '💎', '🎯'] },
];

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, currentUserId, onSendMessage, onSendReaction }) => {
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
    if (onSendReaction) onSendReaction(emoji);
    else onSendMessage(emoji);
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col h-full max-h-[500px] relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          Party Chat
        </h3>
        <span className="text-xs text-gray-400 font-medium">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 text-xs">
            <MessageSquare className="w-7 h-7 mb-2 opacity-20" />
            <p className="text-gray-500">No messages yet.</p>
            <p className="mt-1 text-gray-400">Send a message or react with an emoji!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;
            const isSystem = msg.isSystem;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (isSystem) {
              return (
                <div key={msg.id} className="flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] text-gray-400 font-medium shrink-0 px-2">{msg.text}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                  <span className="font-medium text-gray-500">{msg.username}</span>
                  <span>·</span>
                  <span>{timeStr}</span>
                </div>
                <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed break-words shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick reactions */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
          {QUICK_REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmojiSend(emoji)}
              className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-base transition-all hover:scale-110 shrink-0 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="absolute bottom-16 right-4 z-40 w-68 bg-white border border-gray-200 rounded-xl p-3 shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between pb-1 border-b border-gray-100 text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1.5"><Smile className="w-3.5 h-3.5" /> Choose Emoji</span>
              <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-gray-700 text-xs">Close</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{cat.name}</div>
                  <div className="grid grid-cols-5 gap-1">
                    {cat.emojis.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => handleSelectEmoji(emoji)} className="p-1.5 rounded-lg hover:bg-gray-100 text-lg transition-transform hover:scale-110 text-center">
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3">
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Send a message..."
            maxLength={500}
            className="w-full pl-3 pr-8 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
          />
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute right-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Smile className="w-4 h-4" />
          </button>
        </div>
        <button type="submit" disabled={!inputText.trim()} className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
