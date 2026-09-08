import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env.js';
import { configurePassport } from './config/passport.js';
import { authService } from './services/auth.service.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration supporting credentials from frontend
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
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
