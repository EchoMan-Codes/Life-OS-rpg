import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'rt';

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

/**
 * Generate a short-lived JWT access token (15 min).
 * Payload contains only { sub: userId } — no PII per specification.
 *
 * @param {string} userId - User UUID
 * @returns {string} Signed JWT
 */
export function generateAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}

/**
 * Verify a JWT access token.
 *
 * @param {string} token - JWT string
 * @returns {object} Decoded payload
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256'],
  });
}

/**
 * Generate a cryptographically secure 32-byte base64url refresh token.
 *
 * @returns {string} Raw refresh token
 */
export function generateRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Hash a raw refresh token using SHA-256.
 * The raw token is never stored in the database.
 *
 * @param {string} rawToken - Raw refresh token string
 * @returns {string} SHA-256 hex digest
 */
export function hashRefreshToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Get expiration timestamp for a new refresh token (now + 7 days).
 *
 * @returns {Date} Expiry Date object
 */
export function getRefreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}
