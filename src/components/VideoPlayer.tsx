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

  // Tracks whether the current state change is caused by us (not user)
  const isInternalChangeRef = useRef(false);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  // Stores the latest playbackState so onReady closure can read it
  const latestPlaybackRef = useRef<PlaybackState | null>(null);

  // Keep latestPlaybackRef always current without triggering effects
  useEffect(() => {
    latestPlaybackRef.current = playbackState;
  }, [playbackState]);

  /**
   * Flag all upcoming player state changes as internal (server-driven).
   * Any duration shorter than durationMs will be considered internal and
   * won't be forwarded to the server as user actions.
   */
  const flagInternalChange = (durationMs = 1500) => {
    isInternalChangeRef.current = true;
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      isInternalChangeRef.current = false;
    }, durationMs);
  };

  /**
   * Apply the given playback snapshot to the YouTube player.
   * Always uses a single flagInternalChange so seek + play
   * don't race against each other.
   */
  const applyServerState = (player: any, state: PlaybackState) => {
    if (!player || typeof player.getCurrentTime !== 'function') return;

    // Extrapolate current target position on the client side
    let targetTime = state.currentTime;
    if (state.playState === 'playing') {
      const elapsed = (Date.now() - state.updatedAt) / 1000;
      targetTime = Math.max(0, targetTime + elapsed);
    }

    const localTime = player.getCurrentTime?.() ?? 0;
    const drift = Math.abs(localTime - targetTime);
    const playerState = player.getPlayerState?.() ?? -1;

    const needsSeek = drift > 1.0;
    const needsPlay =
      state.playState === 'playing' &&
      playerState !== window.YT?.PlayerState?.PLAYING;
    const needsPause =
      state.playState === 'paused' &&
      playerState === window.YT?.PlayerState?.PLAYING;

    if (!needsSeek && !needsPlay && !needsPause) return;

    // Single flag covers seek + play/pause so they don't race
    flagInternalChange(2000);

    if (needsSeek) {
      player.seekTo?.(targetTime, true);
    }

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
      (wrapperRef.current.requestFullscreen?.() ||
        (wrapperRef.current as any).webkitRequestFullscreen?.());
    } else {
      (document.exitFullscreen?.() || (document as any).webkitExitFullscreen?.());
    }
  };

  useImperativeHandle(ref, () => ({ toggleFullscreen }));

  // ── Load YouTube IFrame API once ─────────────────────────────────────────
  useEffect(() => {
    if (window.YT?.Player) { setIsApiReady(true); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('script')[0]?.parentNode?.insertBefore(
      tag,
      document.getElementsByTagName('script')[0]
    );
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); setIsApiReady(true); };
  }, []);

  // ── Create player when API + videoId are both ready ───────────────────────
  useEffect(() => {
    if (!isApiReady || !playbackState?.videoId || playerRef.current) return;

    // Compute the right starting position right now so the player
    // loads at the correct timestamp instead of always starting at 0.
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

    // FIX #1 — Flag as internal BEFORE creating the player so the
    // initial autoplay `onStateChange(PLAYING)` at t=0 is never
    // forwarded to the server as a user action.
    flagInternalChange(4000);

    playerRef.current = new window.YT.Player('yt-player-element', {
      height: '100%',
      width: '100%',
      videoId: playbackState.videoId,
      playerVars: {
        // FIX #2 — Start at the right position so viewers don't see
        // t=0 briefly before the first seekTo kicks in.
        start: Math.floor(startSeconds),
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
          if (dur > 0 && onDurationChange) onDurationChange(dur);

          // Fine-tune position after player is fully loaded.
          // The `start` param is integer-only; seekTo gives exact ms precision.
          const state = latestPlaybackRef.current;
          if (state) {
            // Brief flag so this programmatic seek doesn't trigger server events
            flagInternalChange(2000);
            let exactTarget = state.currentTime;
            if (state.playState === 'playing') {
              exactTarget = Math.max(0, exactTarget + (Date.now() - state.updatedAt) / 1000);
            }
            event.target.seekTo?.(exactTarget, true);
            if (state.playState === 'playing') {
              event.target.playVideo?.();
            }
          }

          setIsPlayerReady(true);
          // Request a fresh sync snapshot from the server to correct
          // any drift that accumulated while the player was loading.
          if (onRequestSync) onRequestSync();
        },

        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setAutoplayBlocked(false);
          }

          // Skip if this is a server-driven change or user has no control
          if (isInternalChangeRef.current || !canControlPlayback) return;

          const player = playerRef.current;
          if (!player) return;

          const currentTime = player.getCurrentTime?.() ?? 0;
          const dur = player.getDuration?.() ?? 0;
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

  // ── React to server state updates (play / pause / seek from host) ─────────
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || !playbackState) return;
    const player = playerRef.current;

    // Video change
    if (playbackState.videoId && playbackState.videoId !== currentVideoIdRef.current) {
      currentVideoIdRef.current = playbackState.videoId;
      flagInternalChange(2000);
      player.loadVideoById?.(playbackState.videoId, playbackState.currentTime ?? 0);
      return; // loadVideoById will trigger onReady → requestSync
    }

    // FIX #3 — single applyServerState call with one unified flagInternalChange
    applyServerState(player, playbackState);

    const dur = player.getDuration?.() ?? 0;
    if (dur > 0 && onDurationChange) onDurationChange(dur);
  }, [playbackState, isPlayerReady]);

  // Page visibility: re-sync when tab returns to foreground
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && onRequestSync) {
        onRequestSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onRequestSync]);

  // ── No video loaded placeholder ───────────────────────────────────────────
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
          <div className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /><span>Any YouTube video</span></div>
          <div className="flex items-center gap-1.5"><PlayCircle className="w-3.5 h-3.5" /><span>Synced playback</span></div>
          <div className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /><span>Live reactions</span></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm group select-none"
    >
      {/* YouTube Player */}
      <div ref={containerRef} className="w-full h-full pointer-events-auto" />

      {/* Top shield — blocks YouTube title/share link clicks */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-20 pointer-events-auto bg-transparent cursor-default"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
      />

      {/* Full shield for viewers — prevents any YouTube UI interaction */}
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
          className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center cursor-pointer pointer-events-auto"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg mb-3 hover:bg-blue-500 transition-colors">
            <PlayCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Click to Resume</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Your browser paused playback while this tab was in the background. Click to sync back.
          </p>
        </div>
      )}

      {/* Floating Reactions */}
      <FloatingReactions reactions={reactions} />

      {/* Viewer mode badge */}
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
