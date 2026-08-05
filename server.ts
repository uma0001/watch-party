import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { registerChatHandlers } from './server/handlers/chatHandler.js';
import { registerPlaybackHandlers } from './server/handlers/playbackHandler.js';
import { registerRoleHandlers } from './server/handlers/roleHandler.js';
import { registerRoomHandlers } from './server/handlers/roomHandler.js';
import { RoomManager } from './server/managers/RoomManager.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const HOST = '0.0.0.0';

  app.use(express.json());

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  const roomManager = RoomManager.getInstance();

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      activeRooms: roomManager.getAllRoomsState().length,
      timestamp: Date.now(),
    });
  });

  app.get('/api/rooms/:roomId', (req, res) => {
    const room = roomManager.getRoom(req.params.roomId);
    if (!room) {
      res.status(404).json({ exists: false, message: 'Room not found' });
      return;
    }
    res.json({
      exists: true,
      roomId: room.roomId,
      participantCount: room.participants.size,
      hasVideo: !!room.playback.videoId,
    });
  });

  // Socket Connection Pipeline
  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket);
    registerPlaybackHandlers(io, socket);
    registerRoleHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  // Vite Middleware / Static Asset Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Watch Party Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
