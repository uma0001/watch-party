import { PlaybackState, Role, RoomState } from '../../src/types/watchParty.js';
import { extractYouTubeId } from '../../src/utils/youtube.js';
import { PermissionError, ValidationError } from '../types/errors.js';
import { Participant } from './Participant.js';

export class Room {
  public readonly roomId: string;
  public hostId: string;
  public participants: Map<string, Participant>;
  public playback: PlaybackState;

  constructor(roomId: string, initialVideoId: string | null = null) {
    this.roomId = roomId;
    this.hostId = '';
    this.participants = new Map<string, Participant>();
    const cleanId = initialVideoId ? extractYouTubeId(initialVideoId) || initialVideoId : null;
    this.playback = {
      videoId: cleanId,
      playState: 'paused',
      currentTime: 0,
      updatedAt: Date.now(),
    };
  }

  // --- Permission Assertions ---
  public assertCanControlPlayback(userId: string): void {
    const participant = this.participants.get(userId);
    if (!participant) {
      throw new PermissionError('Participant is not in this room');
    }
    if (participant.role !== 'host' && participant.role !== 'moderator') {
      throw new PermissionError('Only the Host or Moderators can control video playback');
    }
  }

  public assertIsHost(userId: string): void {
    const participant = this.participants.get(userId);
    if (!participant) {
      throw new PermissionError('Participant is not in this room');
    }
    if (participant.role !== 'host') {
      throw new PermissionError('Only the Host can perform this administrative action');
    }
  }

  // --- Participant Operations ---
  public addParticipant(
    userId: string,
    username: string,
    sessionId?: string
  ): { participant: Participant; isReconnection: boolean } {
    // 1. Check for existing participant session strictly by sessionId or disconnected username
    for (const [existingSocketId, existingParticipant] of this.participants.entries()) {
      const matchSession = Boolean(sessionId && existingParticipant.sessionId === sessionId);
      const matchUsername = existingParticipant.username.toLowerCase() === username.toLowerCase();

      // Only reclaim session if sessionId matches, OR if username matches and the existing user is marked disconnected
      if (matchSession || (matchUsername && existingParticipant.isDisconnected)) {
        if (existingParticipant.disconnectTimer) {
          clearTimeout(existingParticipant.disconnectTimer);
          existingParticipant.disconnectTimer = undefined;
        }

        if (existingSocketId !== userId) {
          this.participants.delete(existingSocketId);
        }

        existingParticipant.userId = userId;
        existingParticipant.isDisconnected = false;
        if (sessionId) existingParticipant.sessionId = sessionId;
        this.participants.set(userId, existingParticipant);

        if (existingParticipant.role === 'host') {
          this.hostId = userId;
        }

        return { participant: existingParticipant, isReconnection: true };
      }
    }

    // 2. Resolve username collision for new connected participant if username is already taken
    let finalUsername = username.trim() || 'Anonymous';
    let counter = 1;
    const existingUsernames = new Set(
      Array.from(this.participants.values()).map((p) => p.username.toLowerCase())
    );

    while (existingUsernames.has(finalUsername.toLowerCase())) {
      finalUsername = `${username.trim()} (${counter})`;
      counter++;
    }

    // 3. New Participant
    const isFirstParticipant = this.participants.size === 0;
    const role: Role = isFirstParticipant ? 'host' : 'participant';

    const participant = new Participant(userId, finalUsername, role, sessionId);
    this.participants.set(userId, participant);

    if (isFirstParticipant) {
      this.hostId = userId;
    }

    return { participant, isReconnection: false };
  }

  public markDisconnected(userId: string, onGraceExpired: (removed: Participant) => void): boolean {
    const participant = this.participants.get(userId);
    if (!participant) return false;

    participant.isDisconnected = true;
    if (participant.disconnectTimer) {
      clearTimeout(participant.disconnectTimer);
    }

    // 45s grace period for reconnecting before purging
    participant.disconnectTimer = setTimeout(() => {
      if (participant.isDisconnected && this.participants.has(userId)) {
        this.removeParticipant(userId);
        onGraceExpired(participant);
      }
    }, 45000);

    return true;
  }

  public removeParticipant(userId: string): { removed: Participant | undefined; newHostId: string | null } {
    const participant = this.participants.get(userId);
    if (!participant) {
      return { removed: undefined, newHostId: this.hostId || null };
    }

    if (participant.disconnectTimer) {
      clearTimeout(participant.disconnectTimer);
      participant.disconnectTimer = undefined;
    }

    this.participants.delete(userId);

    let newHostId: string | null = null;
    if (this.hostId === userId) {
      newHostId = this.reassignHostIfNeeded();
    } else {
      newHostId = this.hostId;
    }

    return { removed: participant, newHostId };
  }

  public reassignHostIfNeeded(): string | null {
    if (this.participants.size === 0) {
      this.hostId = '';
      return null;
    }

    // Check if current host is still in the room and NOT permanently disconnected
    if (this.hostId && this.participants.has(this.hostId)) {
      const currentHost = this.participants.get(this.hostId);
      if (currentHost && !currentHost.isDisconnected) {
        return this.hostId;
      }
    }

    // Find the next longest-tenured active participant (earliest joinedAt & not disconnected)
    let oldestParticipant: Participant | null = null;
    for (const p of this.participants.values()) {
      if (!p.isDisconnected) {
        if (!oldestParticipant || p.joinedAt < oldestParticipant.joinedAt) {
          oldestParticipant = p;
        }
      }
    }

    if (oldestParticipant) {
      oldestParticipant.role = 'host';
      this.hostId = oldestParticipant.userId;
      return this.hostId;
    }

    this.hostId = '';
    return null;
  }

  // --- Playback Operations ---
  public play(actorUserId: string, currentTime: number): PlaybackState {
    this.assertCanControlPlayback(actorUserId);

    this.playback = {
      ...this.playback,
      playState: 'playing',
      currentTime: Math.max(0, currentTime),
      updatedAt: Date.now(),
    };

    return this.getExtrapolatedPlayback();
  }

  public pause(actorUserId: string, currentTime: number): PlaybackState {
    this.assertCanControlPlayback(actorUserId);

    this.playback = {
      ...this.playback,
      playState: 'paused',
      currentTime: Math.max(0, currentTime),
      updatedAt: Date.now(),
    };

    return { ...this.playback };
  }

  public seek(actorUserId: string, time: number): PlaybackState {
    this.assertCanControlPlayback(actorUserId);

    this.playback = {
      ...this.playback,
      currentTime: Math.max(0, time),
      updatedAt: Date.now(),
    };

    return this.getExtrapolatedPlayback();
  }

  public changeVideo(actorUserId: string, videoId: string): PlaybackState {
    this.assertCanControlPlayback(actorUserId);

    if (!videoId || typeof videoId !== 'string') {
      throw new ValidationError('Invalid video ID');
    }

    const cleanId = extractYouTubeId(videoId) || videoId.trim();

    this.playback = {
      videoId: cleanId,
      playState: 'paused',
      currentTime: 0,
      updatedAt: Date.now(),
    };

    return { ...this.playback };
  }

  // --- Role & Management Operations ---
  public assignRole(actorUserId: string, targetUserId: string, newRole: Role): Participant[] {
    this.assertIsHost(actorUserId);

    if (actorUserId === targetUserId) {
      throw new PermissionError('Host cannot assign roles to themselves');
    }

    const target = this.participants.get(targetUserId);
    if (!target) {
      throw new ValidationError('Target user not found in this room');
    }

    if (newRole === 'host') {
      // Transfer host role
      return this.transferHost(actorUserId, targetUserId);
    }

    target.role = newRole;
    return this.getSortedParticipants();
  }

  public transferHost(actorUserId: string, targetUserId: string): Participant[] {
    this.assertIsHost(actorUserId);

    const currentHost = this.participants.get(actorUserId);
    const target = this.participants.get(targetUserId);

    if (!target) {
      throw new ValidationError('Target user for host transfer not found');
    }

    if (currentHost) {
      currentHost.role = 'moderator';
    }

    target.role = 'host';
    this.hostId = target.userId;

    return this.getSortedParticipants();
  }

  // --- Helper Methods ---
  public getExtrapolatedPlayback(): PlaybackState {
    const now = Date.now();
    if (this.playback.playState === 'playing') {
      const elapsedSeconds = (now - this.playback.updatedAt) / 1000;
      this.playback = {
        ...this.playback,
        currentTime: this.playback.currentTime + elapsedSeconds,
        updatedAt: now,
      };
    }
    return { ...this.playback };
  }

  public getSortedParticipants(): Participant[] {
    // Sort host first, then moderators, then participants (and by tenure)
    const roleOrder: Record<Role, number> = { host: 0, moderator: 1, participant: 2 };
    return Array.from(this.participants.values()).sort((a, b) => {
      if (roleOrder[a.role] !== roleOrder[b.role]) {
        return roleOrder[a.role] - roleOrder[b.role];
      }
      return a.joinedAt - b.joinedAt;
    });
  }

  public toState(): RoomState {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      participants: this.getSortedParticipants().map((p) => p.toJSON()),
      playback: this.getExtrapolatedPlayback(),
    };
  }
}
