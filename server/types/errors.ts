export class RoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomError';
  }
}

export class PermissionError extends RoomError {
  constructor(message: string = 'Unauthorized: You do not have permission to perform this action') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class RoomNotFoundError extends RoomError {
  constructor(roomId: string) {
    super(`Room '${roomId}' not found`);
    this.name = 'RoomNotFoundError';
  }
}

export class ValidationError extends RoomError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
