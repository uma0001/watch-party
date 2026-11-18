import { ArrowRight, Play, Tv, Users, Zap } from 'lucide-react';
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
    if (!username.trim()) {
      setError('Please enter a display name');
      return;
    }
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialVideoId = videoUrlInput.trim() ? extractYouTubeId(videoUrlInput) : undefined;
    onJoinRoom(generatedRoomId, username.trim(), initialVideoId || undefined);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Please enter a display name');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter a valid room code');
      return;
    }
    onJoinRoom(roomId.trim().toUpperCase(), username.trim());
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 lg:p-8 bg-zinc-950">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

        {/* Left — Hero */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Live Sync Engine Active</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Watch YouTube<br />
            <span className="text-blue-400">Together in Sync</span>
          </h1>

          <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
            Create a room, share the code, and watch any YouTube video perfectly in sync with friends — with live chat and role control.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Real-time Sync</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Play, pause, and seek — all synced instantly across everyone.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Tv className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Host Controls</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Host & Moderator roles control playback. Participants watch together.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Live Chat & Reactions</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Chat and send emoji reactions that float over the video in real time.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="lg:col-span-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            {/* Mode Tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => { setMode('create'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'create'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => { setMode('join'); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'join'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Join Room
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Alex"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    YouTube Video URL <span className="text-zinc-600 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="Paste YouTube link to start with a video"
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 group mt-2"
                >
                  <span>Create Watch Party</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Jordan"
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="e.g. WATCH1"
                    maxLength={10}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm font-mono tracking-widest uppercase"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Join Watch Party</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
