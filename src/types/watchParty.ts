export type Role = 'host' | 'moderator' | 'participant';

export interface Participant {
  userId: string;
  username: string;
  role: Role;
  joinedAt: number;
}

export type PlayState = 'playing' | 'paused';

export interface PlaybackState {
  videoId: string | null;
  playState: PlayState;
  currentTime: number; // in seconds
  updatedAt: number; // epoch ms for drift extrapolation
}

export interface RoomState {
  roomId: string;
  hostId: string;
  participants: Participant[];
  playback: PlaybackState;
  chatHistory?: ChatMessage[]; // sent on join so late-joiners see previous messages
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface LiveReaction {
  id: string;
  userId: string;
  username: string;
  emoji: string;
  timestamp: number;
}

// Socket Payload Interfaces
export interface JoinRoomPayload {
  roomId: string;
  username: string;
  initialVideoId?: string;
  sessionId?: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface PlayPayload {
  currentTime: number;
}

export interface PausePayload {
  currentTime: number;
}

export interface SeekPayload {
  time: number;
}

export interface ChangeVideoPayload {
  videoId: string;
}

export interface AssignRolePayload {
  userId: string;
  role: Role;
}

export interface RemoveParticipantPayload {
  userId: string;
}

export interface TransferHostPayload {
  userId: string;
}

export interface SendChatPayload {
  message: string;
}

export interface ActionErrorPayload {
  event: string;
  message: string;
}

export interface UserJoinedPayload {
  userId: string;
  username: string;
  participants: Participant[];
}

export interface UserLeftPayload {
  userId: string;
  username: string;
  participants: Participant[];
}

export interface RoleAssignedPayload {
  userId: string;
  role: Role;
  participants: Participant[];
}

export interface ParticipantRemovedPayload {
  userId: string;
  participants: Participant[];
}
