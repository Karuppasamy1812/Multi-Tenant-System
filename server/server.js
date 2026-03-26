import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './config/db.js';
import logger from './config/logger.js';
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import initSocketHandler from './socket/socket.handler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:3000'];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use((req, _res, next) => {
  logger.info('Request', `${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/auth',     authRoutes);
app.use('/api/tenant',   tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use(errorHandler);

initSocketHandler(io);

connectDB().then(() => {
  server.listen(process.env.PORT, () => {
    logger.success('Server', `Running on port ${process.env.PORT}`);
  });
});

process.on('SIGTERM', () => { logger.warn('Server', 'SIGTERM — shutting down'); server.close(); });
process.on('SIGINT',  () => { logger.warn('Server', 'SIGINT — shutting down');  server.close(); });

export { app, server };
