import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { PORT, UPLOAD_DIR } from './config/constants';
import { initDatabase } from './database/db';
import { seedDatabase } from './database/seed';
import { connectMongoDB } from './database/mongodb';
import { initSocketIO } from './services/socket.service';

// Route imports
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import facultyRoutes from './routes/faculty.routes';
import studentRoutes from './routes/student.routes';
import classroomRoutes from './routes/classroom.routes';
import assessmentsRoutes from './routes/assessments.routes';
import attendanceRoutes from './routes/attendance.routes';
import eventsRoutes from './routes/events.routes';
import communicationRoutes from './routes/communication.routes';
import aiRoutes from './routes/ai.routes';
import timetableRoutes from './routes/timetable.routes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocketIO(server);

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/timetable', timetableRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'CampusNexus AI',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'An unexpected internal error occurred' });
});

async function bootstrap() {
  try {
    console.log('Initializing CampusNexus AI Database...');
    await initDatabase();
    await connectMongoDB();
    console.log('Database initialized. Checking seed data...');
    await seedDatabase();

    server.listen(PORT, () => {
      console.log(`🚀 CampusNexus AI Server running at http://localhost:${PORT}`);
      console.log(`📡 WebSocket Real-Time Gateway connected`);
      console.log(`🤖 AI Provider Layer: ${process.env.AI_PROVIDER || 'Smart Local College Context Engine'}`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
