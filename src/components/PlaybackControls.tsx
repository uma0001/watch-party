import { Lock, Maximize, Pause, Play, RotateCcw, RotateCw, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PlaybackState } from '../types/watchParty';
import { extractYouTubeId, formatTime } from '../utils/youtube';

interface PlaybackControlsProps {
  playbackState: PlaybackState | null;
  canControlPlayback: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (time: number) => void;
  onChangeVideo: (videoId: string) => void;
  onRequestSync?: () => void;
  duration?: number;
  onToggleFullscreen?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackState,
  canControlPlayback,
  onPlay,
  onPause,
  onSeek,
  onChangeVideo,
  duration,
  onToggleFullscreen,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [localTime, setLocalTime] = useState(0);

  const isPlaying = playbackState?.playState === 'playing';

  useEffect(() => {
    if (!playbackState) {
      setLocalTime(0);
      return;
    }

    const calculateCurrentTime = () => {
      if (playbackState.playState === 'playing') {
        const elapsed = (Date.now() - playbackState.updatedAt) / 1000;
        return Math.max(0, playbackState.currentTime + elapsed);
      }
      return playbackState.currentTime;
    };

    setLocalTime(calculateCurrentTime());

    if (playbackState.playState === 'playing') {
      const interval = setInterval(() => {
        setLocalTime(calculateCurrentTime());
      }, 500);
      return () => clearInterval(interval);
    }
  }, [playbackState]);

  const handlePlayPauseToggle = () => {
    if (!canControlPlayback) return;
    if (isPlaying) {
      onPause(localTime);
    } else {
      onPlay(localTime);
    }
  };

  const handleSkipBackward = () => {
    if (!canControlPlayback) return;
    const targetTime = Math.max(0, localTime - 10);
    onSeek(targetTime);
  };

  const handleSkipForward = () => {
    if (!canControlPlayback) return;
    const maxBound = duration && duration > 0 ? duration : localTime + 10;
    const targetTime = Math.min(maxBound, localTime + 10);
    onSeek(targetTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControlPlayback) return;
    const targetTime = parseFloat(e.target.value);
    onSeek(targetTime);
  };

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canControlPlayback) return;
    const id = extractYouTubeId(videoInput) || videoInput.trim();
    if (id) {
      onChangeVideo(id);
      setVideoInput('');
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 lg:p-5 shadow-xl backdrop-blur-xl space-y-4">
      {/* Top Bar: Play / Pause, Skip 10s, Seek bar, Time, Fullscreen */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Playback Action Buttons (-10s, Play/Pause, +10s) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Rewind -10s Button */}
          <button
            onClick={handleSkipBackward}
            disabled={!canControlPlayback}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              !canControlPlayback
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60'
            }`}
            title={canControlPlayback ? 'Rewind 10 Seconds' : 'Controls Locked'}
          >
            <div className="flex flex-col items-center justify-center leading-none">
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-bold mt-0.5">-10s</span>
            </div>
          </button>

          {/* Play/Pause Main Button */}
          <button
            onClick={handlePlayPauseToggle}
            disabled={!canControlPlayback}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              !canControlPlayback
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                : isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
            }`}
            title={canControlPlayback ? (isPlaying ? 'Pause' : 'Play') : 'Playback locked by Host/Moderator'}
          >
            {!canControlPlayback ? (
              <Lock className="w-5 h-5" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Forward +10s Button */}
          <button
            onClick={handleSkipForward}
            disabled={!canControlPlayback}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              !canControlPlayback
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60'
            }`}
            title={canControlPlayback ? 'Forward 10 Seconds' : 'Controls Locked'}
          >
            <div className="flex flex-col items-center justify-center leading-none">
              <RotateCw className="w-4 h-4 text-indigo-400" />
              <span className="text-[9px] font-bold mt-0.5">+10s</span>
            </div>
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 w-full space-y-1">
          <div className="flex justify-between text-xs text-zinc-400 font-mono">
            <span>{formatTime(localTime)}</span>
            <span className="text-zinc-500">
              {duration && duration > 0 ? formatTime(duration) : 'Sync Stream'}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={duration && duration > 0 ? Math.floor(duration) : Math.max(Math.floor(localTime) + 60, 300)}
            value={Math.floor(localTime)}
            onChange={handleSeekChange}
            disabled={!canControlPlayback}
            className={`w-full h-2 rounded-lg appearance-none bg-zinc-800 accent-indigo-500 cursor-pointer ${
              !canControlPlayback ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'
            }`}
          />
        </div>

        {/* Fullscreen Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 text-xs font-semibold transition-all flex items-center gap-2 shrink-0"
            title="Toggle Fullscreen Mode"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        )}
      </div>

      {/* Bottom Bar: Change Video Input */}
      {canControlPlayback ? (
        <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-3">
          <form onSubmit={handleVideoSubmit} className="flex-1 w-full flex items-center gap-2">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Paste YouTube link or video ID to change video..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <button
              type="submit"
              disabled={!videoInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Load</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>You are currently in Participant mode. Only Host or Moderator can change videos or control playback.</span>
          </div>
        </div>
      )}
    </div>
  );
};
