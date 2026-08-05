import { Film, PlayCircle, ShieldAlert, Sparkles, Tv, Video } from 'lucide-react';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LiveReaction, PlaybackState } from '../types/watchParty';
import { FloatingReactions } from './FloatingReactions';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface VideoPlayerRef {
  toggleFullscreen: () => void;
}

interface VideoPlayerProps {
  playbackState: PlaybackState | null;
  canControlPlayback: boolean;
  onPlay: (currentTime: number) => void;
  onPause: (currentTime: number) => void;
  onSeek: (time: number) => void;
  onRequestSync?: () => void;
  onDurationChange?: (duration: number) => void;
  reactions?: LiveReaction[];
  ref?: React.Ref<VideoPlayerRef>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playbackState,
  canControlPlayback,
  onPlay,
  onPause,
  onSeek,
  onDurationChange,
  reactions = [],
  ref,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const isInternalChangeRef = useRef(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  const flagInternalChange = (durationMs = 800) => {
    isInternalChangeRef.current = true;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      isInternalChangeRef.current = false;
    }, durationMs);
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      if (wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen();
      } else if ((wrapperRef.current as any).webkitRequestFullscreen) {
        (wrapperRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  useImperativeHandle(ref, () => ({
    toggleFullscreen,
  }));

  // 1. Load YouTube IFrame API Script once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      setIsApiReady(true);
    };
  }, []);

  // 2. Initialize YouTube Player once when API is ready
  useEffect(() => {
    if (!isApiReady || !playbackState?.videoId || playerRef.current) return;

    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-element';
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);
    }

    currentVideoIdRef.current = playbackState.videoId;

    playerRef.current = new window.YT.Player('yt-player-element', {
      height: '100%',
      width: '100%',
      videoId: playbackState.videoId,
      playerVars: {
        autoplay: playbackState.playState === 'playing' ? 1 : 0,
        controls: canControlPlayback ? 1 : 0,
        disablekb: canControlPlayback ? 0 : 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          const dur = event.target?.getDuration ? event.target.getDuration() : 0;
          if (dur > 0 && onDurationChange) {
            onDurationChange(dur);
          }
        },
        onStateChange: (event: any) => {
          if (!canControlPlayback || isInternalChangeRef.current) return;

          const player = playerRef.current;
          if (!player) return;

          const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
          const dur = player.getDuration ? player.getDuration() : 0;
          if (dur > 0 && onDurationChange) {
            onDurationChange(dur);
          }

          // YT.PlayerState: PLAYING (1), PAUSED (2)
          if (event.data === window.YT.PlayerState.PLAYING) {
            onPlay(currentTime);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            onPause(currentTime);
          }
        },
      },
    });

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setIsPlayerReady(false);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [isApiReady, playbackState?.videoId]);

  // 3. React to server playback state updates smoothly
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || !playbackState) return;

    const player = playerRef.current;
    if (typeof player.getCurrentTime !== 'function') return;

    // Check if video changed
    if (playbackState.videoId && playbackState.videoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = playbackState.videoId;
      flagInternalChange(1200);
      if (typeof player.loadVideoById === 'function') {
        player.loadVideoById(playbackState.videoId, playbackState.currentTime || 0);
      }
    }

    // Extrapolate server target time
    let targetTime = playbackState.currentTime;
    if (playbackState.playState === 'playing') {
      const elapsed = (Date.now() - playbackState.updatedAt) / 1000;
      targetTime += elapsed;
    }

    const localTime = player.getCurrentTime() || 0;
    const drift = Math.abs(localTime - targetTime);

    // Sync drift correction if > 1.2s
    if (drift > 1.2 && typeof player.seekTo === 'function') {
      flagInternalChange(800);
      player.seekTo(targetTime, true);
    }

    // Play / Pause state sync
    const playerState = player.getPlayerState ? player.getPlayerState() : -1;
    if (playbackState.playState === 'playing' && playerState !== window.YT?.PlayerState?.PLAYING) {
      flagInternalChange(800);
      if (typeof player.playVideo === 'function') {
        player.playVideo();
      }
    } else if (playbackState.playState === 'paused' && playerState === window.YT?.PlayerState?.PLAYING) {
      flagInternalChange(800);
      if (typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    }

    // Report duration if available
    const dur = player.getDuration ? player.getDuration() : 0;
    if (dur > 0 && onDurationChange) {
      onDurationChange(dur);
    }
  }, [playbackState, isPlayerReady]);

  if (!playbackState?.videoId) {
    return (
      <div className="w-full aspect-video rounded-2xl lg:rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/70 via-zinc-950 to-zinc-950 border border-indigo-500/20 shadow-2xl flex flex-col items-center justify-center p-6 lg:p-10 text-center relative overflow-hidden group select-none">
        {/* Animated Glow Background Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Hero Banner Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4 z-10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Watch Party Room Active</span>
        </div>

        {/* Main Title & Subtitle */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight z-10 max-w-xl">
          Ready to Stream Together? <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
            Load Any YouTube Video
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-3 leading-relaxed z-10">
          {canControlPlayback
            ? 'Paste any YouTube link in the control box below to start synchronous streaming with everyone!'
            : 'Waiting for the Host or Moderator to select a video to start the stream...'}
        </p>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-3 mt-6 z-10 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            <span>HD Sync Streaming</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
            <PlayCircle className="w-3.5 h-3.5 text-violet-400" />
            <span>Zero Lag Sync</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-pink-400" />
            <span>Live Reactions</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video rounded-2xl lg:rounded-3xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group">
      {/* YouTube Player Mount */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Live Stream Emoji Reactions */}
      <FloatingReactions reactions={reactions} />

      {/* Top Overlay: Viewer Mode Badge */}
      {!canControlPlayback && (
        <div className="absolute top-4 right-4 z-30 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs font-medium backdrop-blur-md flex items-center gap-2 shadow-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Viewer Mode</span>
          </div>
        </div>
      )}
    </div>
  );
};
