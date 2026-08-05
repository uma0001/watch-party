import { Server, Socket } from 'socket.io';
import { JoinRoomPayload, LeaveRoomPayload } from '../../src/types/watchParty.js';
import { RoomManager } from '../managers/RoomManager.js';
import { RoomError, ValidationError } from '../types/errors.js';

export function registerRoomHandlers(io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  // JOIN ROOM
  socket.on('join_room', (payload: JoinRoomPayload) => {
    try {
      if (!payload || !payload.roomId || typeof payload.roomId !== 'string') {
        throw new ValidationError('Room ID is required');
      }

      const username = (payload.username || '').trim() || 'Anonymous';
      const roomId = payload.roomId.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase().trim().slice(0, 10);

      if (!roomId) {
        throw new ValidationError('Valid Room ID is required');
      }

      const room = roomManager.getOrCreateRoom(roomId, payload.initialVideoId);

      // Leave previous rooms if any
      if (socket.data.roomId && socket.data.roomId !== roomId) {
        handleUserLeave(io, socket, socket.data.roomId);
      }

      const { participant, isReconnection } = room.addParticipant(socket.id, username, payload.sessionId);

      socket.data.roomId = room.roomId;
      socket.data.username = participant.username;

      socket.join(room.roomId);

      // 1. Hydrate playback state privately to joining socket
      socket.emit('sync_state', room.getExtrapolatedPlayback());

      // 2. Hydrate full room state privately to joining socket
      socket.emit('room_state', room.toState());

      // 3. Broadcast user_joined only if this is a new participant (not a silent reconnection)
      if (!isReconnection) {
        io.to(room.roomId).emit('user_joined', {
          userId: socket.id,
          username: participant.username,
          participants: room.getSortedParticipants().map((p) => p.toJSON()),
        });
      } else {
        // Broadcast updated participant list to room without notification spam
        io.to(room.roomId).emit('room_state', room.toState());
      }
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to join room';
      socket.emit('action_error', { event: 'join_room', message });
    }
  });

  // LEAVE ROOM (Explicit User Action)
  socket.on('leave_room', (payload: LeaveRoomPayload) => {
    try {
      const roomId = payload?.roomId || socket.data.roomId;
      if (roomId) {
        handleUserLeave(io, socket, roomId);
      }
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to leave room';
      socket.emit('action_error', { event: 'leave_room', message });
    }
  });

  // DISCONNECT HANDLER (Grace Period Buffer for Network Drops / Tab Backgrounding)
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const roomManager = RoomManager.getInstance();
    const room = roomManager.getRoom(roomId);
    if (!room) return;

    // Mark participant as disconnected with 45s grace period before purging
    room.markDisconnected(socket.id, (removedParticipant) => {
      // Called only after 45s grace period expires
      if (room.participants.size === 0) {
        roomManager.deleteRoom(room.roomId);
      } else {
        io.to(room.roomId).emit('user_left', {
          userId: socket.id,
          username: removedParticipant.username,
          participants: room.getSortedParticipants().map((p) => p.toJSON()),
        });
      }
    });
  });
}

function handleUserLeave(io: Server, socket: Socket, roomId: string): void {
  const roomManager = RoomManager.getInstance();
  const room = roomManager.getRoom(roomId);

  if (!room) return;

  const { removed } = room.removeParticipant(socket.id);
  socket.leave(room.roomId);
  socket.data.roomId = undefined;

  if (room.participants.size === 0) {
    roomManager.deleteRoom(room.roomId);
  } else if (removed) {
    io.to(room.roomId).emit('user_left', {
      userId: socket.id,
      username: removed.username,
      participants: room.getSortedParticipants().map((p) => p.toJSON()),
    });
  }
}
