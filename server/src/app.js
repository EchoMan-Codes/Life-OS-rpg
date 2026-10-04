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
import shopRoutes from './routes/shop.routes.js';
import battleEventRoutes from './routes/battle-event.routes.js';
import focusRoutes from './routes/focus.routes.js';
import reflectionRoutes from './routes/reflection.routes.js';
import restModeRoutes from './routes/rest-mode.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import aiRoutes from './routes/ai.routes.js';
import reportRoutes from './routes/report.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';

const app = express();

// Security headers
app.use(helmet());

// Allowed frontend origins (including localhost and 127.0.0.1 Vite dev variants, Capacitor, and production Vercel)
const allowedOrigins = new Set([
  env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'https://life-os-rpg-ukcq.vercel.app',
]);

// CORS configuration supporting credentials from frontend (including local network IPs for mobile testing)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, native mobile HTTP clients, postman)
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      // Allow Vercel preview or production deployments of the app
      if (/^https:\/\/life-os-rpg-[a-z0-9-]+\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      // Allow local network Wi-Fi IP access in development
      if (
        env.NODE_ENV === 'development' &&
        /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Body parsing & cookie middleware
app.use(express.json());
app.use(cookieParser());

// Passport authentication initialization
const passport = configurePassport(authService);
app.use(passport.initialize());

// Health check endpoints (supports /health, /api/health, and /api/v1/health)
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
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
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/battle-events', battleEventRoutes);
app.use('/battle-events', battleEventRoutes);
app.use('/api/v1/focus', focusRoutes);
app.use('/focus', focusRoutes);
app.use('/api/v1/reflections', reflectionRoutes);
app.use('/reflections', reflectionRoutes);
app.use('/api/v1/rest-mode', restModeRoutes);
app.use('/rest-mode', restModeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/ai', aiRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/reports', reportRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/feedback', feedbackRoutes);

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
      ...(err.details && { details: err.details }),
    },
  });
});

export default app;
