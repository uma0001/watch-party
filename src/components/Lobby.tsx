import { ArrowRight, Film, Play, Tv, Users, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { extractYouTubeId } from '../utils/youtube';

interface LobbyProps {
  onJoinRoom: (roomId: string, username: string, initialVideoId?: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoinRoom }) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam.toUpperCase());
      setMode('join');
    }
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) { setError('Enter your display name to continue'); return; }
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialVideoId = videoUrlInput.trim() ? extractYouTubeId(videoUrlInput) : undefined;
    onJoinRoom(generatedRoomId, username.trim(), initialVideoId || undefined);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) { setError('Enter your display name to continue'); return; }
    if (!roomId.trim()) { setError('Enter the room code to join'); return; }
    onJoinRoom(roomId.trim().toUpperCase(), username.trim());
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

        {/* Left — Hero */}
        <div className="lg:col-span-6 space-y-7 text-left">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-300 text-xs font-semibold backdrop-blur-sm">
            <span className="text-base">🍿</span>
            <span>Movie Night, Every Night</span>
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Watch<br />
              <span className="text-blue-400">Together.</span>
            </h1>
            <p className="text-zinc-400 text-base leading-relaxed max-w-sm pt-1">
              Invite your crew. Pick a video. Everyone stays in sync — automatically. No delays, no chaos.
            </p>
          </div>

          {/* Feature rows */}
          <div className="space-y-2.5">
            {[
              { icon: <Zap className="w-4 h-4 text-yellow-400" />, text: 'Instant sync across all viewers' },
              { icon: <Tv className="w-4 h-4 text-blue-400" />, text: 'Host controls play, pause & seek for everyone' },
              { icon: <Users className="w-4 h-4 text-green-400" />, text: 'Live chat and emoji reactions while watching' },
              { icon: <Film className="w-4 h-4 text-pink-400" />, text: 'Any YouTube video, any time' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center shrink-0 backdrop-blur-sm">
                  {f.icon}
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Card */}
        <div className="lg:col-span-6">
          <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">

            {/* Tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => { setMode('create'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'create' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                🎬 Create Room
              </button>
              <button
                type="button"
                onClick={() => { setMode('join'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'join' ? 'bg-blue-600 text-white shadow' : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                🚀 Join Room
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Alex 🙋"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    YouTube Video <span className="normal-case font-normal text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="Paste a YouTube link to start watching"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 group mt-2"
                >
                  <span>Create Watch Party</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-xs text-zinc-600">Share the room code with your friends once you're in</p>
              </form>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Jordan 🙋"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. WATCH1"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm font-mono tracking-widest uppercase text-center text-lg"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Join the Party 🎉</span>
                </button>
                <p className="text-center text-xs text-zinc-600">Ask the host for the 6-character room code</p>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
