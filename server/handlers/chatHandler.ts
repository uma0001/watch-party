import { Server, Socket } from 'socket.io';
import { SendChatPayload } from '../../src/types/watchParty.js';
import { RoomManager } from '../managers/RoomManager.js';
import { RoomError, RoomNotFoundError } from '../types/errors.js';

export function registerChatHandlers(io: Server, socket: Socket): void {
  const roomManager = RoomManager.getInstance();

  socket.on('chat_message', (payload: SendChatPayload) => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) {
        throw new RoomError('You are not in an active room');
      }

      const room = roomManager.getRoom(roomId);
      if (!room) {
        throw new RoomNotFoundError(roomId);
      }

      const text = (payload?.message || '').trim();
      if (!text) {
        return; // ignore empty messages
      }

      if (text.length > 500) {
        throw new RoomError('Chat message exceeds max length of 500 characters');
      }

      const username = socket.data.username || 'Anonymous';

      io.to(room.roomId).emit('chat_message_received', {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: socket.id,
        username,
        text,
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to send chat message';
      socket.emit('action_error', { event: 'chat_message', message });
    }
  });

  socket.on('live_reaction', (payload: { emoji: string }) => {
    try {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      const emoji = (payload?.emoji || '').trim();
      if (!emoji) return;

      const username = socket.data.username || 'Anonymous';

      io.to(room.roomId).emit('live_reaction_received', {
        id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: socket.id,
        username,
        emoji,
        timestamp: Date.now(),
      });
    } catch {
      // Ignore reaction errors
    }
  });
}
