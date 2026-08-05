import { Server, Socket } from 'socket.io';
import { AssignRolePayload, RemoveParticipantPayload, TransferHostPayload } from '../../src/types/watchParty.js';
import { RoomManager } from '../managers/RoomManager.js';
import { PermissionError, RoomError, RoomNotFoundError, ValidationError } from '../types/errors.js';

export function registerRoleHandlers(io: Server, socket: Socket): void {
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

  // ASSIGN ROLE
  socket.on('assign_role', (payload: AssignRolePayload) => {
    try {
      const { room } = getActiveRoom();
      if (!payload || !payload.userId || !payload.role) {
        throw new ValidationError('Invalid payload for assign_role');
      }

      const updatedParticipants = room.assignRole(socket.id, payload.userId, payload.role);

      io.to(room.roomId).emit('role_assigned', {
        userId: payload.userId,
        role: payload.role,
        participants: updatedParticipants.map((p) => p.toJSON()),
      });
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to assign role';
      socket.emit('action_error', { event: 'assign_role', message });
    }
  });

  // REMOVE PARTICIPANT (KICK)
  socket.on('remove_participant', (payload: RemoveParticipantPayload) => {
    try {
      const { room } = getActiveRoom();
      if (!payload || !payload.userId) {
        throw new ValidationError('Target user ID is required');
      }

      room.assertIsHost(socket.id);

      if (payload.userId === socket.id) {
        throw new PermissionError('Host cannot remove themselves from the room');
      }

      const targetSocket = io.sockets.sockets.get(payload.userId);

      const { removed } = room.removeParticipant(payload.userId);

      if (!removed) {
        throw new ValidationError('User not found in room');
      }

      if (targetSocket) {
        targetSocket.emit('removed_from_room', { reason: 'You were removed from the watch party by the host' });
        targetSocket.leave(room.roomId);
        targetSocket.data.roomId = undefined;
      }

      io.to(room.roomId).emit('participant_removed', {
        userId: payload.userId,
        participants: room.getSortedParticipants().map((p) => p.toJSON()),
      });
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to remove participant';
      socket.emit('action_error', { event: 'remove_participant', message });
    }
  });

  // TRANSFER HOST
  socket.on('transfer_host', (payload: TransferHostPayload) => {
    try {
      const { room } = getActiveRoom();
      if (!payload || !payload.userId) {
        throw new ValidationError('Target user ID is required');
      }

      const updatedParticipants = room.transferHost(socket.id, payload.userId);

      io.to(room.roomId).emit('role_assigned', {
        userId: payload.userId,
        role: 'host',
        participants: updatedParticipants.map((p) => p.toJSON()),
      });
    } catch (err: unknown) {
      const message = err instanceof RoomError ? err.message : 'Failed to transfer host';
      socket.emit('action_error', { event: 'transfer_host', message });
    }
  });
}
