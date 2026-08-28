import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    // Client sends their user info and college to join private user room & college room
    socket.on('join_room', (data: { userId: string; collegeId: string; role: string }) => {
      if (data?.userId) {
        socket.join(`user:${data.userId}`);
      }
      if (data?.collegeId) {
        socket.join(`college:${data.collegeId}`);
      }
      if (data?.role) {
        socket.join(`role:${data.collegeId}:${data.role}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToCollege(collegeId: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`college:${collegeId}`).emit(event, data);
  }
}

export function emitToRole(collegeId: string, role: string, event: string, data: any): void {
  if (ioInstance) {
    ioInstance.to(`role:${collegeId}:${role}`).emit(event, data);
  }
}
