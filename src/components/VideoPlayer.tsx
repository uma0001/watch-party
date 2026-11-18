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

  // FIX: Use refs for everything that changes without needing a player rebuild.
  // canControlPlayback changing (role change) must NOT destroy/recreate the player.
  const canControlRef = useRef(canControlPlayback);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onDurationChangeRef = useRef(onDurationChange);
  const onRequestSyncRef = useRef(onRequestSync);
  const latestPlaybackRef = useRef<PlaybackState | null>(null);

  // Keep all refs current on every render — no stale closures
  useEffect(() => { canControlRef.current = canControlPlayback; }, [canControlPlayback]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onDurationChangeRef.current = onDurationChange; }, [onDurationChange]);
  useEffect(() => { onRequestSyncRef.current = onRequestSync; }, [onRequestSync]);
  useEffect(() => { latestPlaybackRef.current = playbackState; }, [playbackState]);

  const isInternalChangeRef = useRef(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  const flagInternalChange = (durationMs = 1500) => {
    isInternalChangeRef.current = true;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      isInternalChangeRef.current = false;
    }, durationMs);
  };

  /**
   * Applies server playback state to the player.
   * Uses a single flagInternalChange so seek + play don't race.
   */
  const applyServerState = (player: any, state: PlaybackState) => {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    let targetTime = state.currentTime;
    if (state.playState === 'playing') {
      const elapsed = (Date.now() - state.updatedAt) / 1000;
      targetTime = Math.max(0, targetTime + elapsed);
    }

    const localTime = player.getCurrentTime?.() ?? 0;
    const drift = Math.abs(localTime - targetTime);
    const playerState = player.getPlayerState?.() ?? -1;

    const needsSeek = drift > 1.0;
    const needsPlay  = state.playState === 'playing'  && playerState !== window.YT?.PlayerState?.PLAYING;
    const needsPause = state.playState === 'paused'   && playerState === window.YT?.PlayerState?.PLAYING;

    if (!needsSeek && !needsPlay && !needsPause) return;

    // One unified flag covers all operations so they don't conflict
    flagInternalChange(2000);

    if (needsSeek) player.seekTo?.(targetTime, true);

    if (needsPlay) {
      try {
        const promise = player.playVideo?.();
        promise?.catch?.(() => setAutoplayBlocked(true));
      } catch {
        setAutoplayBlocked(true);
      }
    } else if (needsPause) {
      player.pauseVideo?.();
    }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      (wrapperRef.current as any).requestFullscreen?.() ||
      (wrapperRef.current as any).webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.();
    }
  };

  useImperativeHandle(ref, () => ({ toggleFullscreen }));

  // ── Load YouTube IFrame API once ─────────────────────────────────────────
  useEffect(() => {
    if (window.YT?.Player) { setIsApiReady(true); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('script')[0]
      ?.parentNode?.insertBefore(tag, document.getElementsByTagName('script')[0]);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); setIsApiReady(true); };
  }, []);

  // ── Create player when API + videoId ready.
  //    IMPORTANT: canControlPlayback is NOT a dependency here.
  //    Role changes must NOT destroy the player — we use canControlRef instead.
  useEffect(() => {
    if (!isApiReady || !playbackState?.videoId || playerRef.current) return;

    // Compute exact start position to avoid loading at t=0
    let startSeconds = playbackState.currentTime;
    if (playbackState.playState === 'playing') {
      const elapsed = (Date.now() - playbackState.updatedAt) / 1000;
      startSeconds = Math.max(0, startSeconds + elapsed);
    }

    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-element';
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);
    }

    currentVideoIdRef.current = playbackState.videoId;

    // Flag as internal BEFORE creating player so the initial autoplay
    // onStateChange(PLAYING) at t=0 is never forwarded to the server.
    flagInternalChange(4000);

    playerRef.current = new window.YT.Player('yt-player-element', {
      height: '100%',
      width: '100%',
      videoId: playbackState.videoId,
      playerVars: {
        // Start at the right integer-second position to minimize visible drift
        start: Math.max(0, Math.floor(startSeconds)),
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
          const dur = event.target?.getDuration?.() ?? 0;
          if (dur > 0) onDurationChangeRef.current?.(dur);

          // Immediately seek to the exact sub-second position (start= is int-only)
          const state = latestPlaybackRef.current;
          if (state) {
            flagInternalChange(2500);
            let exactTarget = state.currentTime;
            if (state.playState === 'playing') {
              exactTarget = Math.max(0, exactTarget + (Date.now() - state.updatedAt) / 1000);
            }
            event.target.seekTo?.(exactTarget, true);
            if (state.playState === 'playing') event.target.playVideo?.();
          }

          setIsPlayerReady(true);
          // Request a fresh server snapshot to correct any loading-time drift
          onRequestSyncRef.current?.();
        },

        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setAutoplayBlocked(false);
          }

          // Ignore if server-driven or user has no control (using ref — no stale closure)
          if (isInternalChangeRef.current || !canControlRef.current) return;

          const player = playerRef.current;
          if (!player) return;
          const currentTime = player.getCurrentTime?.() ?? 0;
          const dur = player.getDuration?.() ?? 0;
          if (dur > 0) onDurationChangeRef.current?.(dur);

          if (event.data === window.YT.PlayerState.PLAYING) {
            onPlayRef.current?.(currentTime);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            onPauseRef.current?.(currentTime);
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
  // canControlPlayback intentionally omitted — role changes must not rebuild player
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiReady, playbackState?.videoId]);

  // ── React to server playback state updates ────────────────────────────────
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || !playbackState) return;
    const player = playerRef.current;

    // Video swap
    if (playbackState.videoId && playbackState.videoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = playbackState.videoId;
      flagInternalChange(2000);
      player.loadVideoById?.(playbackState.videoId, playbackState.currentTime ?? 0);
      return;
    }

    applyServerState(player, playbackState);

    const dur = player.getDuration?.() ?? 0;
    if (dur > 0) onDurationChangeRef.current?.(dur);
  }, [playbackState, isPlayerReady]);

  // ── No video placeholder ──────────────────────────────────────────────────
  if (!playbackState?.videoId) {
    return (
      <div className="w-full aspect-video rounded-xl bg-gray-100 border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
          <Tv className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No video loaded</h2>
        <p className="text-sm text-gray-400 max-w-xs">
          {canControlPlayback
            ? 'Paste a YouTube link in the box below to start watching together.'
            : 'Waiting for the host to load a video…'}
        </p>
        <div className="flex items-center gap-4 mt-6 text-xs text-gray-300">
          <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Any YouTube video</span>
          <span className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" /> Synced playback</span>
          <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Live reactions</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm select-none">
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
            flagInternalChange(1500);
            playerRef.current?.playVideo?.();
            onRequestSyncRef.current?.();
          }}
          className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer pointer-events-auto"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg mb-3 transition-colors">
            <PlayCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Click to Resume</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Your browser paused playback while this tab was in the background. Click to sync back.
          </p>
        </div>
      )}

      <FloatingReactions reactions={reactions} />

      {!canControlPlayback && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <div className="px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-white/60 text-xs font-medium backdrop-blur-sm">
            Viewer
          </div>
        </div>
      )}
    </div>
  );
};
