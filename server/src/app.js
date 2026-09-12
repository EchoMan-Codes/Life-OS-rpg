import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { configurePassport } from './config/passport.js';
import { authService } from './services/auth.service.js';
import authRoutes from './routes/auth.routes.js';
import characterRoutes from './routes/character.routes.js';
import habitRoutes from './routes/habit.routes.js';
import dailyRoutes from './routes/daily.routes.js';
import questRoutes from './routes/quest.routes.js';

const app = express();

// Security headers
app.use(helmet());

// Allowed frontend origins (including localhost and 127.0.0.1 Vite dev variants)
const allowedOrigins = new Set([
  env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]);

// CORS configuration supporting credentials from frontend
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, postman, or server-to-server)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing & cookie middleware
app.use(express.json());
app.use(cookieParser());

// Passport authentication initialization
const passport = configurePassport(authService);
app.use(passport.initialize());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount domain routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/character', characterRoutes);
app.use('/api/v1/habits', habitRoutes);
app.use('/api/v1/dailies', dailyRoutes);
app.use('/api/v1/quests', questRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Centralized error handler enforcing standardized error envelope
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');

  if (status === 500) {
    console.error(`[SERVER ERROR] ${err.message}`, err.stack);
  }

  res.status(status).json({
    error: {
      code,
      message: err.message || 'An unexpected error occurred.',
      ...(err.suggestions && { suggestions: err.suggestions }),
    },
  });
});

export default app;
