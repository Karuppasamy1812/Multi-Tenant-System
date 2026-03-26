import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth.routes.js';
import tenantRoutes from '../routes/tenant.routes.js';
import projectRoutes from '../routes/project.routes.js';
import taskRoutes from '../routes/task.routes.js';
import errorHandler from '../middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth',     authRoutes);
app.use('/api/tenant',   tenantRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);
app.use(errorHandler);

export { app };
