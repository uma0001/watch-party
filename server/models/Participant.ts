import { Participant as IParticipant, Role } from '../../src/types/watchParty.js';

export class Participant implements IParticipant {
  public userId: string;
  public username: string;
  public role: Role;
  public joinedAt: number;

  constructor(userId: string, username: string, role: Role = 'participant') {
    this.userId = userId;
    const trimmed = (username || '').trim().slice(0, 30);
    this.username = trimmed || 'Anonymous';
    this.role = role;
    this.joinedAt = Date.now();
  }

  public toJSON(): IParticipant {
    return {
      userId: this.userId,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}
