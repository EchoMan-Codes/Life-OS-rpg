import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';

import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { isGoogleConfigured } from '../config/passport.js';
import { env } from '../config/env.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  displayName: z.string().min(1, 'Display name is required').max(50),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Email & Password registration (rate limited to 5 req/min per IP)
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

// Email & Password login (rate limited to 5 req/min per IP)
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

// Refresh token rotation (HttpOnly cookie)
router.post('/refresh', authController.refresh);

// Logout (clears refresh token)
router.post('/logout', authController.logout);

// Current user profile
router.get('/me', requireAuth, authController.me);

// Google OAuth initiate
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured) {
    return res.status(503).json({
      error: {
        code: 'GOOGLE_AUTH_UNAVAILABLE',
        message: 'Google OAuth is not configured on this server.',
      },
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
});

// Google OAuth callback
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!isGoogleConfigured) {
      return res.redirect(`${env.CLIENT_ORIGIN}/auth/callback?auth_error=google_not_configured`);
    }
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.CLIENT_ORIGIN}/auth/callback?auth_error=oauth_failure`,
    })(req, res, next);
  },
  authController.googleCallback
);

export default router;
