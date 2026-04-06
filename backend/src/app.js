import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { corsOptions } from './config/cors.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import groupRoutes from './routes/group.routes.js';
import submissionRoutes from './routes/submission.routes.js';

const app = express();

// Security & cross-cutting middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Domain routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Global error handler — MUST be last.
app.use(errorHandler);

export default app;
