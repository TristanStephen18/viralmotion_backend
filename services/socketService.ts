import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HTTPServer) {
  const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "https://remotion-web-application.vercel.app",
    "http://localhost:5173",
  ];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('join', (userId: number) => {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined notification room`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function emitNotificationToUser(userId: number, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit('new-notification', notification);
    console.log(`📤 Notification sent to user ${userId}`);
  }
}

export function emitNotificationUpdate(userId: number, eventType: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(eventType, data);
  }
}