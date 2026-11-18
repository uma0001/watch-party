import { Film, PlayCircle, Tv, Video } from 'lucide-react';
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
  onRequestSync,
  onDurationChange,
  reactions = [],
  ref,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

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

  // Load YouTube IFrame API Script once
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

  // Initialize player once API and videoId are ready
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
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        fs: 0,
        enablejsapi: 1,
        origin: window.location.origin,
        widget_referrer: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          const dur = event.target?.getDuration ? event.target.getDuration() : 0;
          if (dur > 0 && onDurationChange) onDurationChange(dur);
          if (onRequestSync) onRequestSync();
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setAutoplayBlocked(false);
          }
          if (!canControlPlayback || isInternalChangeRef.current) return;
          const player = playerRef.current;
          if (!player) return;
          const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
          const dur = player.getDuration ? player.getDuration() : 0;
          if (dur > 0 && onDurationChange) onDurationChange(dur);
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
  }, [isApiReady, playbackState?.videoId, canControlPlayback]);

  // React to server playback state updates
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || !playbackState) return;
    const player = playerRef.current;
    if (typeof player.getCurrentTime !== 'function') return;

    if (playbackState.videoId && playbackState.videoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = playbackState.videoId;
      flagInternalChange(1200);
      if (typeof player.loadVideoById === 'function') {
        player.loadVideoById(playbackState.videoId, playbackState.currentTime || 0);
      }
    }

    let targetTime = playbackState.currentTime;
    if (playbackState.playState === 'playing') {
      const elapsed = (Date.now() - playbackState.updatedAt) / 1000;
      targetTime += elapsed;
    }

    const localTime = player.getCurrentTime() || 0;
    const drift = Math.abs(localTime - targetTime);
    if (drift > 1.2 && typeof player.seekTo === 'function') {
      flagInternalChange(800);
      player.seekTo(targetTime, true);
    }

    const playerState = player.getPlayerState ? player.getPlayerState() : -1;
    if (playbackState.playState === 'playing' && playerState !== window.YT?.PlayerState?.PLAYING) {
      flagInternalChange(800);
      if (typeof player.playVideo === 'function') {
        try {
          const res = player.playVideo();
          if (res && typeof res.catch === 'function') {
            res.catch(() => setAutoplayBlocked(true));
          }
        } catch {
          setAutoplayBlocked(true);
        }
      }
    } else if (playbackState.playState === 'paused' && playerState === window.YT?.PlayerState?.PLAYING) {
      flagInternalChange(800);
      if (typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    }

    const dur = player.getDuration ? player.getDuration() : 0;
    if (dur > 0 && onDurationChange) onDurationChange(dur);
  }, [playbackState, isPlayerReady]);

  // Hero banner when no video loaded
  if (!playbackState?.videoId) {
    return (
      <div className="w-full aspect-video rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
          <Tv className="w-7 h-7 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No video loaded</h2>
        <p className="text-sm text-zinc-500 max-w-xs">
          {canControlPlayback
            ? 'Paste a YouTube link in the box below to start watching together.'
            : 'Waiting for the host to load a video...'}
        </p>
        <div className="flex items-center gap-4 mt-6 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5" />
            <span>Any YouTube video</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Synced playback</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            <span>Live reactions</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-lg group select-none">
      {/* YouTube Player */}
      <div ref={containerRef} className="w-full h-full pointer-events-auto" />

      {/* Top shield — blocks YouTube title/share link clicks */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-20 pointer-events-auto bg-transparent cursor-default"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      />

      {/* Full shield for viewers */}
      {!canControlPlayback && (
        <div
          className="absolute inset-0 z-20 pointer-events-auto bg-transparent cursor-default"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        />
      )}

      {/* Autoplay blocked overlay */}
      {autoplayBlocked && (
        <div
          onClick={() => {
            setAutoplayBlocked(false);
            if (playerRef.current?.playVideo) playerRef.current.playVideo();
            onRequestSync?.();
          }}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer pointer-events-auto"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg mb-3 hover:bg-blue-500 transition-colors">
            <PlayCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Click to Resume</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Browser paused playback while tab was in background. Click to sync back with the host.
          </p>
        </div>
      )}

      {/* Floating Reactions */}
      <FloatingReactions reactions={reactions} />

      {/* Viewer mode badge */}
      {!canControlPlayback && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <div className="px-2.5 py-1 rounded-md bg-black/70 border border-zinc-700 text-zinc-400 text-xs font-medium backdrop-blur-sm">
            Viewer Mode
          </div>
        </div>
      )}
    </div>
  );
};
