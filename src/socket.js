import { io } from 'socket.io-client';

const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
let socket = null;

export function createSocket(token) {
  if (!token) {
    return null;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(backendUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: false,
  });

  socket.connect();
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
