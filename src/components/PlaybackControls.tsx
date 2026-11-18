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
      const interval = setInterval(() => setLocalTime(calculateCurrentTime()), 500);
      return () => clearInterval(interval);
    }
  }, [playbackState]);

  const handlePlayPauseToggle = () => {
    if (!canControlPlayback) return;
    if (isPlaying) onPause(localTime);
    else onPlay(localTime);
  };

  const handleSkipBackward = () => {
    if (!canControlPlayback) return;
    onSeek(Math.max(0, localTime - 10));
  };

  const handleSkipForward = () => {
    if (!canControlPlayback) return;
    const maxBound = duration && duration > 0 ? duration : localTime + 10;
    onSeek(Math.min(maxBound, localTime + 10));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControlPlayback) return;
    onSeek(parseFloat(e.target.value));
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg space-y-4">
      {/* Controls row */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Skip / Play / Skip */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSkipBackward}
            disabled={!canControlPlayback}
            aria-label="Rewind 10 seconds"
            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
              !canControlPlayback
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
            }`}
            title="Rewind 10s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold leading-none mt-0.5">10s</span>
          </button>

          <button
            onClick={handlePlayPauseToggle}
            disabled={!canControlPlayback}
            aria-label={canControlPlayback ? (isPlaying ? 'Pause' : 'Play') : 'Locked'}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              !canControlPlayback
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                : isPlaying
                ? 'bg-white text-zinc-900 hover:bg-zinc-200 shadow'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
            }`}
          >
            {!canControlPlayback ? (
              <Lock className="w-4 h-4" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleSkipForward}
            disabled={!canControlPlayback}
            aria-label="Forward 10 seconds"
            className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
              !canControlPlayback
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700'
            }`}
            title="Forward 10s"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold leading-none mt-0.5">10s</span>
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 w-full space-y-1">
          <div className="flex justify-between text-xs text-zinc-500 font-mono">
            <span>{formatTime(localTime)}</span>
            <span>{duration && duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration && duration > 0 ? Math.floor(duration) : Math.max(Math.floor(localTime) + 60, 300)}
            value={Math.floor(localTime)}
            onChange={handleSeekChange}
            disabled={!canControlPlayback}
            aria-label="Seek timeline"
            className={`w-full h-1.5 rounded-full appearance-none bg-zinc-700 accent-blue-500 cursor-pointer ${
              !canControlPlayback ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Fullscreen */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            aria-label="Toggle fullscreen"
            className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shrink-0"
          >
            <Maximize className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        )}
      </div>

      {/* Change video row */}
      {canControlPlayback ? (
        <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
          <form onSubmit={handleVideoSubmit} className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Paste YouTube link or video ID to change video..."
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 text-xs"
            />
            <button
              type="submit"
              disabled={!videoInput.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Load</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="pt-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
          <Lock className="w-3.5 h-3.5 text-zinc-600" />
          <span>Playback is controlled by the Host or Moderator.</span>
        </div>
      )}
    </div>
  );
};
