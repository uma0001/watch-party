import { ArrowRight, Film, Play, Users, Zap } from 'lucide-react';
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 text-xs font-semibold shadow-sm">
            <span className="text-base">🍿</span>
            <span>Movie Night, Every Night</span>
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              Watch<br />
              <span className="text-blue-600">Together.</span>
            </h1>
            <p className="text-gray-500 text-base leading-relaxed max-w-sm pt-1">
              Invite your crew. Pick a video. Everyone stays in sync — automatically. No delays, no chaos.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-2.5">
            {[
              { icon: <Zap className="w-4 h-4 text-yellow-500" />, text: 'Instant sync across all viewers' },
              { icon: <Film className="w-4 h-4 text-blue-500" />, text: 'Host controls play, pause & seek for everyone' },
              { icon: <Users className="w-4 h-4 text-green-500" />, text: 'Live chat and emoji reactions while watching' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Card */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg">

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => { setMode('create'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                🎬 Create Room
              </button>
              <button
                type="button"
                onClick={() => { setMode('join'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'join' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                🚀 Join Room
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {error}
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Alex 🙋"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    YouTube Video <span className="normal-case font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="Paste a YouTube link to start watching"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 group mt-2"
                >
                  <span>Create Watch Party</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-xs text-gray-400">Share the room code with your friends once you're in</p>
              </form>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Jordan 🙋"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. WATCH1"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-mono tracking-widest uppercase text-center text-lg"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Join the Party 🎉</span>
                </button>
                <p className="text-center text-xs text-gray-400">Ask the host for the 6-character room code</p>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
