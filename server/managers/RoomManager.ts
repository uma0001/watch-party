import { RoomState } from '../../src/types/watchParty.js';
import { Participant } from '../models/Participant.js';
import { Room } from '../models/Room.js';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room>;

  private constructor() {
    this.rooms = new Map<string, Room>();
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  public createRoom(roomId?: string, videoId?: string): Room {
    const id = (roomId || this.generateRoomCode()).toUpperCase().trim();
    if (this.rooms.has(id)) {
      return this.rooms.get(id)!;
    }
    const room = new Room(id, videoId || null);
    this.rooms.set(id, room);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    const normalizedId = roomId.toUpperCase().trim();
    return this.rooms.get(normalizedId);
  }

  public getOrCreateRoom(roomId: string, videoId?: string): Room {
    const normalizedId = roomId.toUpperCase().trim();
    const existing = this.rooms.get(normalizedId);
    if (existing) {
      return existing;
    }
    return this.createRoom(normalizedId, videoId);
  }

  public deleteRoom(roomId: string): boolean {
    const normalizedId = roomId.toUpperCase().trim();
    return this.rooms.delete(normalizedId);
  }

  public handleDisconnectUser(userId: string): Array<{ room: Room; removed: Participant; newHostId: string | null; isRoomEmpty: boolean }> {
    const results: Array<{ room: Room; removed: Participant; newHostId: string | null; isRoomEmpty: boolean }> = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(userId)) {
        const { removed, newHostId } = room.removeParticipant(userId);
        if (removed) {
          const isRoomEmpty = room.participants.size === 0;
          if (isRoomEmpty) {
            this.deleteRoom(roomId);
          }
          results.push({ room, removed, newHostId, isRoomEmpty });
        }
      }
    }

    return results;
  }

  public getAllRoomsState(): RoomState[] {
    return Array.from(this.rooms.values()).map((room) => room.toState());
  }

  public clear(): void {
    this.rooms.clear();
  }
}
