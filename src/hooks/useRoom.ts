import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionErrorPayload,
  ChatMessage,
  LiveReaction,
  Participant,
  PlaybackState,
  Role,
  RoleAssignedPayload,
  RoomState,
  UserJoinedPayload,
  UserLeftPayload,
} from '../types/watchParty.js';
import { useSocket } from './useSocket.js';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: number;
}

export function useRoom() {
  const { socket, status, socketId } = useSocket();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [liveReactions, setLiveReactions] = useState<LiveReaction[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [kickedReason, setKickedReason] = useState<string | null>(null);
  const joinedRoomInfoRef = useRef<{ roomId: string; username: string } | null>(null);
  const toastTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string) => {
    // Deduplicate identical toasts within 1.5s
    const now = Date.now();
    if (lastToastRef.current && lastToastRef.current.message === message && now - lastToastRef.current.timestamp < 1500) {
      return;
    }
    lastToastRef.current = { message, timestamp: now };

    const id = `toast-${now}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = type === 'error' ? 6000 : 4000;

    setToasts((prev) => [...prev.slice(-3), { id, type, message, timestamp: now }]);

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      removeToast(id);
    }, duration);
    toastTimersRef.current.set(id, timer);
  }, [removeToast]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    };
  }, []);

  // Handle Tab Switch & Background/Foreground Recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && joinedRoomInfoRef.current && socket) {
        console.log('[Sync] Tab returned to foreground. Requesting room synchronization...');
        socket.emit('request_sync');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  const myParticipant = useMemo(() => {
    if (!roomState || !socketId) return null;
    return roomState.participants.find((p) => p.userId === socketId) || null;
  }, [roomState, socketId]);

  const isHost = myParticipant?.role === 'host';
  const isModerator = myParticipant?.role === 'moderator';
  const canControlPlayback = isHost || isModerator;

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    function onConnect() {
      if (joinedRoomInfoRef.current) {
        console.log('[Sync] Socket connected/reconnected. Joining room & requesting sync...');
        socket.emit('join_room', joinedRoomInfoRef.current);
        socket.emit('request_sync');
      }
    }

    function onSyncState(playback: PlaybackState) {
      console.log('[Sync] Received sync_state:', playback);
      setPlaybackState(playback);
      setRoomState((prev) => (prev ? { ...prev, playback } : null));
    }

    function onRoomState(state: RoomState) {
      setRoomState(state);
      setPlaybackState(state.playback);
      setKickedReason(null);
    }

    function onUserJoined(payload: UserJoinedPayload) {
      setRoomState((prev) =>
        prev
          ? {
              ...prev,
              participants: payload.participants,
            }
          : null
      );
      addToast('info', `${payload.username} joined the party 🎉`);
    }

    function onUserLeft(payload: UserLeftPayload) {
      setRoomState((prev) => {
        if (!prev) return null;

        // Check if host changed automatically
        const newHost = payload.participants.find((p) => p.role === 'host');
        const hostChanged = newHost && newHost.userId !== prev.hostId;

        if (hostChanged) {
          addToast('warning', `Host left. ${newHost.username} is now the Host!`);
        } else {
          addToast('info', `${payload.username} left the party`);
        }

        return {
          ...prev,
          hostId: newHost ? newHost.userId : prev.hostId,
          participants: payload.participants,
        };
      });
    }

    function onRoleAssigned(payload: RoleAssignedPayload) {
      setRoomState((prev) =>
        prev
          ? {
              ...prev,
              participants: payload.participants,
              hostId: payload.participants.find((p) => p.role === 'host')?.userId || prev.hostId,
            }
          : null
      );

      const target = payload.participants.find((p) => p.userId === payload.userId);
      const name = target ? target.username : 'A user';
      addToast('success', `${name} is now a ${payload.role.toUpperCase()}`);
    }

    function onParticipantRemoved(payload: { userId: string; participants: Participant[] }) {
      setRoomState((prev) =>
        prev
          ? {
              ...prev,
              participants: payload.participants,
            }
          : null
      );
      addToast('warning', 'A participant was removed by the Host');
    }

    function onRemovedFromRoom(payload: { reason: string }) {
      joinedRoomInfoRef.current = null;
      setRoomState(null);
      setPlaybackState(null);
      setKickedReason(payload.reason || 'You were removed from the room');
      addToast('error', payload.reason || 'You were removed from the room');
    }

    function onActionError(payload: ActionErrorPayload) {
      addToast('error', payload.message);
    }

    function onChatMessageReceived(msg: ChatMessage) {
      setChatMessages((prev) => [...prev.slice(-99), msg]);
    }

    function onLiveReactionReceived(rx: LiveReaction) {
      setLiveReactions((prev) => [...prev.slice(-25), rx]);
    }

    socket.on('connect', onConnect);
    socket.on('sync_state', onSyncState);
    socket.on('room_state', onRoomState);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('role_assigned', onRoleAssigned);
    socket.on('participant_removed', onParticipantRemoved);
    socket.on('removed_from_room', onRemovedFromRoom);
    socket.on('action_error', onActionError);
    socket.on('chat_message_received', onChatMessageReceived);
    socket.on('live_reaction_received', onLiveReactionReceived);

    return () => {
      socket.off('connect', onConnect);
      socket.off('sync_state', onSyncState);
      socket.off('room_state', onRoomState);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('role_assigned', onRoleAssigned);
      socket.off('participant_removed', onParticipantRemoved);
      socket.off('removed_from_room', onRemovedFromRoom);
      socket.off('action_error', onActionError);
      socket.off('chat_message_received', onChatMessageReceived);
      socket.off('live_reaction_received', onLiveReactionReceived);
    };
  }, [socket, addToast]);

  // Outgoing Actions
  const joinRoom = useCallback(
    (roomId: string, username: string, initialVideoId?: string) => {
      if (!socket) return;
      joinedRoomInfoRef.current = { roomId, username };
      socket.emit('join_room', { roomId, username, initialVideoId });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    if (!socket || !roomState) return;
    joinedRoomInfoRef.current = null;
    socket.emit('leave_room', { roomId: roomState.roomId });
    setRoomState(null);
    setPlaybackState(null);
    setChatMessages([]);
  }, [socket, roomState]);

  const play = useCallback(
    (currentTime: number) => {
      if (!socket) return;
      socket.emit('play', { currentTime });
    },
    [socket]
  );

  const pause = useCallback(
    (currentTime: number) => {
      if (!socket) return;
      socket.emit('pause', { currentTime });
    },
    [socket]
  );

  const seek = useCallback(
    (time: number) => {
      if (!socket) return;
      socket.emit('seek', { time });
    },
    [socket]
  );

  const changeVideo = useCallback(
    (videoId: string) => {
      if (!socket) return;
      socket.emit('change_video', { videoId });
    },
    [socket]
  );

  const assignRole = useCallback(
    (userId: string, role: Role) => {
      if (!socket) return;
      socket.emit('assign_role', { userId, role });
    },
    [socket]
  );

  const removeParticipant = useCallback(
    (userId: string) => {
      if (!socket) return;
      socket.emit('remove_participant', { userId });
    },
    [socket]
  );

  const transferHost = useCallback(
    (userId: string) => {
      if (!socket) return;
      socket.emit('transfer_host', { userId });
    },
    [socket]
  );

  const sendChatMessage = useCallback(
    (message: string) => {
      if (!socket) return;
      socket.emit('chat_message', { message });
    },
    [socket]
  );

  const sendLiveReaction = useCallback(
    (emoji: string) => {
      if (!socket) return;
      socket.emit('live_reaction', { emoji });
    },
    [socket]
  );

  const requestSync = useCallback(() => {
    if (!socket) return;
    socket.emit('request_sync');
  }, [socket]);

  return {
    socketStatus: status,
    socketId,
    roomState,
    playbackState,
    myParticipant,
    isHost,
    isModerator,
    canControlPlayback,
    chatMessages,
    liveReactions,
    toasts,
    kickedReason,
    joinRoom,
    leaveRoom,
    play,
    pause,
    seek,
    changeVideo,
    assignRole,
    removeParticipant,
    transferHost,
    sendChatMessage,
    sendLiveReaction,
    requestSync,
    removeToast,
  };
}
