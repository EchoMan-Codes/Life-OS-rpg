import bcrypt from 'bcrypt';
import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { translations, dictionary } from '@zxcvbn-ts/language-en';

import { query, withTransaction } from '../db/pool.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry,
} from './token.service.js';

// Initialize zxcvbn factory with English language dictionary
const zxcvbnValidator = new ZxcvbnFactory({
  translations,
  dictionary,
});

/**
 * Validates whether a string is a recognized IANA timezone identifier.
 *
 * @param {string} tz
 * @returns {boolean}
 */
export function isValidTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export class AuthService {
  /**
   * Register a new user with email, password, display name, and optional IANA timezone.
   */
  async register({ email, password, displayName, userAgent, ip, timezone = 'UTC' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const safeTimezone = isValidTimezone(timezone) ? timezone : 'UTC';

    // 1. Password strength validation with @zxcvbn-ts/core (minimum score 2)
    const zxcvbnResult = zxcvbnValidator.check(password);
    if (zxcvbnResult.score < 2) {
      const err = new Error('Password is too weak. Please choose a stronger password.');
      err.status = 400;
      err.code = 'WEAK_PASSWORD';
      err.suggestions = zxcvbnResult.feedback.suggestions || [];
      throw err;
    }

    // 2. Check for duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      const err = new Error('An account with this email address already exists.');
      err.status = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    // 3. Hash password with bcrypt (12 rounds per specification)
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user and initial refresh token in a single transaction
    return withTransaction(async (client) => {
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, display_name, timezone)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, display_name, avatar_url, timezone, created_at`,
        [normalizedEmail, passwordHash, displayName.trim(), safeTimezone]
      );
      const user = userRes.rows[0];

      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const expiresAt = getRefreshTokenExpiry();

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, tokenHash, expiresAt, userAgent, ip]
      );

      const accessToken = generateAccessToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          timezone: user.timezone || 'UTC',
          createdAt: user.created_at,
        },
        accessToken,
        rawRefreshToken,
      };
    });
  }

  /**
   * Log in an existing user with email and password.
   */
  async login({ email, password, userAgent, ip }) {
    const normalizedEmail = email.toLowerCase().trim();

    const userRes = await query(
      `SELECT id, email, password_hash, display_name, avatar_url, timezone, created_at
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    const user = userRes.rows[0];
    if (!user || !user.password_hash) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    return withTransaction(async (client) => {
      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const expiresAt = getRefreshTokenExpiry();

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, tokenHash, expiresAt, userAgent, ip]
      );

      const accessToken = generateAccessToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          timezone: user.timezone || 'UTC',
          createdAt: user.created_at,
        },
        accessToken,
        rawRefreshToken,
      };
    });
  }

  /**
   * Refresh token rotation with strict theft reuse detection and row-level locking.
   */
  async refresh({ rawRefreshToken, userAgent, ip }) {
    if (!rawRefreshToken) {
      const err = new Error('Refresh token is required.');
      err.status = 401;
      err.code = 'MISSING_REFRESH_TOKEN';
      throw err;
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    return withTransaction(async (client) => {
      // Row-level lock to prevent concurrent rotation race conditions
      const tokenRes = await client.query(
        `SELECT id, user_id, revoked_at, expires_at
         FROM refresh_tokens
         WHERE token_hash = $1
         FOR UPDATE`,
        [tokenHash]
      );

      const tokenRecord = tokenRes.rows[0];

      if (!tokenRecord) {
        const err = new Error('Refresh token is invalid.');
        err.status = 401;
        err.code = 'INVALID_REFRESH_TOKEN';
        throw err;
      }

      // Check if expired
      if (new Date(tokenRecord.expires_at) < new Date()) {
        const err = new Error('Refresh token has expired.');
        err.status = 401;
        err.code = 'INVALID_REFRESH_TOKEN';
        throw err;
      }

      // REUSE DETECTION: If token was already revoked, a compromised token is being replayed!
      if (tokenRecord.revoked_at !== null) {
        console.warn(
          `[SECURITY ALERT] Refresh token reuse detected for user ${tokenRecord.user_id}! Revoking all sessions.`
        );
        // Revoke all tokens for that user and commit so the revocation persists
        await client.query(
          `UPDATE refresh_tokens
           SET revoked_at = now()
           WHERE user_id = $1 AND revoked_at IS NULL`,
          [tokenRecord.user_id]
        );
        await client.query('COMMIT');

        const err = new Error('Session revoked due to reuse detection. Please log in again.');
        err.status = 401;
        err.code = 'SESSION_REVOKED';
        err.alreadyCommitted = true;
        throw err;
      }

      // Valid token: rotate it
      const newRawToken = generateRefreshToken();
      const newTokenHash = hashRefreshToken(newRawToken);
      const newExpiresAt = getRefreshTokenExpiry();

      // Insert new replacement token
      const newTokenRes = await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [tokenRecord.user_id, newTokenHash, newExpiresAt, userAgent, ip]
      );
      const newTokenId = newTokenRes.rows[0].id;

      // Revoke the old token and link to replacement
      await client.query(
        `UPDATE refresh_tokens
         SET revoked_at = now(), replaced_by_id = $1
         WHERE id = $2`,
        [newTokenId, tokenRecord.id]
      );

      // Fetch user profile
      const userRes = await client.query(
        `SELECT id, email, display_name, avatar_url, created_at
         FROM users WHERE id = $1`,
        [tokenRecord.user_id]
      );
      const user = userRes.rows[0];

      if (!user) {
        const err = new Error('User account not found.');
        err.status = 401;
        err.code = 'USER_NOT_FOUND';
        throw err;
      }

      const accessToken = generateAccessToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
        },
        accessToken,
        rawRefreshToken: newRawToken,
      };
    });
  }

  /**
   * Log out by revoking the current refresh token.
   */
  async logout({ rawRefreshToken }) {
    if (!rawRefreshToken) return;

    const tokenHash = hashRefreshToken(rawRefreshToken);
    await query(
      `UPDATE refresh_tokens
       SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash]
    );
  }

  /**
   * Fetch user by UUID.
   */
  async getUserById(userId) {
    const res = await query(
      `SELECT id, email, display_name, avatar_url, timezone, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    const user = res.rows[0];
    if (!user) {
      const err = new Error('User not found.');
      err.status = 404;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      timezone: user.timezone || 'UTC',
      createdAt: user.created_at,
    };
  }

  /**
   * Upsert Google OAuth user and issue token pair.
   */
  async handleGoogleUser({ profile, userAgent, ip }) {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase()?.trim();
    const displayName = profile.displayName || email?.split('@')[0] || 'Player';
    const avatarUrl = profile.photos?.[0]?.value || null;

    if (!email) {
      const err = new Error('Google account must have an associated email address.');
      err.status = 400;
      err.code = 'GOOGLE_EMAIL_MISSING';
      throw err;
    }

    return withTransaction(async (client) => {
      // Check if user exists by google_id
      let userRes = await client.query(
        `SELECT id, email, display_name, avatar_url, created_at
         FROM users WHERE google_id = $1`,
        [googleId]
      );

      let user = userRes.rows[0];

      if (user) {
        // Update avatar if changed
        if (avatarUrl && avatarUrl !== user.avatar_url) {
          await client.query(
            `UPDATE users SET avatar_url = $1, updated_at = now() WHERE id = $2`,
            [avatarUrl, user.id]
          );
          user.avatar_url = avatarUrl;
        }
      } else {
        // Check if existing user by email to link account
        userRes = await client.query(
          `SELECT id, email, display_name, avatar_url, created_at
           FROM users WHERE email = $1`,
          [email]
        );
        user = userRes.rows[0];

        if (user) {
          // Link google_id
          await client.query(
            `UPDATE users
             SET google_id = $1,
                 avatar_url = COALESCE(avatar_url, $2),
                 updated_at = now()
             WHERE id = $3`,
            [googleId, avatarUrl, user.id]
          );
        } else {
          // Create new user
          const insertRes = await client.query(
            `INSERT INTO users (email, google_id, display_name, avatar_url)
             VALUES ($1, $2, $3, $4)
             RETURNING id, email, display_name, avatar_url, created_at`,
            [email, googleId, displayName, avatarUrl]
          );
          user = insertRes.rows[0];
        }
      }

      // Issue token pair
      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);
      const expiresAt = getRefreshTokenExpiry();

      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, tokenHash, expiresAt, userAgent, ip]
      );

      const accessToken = generateAccessToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
        },
        accessToken,
        rawRefreshToken,
      };
    });
  }
}

export const authService = new AuthService();
