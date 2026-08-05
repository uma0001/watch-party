import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

export function useSocket() {
  const [socket] = useState<Socket>(() => getSocket());
  const [status, setStatus] = useState<ConnectionStatus>(
    socket.connected ? 'connected' : 'connecting'
  );

  useEffect(() => {
    function onConnect() {
      setStatus('connected');
    }

    function onDisconnect() {
      setStatus('disconnected');
    }

    function onReconnectAttempt() {
      setStatus('reconnecting');
    }

    function onError() {
      setStatus('disconnected');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('error', onError);

    if (socket.connected) {
      setStatus('connected');
    } else {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('error', onError);
    };
  }, [socket]);

  return { socket, status, socketId: socket.id };
}
