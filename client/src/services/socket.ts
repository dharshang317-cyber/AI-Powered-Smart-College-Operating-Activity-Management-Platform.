import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    let socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    if (socketUrl.endsWith('/api')) {
      socketUrl = socketUrl.replace(/\/api\/?$/, '');
    }

    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function joinUserRooms(userId: string, collegeId: string, role: string): void {
  const s = getSocket();
  s.emit('join_room', { userId, collegeId, role });
}
