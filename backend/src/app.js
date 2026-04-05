import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { corsOptions } from './config/cors.js';

const app = express();

// Security & cross-cutting middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Domain routes are mounted in their respective sprints:
//   /api/v1/auth         -> Sprint 1
//   /api/v1/groups       -> Sprint 3
//   /api/v1/assignments  -> Sprint 5
//   /api/v1/submissions  -> Sprint 7
//   /api/v1/dashboard    -> Sprint 9
//
// Global error handler is mounted in Sprint 1.

export default app;
