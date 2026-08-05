import { Server, Socket } from 'socket.io';
import { ChangeVideoPayload, PausePayload, PlayPayload, SeekPayload } from '../../src/types/watchParty.js';
import { RoomManager } from '../managers/RoomManager.js';
import { RoomError, RoomNotFoundError } from '../types/errors.js';

export function registerPlaybackHandlers(io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  const getActiveRoom = (): { room: ReturnType<typeof roomManager.getRoom> } => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      throw new RoomError('You are not in an active room');
    }
    const room = roomManager.getRoom(roomId);
    if (!room) {
      throw new RoomNotFoundError(roomId);
    }
    return { room };
  };

  // PLAY
  socket.on('play', (payload: PlayPayload) => {
    try {
      const { room } = getActiveRoom();
      const currentTime = typeof payload?.currentTime === 'number' ? payload.currentTime : 0;
      const updatedPlayback = room.play(socket.id, currentTime);

      io.to(room.roomId).emit('sync_state', updatedPlayback);
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to play video';
      socket.emit('action_error', { event: 'play', message });
    }
  });

  // PAUSE
  socket.on('pause', (payload: PausePayload) => {
    try {
      const { room } = getActiveRoom();
      const currentTime = typeof payload?.currentTime === 'number' ? payload.currentTime : 0;
      const updatedPlayback = room.pause(socket.id, currentTime);

      io.to(room.roomId).emit('sync_state', updatedPlayback);
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to pause video';
      socket.emit('action_error', { event: 'pause', message });
    }
  });

  // SEEK
  socket.on('seek', (payload: SeekPayload) => {
    try {
      const { room } = getActiveRoom();
      const time = typeof payload?.time === 'number' ? payload.time : 0;
      const updatedPlayback = room.seek(socket.id, time);

      io.to(room.roomId).emit('sync_state', updatedPlayback);
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to seek video';
      socket.emit('action_error', { event: 'seek', message });
    }
  });

  // CHANGE VIDEO
  socket.on('change_video', (payload: ChangeVideoPayload) => {
    try {
      const { room } = getActiveRoom();
      if (!payload || !payload.videoId) {
        throw new RoomError('Video ID is required');
      }
      const updatedPlayback = room.changeVideo(socket.id, payload.videoId);

      io.to(room.roomId).emit('sync_state', updatedPlayback);
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to change video';
      socket.emit('action_error', { event: 'change_video', message });
    }
  });

  // REQUEST SYNC
  socket.on('request_sync', () => {
    try {
      const { room } = getActiveRoom();
      socket.emit('sync_state', room.getExtrapolatedPlayback());
    } catch {
      // Silent ignore on sync requests if not in room
    }
  });
}
