import crypto from 'crypto';
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
import { sendPasswordResetEmail } from '../utils/mailer.js';
import { env } from '../config/env.js';

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
      `SELECT id, email, display_name, avatar_url, timezone, motto,
              notification_preferences, ai_preferences, onboarding_completed, created_at
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
      motto: user.motto || '',
      notificationPreferences: user.notification_preferences || {
        dailyReminders: true,
        habitReminders: true,
        questReminders: true,
        reminderMinutesBefore: 10,
        soundEnabled: true,
      },
      aiPreferences: user.ai_preferences || {
        tone: 'encouraging',
        featuresEnabled: true,
      },
      onboardingCompleted: !!user.onboarding_completed,
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

  /**
   * Request password reset token and send email.
   */
  async forgotPassword({ email }) {
    const normalizedEmail = email.toLowerCase().trim();
    const res = await query('SELECT id, email, display_name FROM users WHERE email = $1', [normalizedEmail]);
    
    // Constant response time/behavior to mitigate user enumeration
    if (res.rows.length === 0) {
      return { message: 'If an account exists with that email, a password reset link has been sent.' };
    }

    const user = res.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const clientOrigin = env.CORS_ORIGIN ? (Array.isArray(env.CORS_ORIGIN) ? env.CORS_ORIGIN[0] : env.CORS_ORIGIN.split(',')[0]) : 'http://localhost:5173';
    const resetUrl = `${clientOrigin.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        displayName: user.display_name,
      });
    } catch (mailErr) {
      console.error('[AUTH] Failed to send password reset email:', mailErr);
    }

    return { message: 'If an account exists with that email, a password reset link has been sent.' };
  }

  /**
   * Reset password using token.
   */
  async resetPassword({ token, newPassword }) {
    if (!token) {
      const err = new Error('Reset token is required.');
      err.status = 400;
      throw err;
    }

    // Password strength check
    const zxcvbnResult = zxcvbnValidator.check(newPassword);
    if (zxcvbnResult.score < 2) {
      const err = new Error('Password is too weak. Please choose a stronger password.');
      err.status = 400;
      err.code = 'WEAK_PASSWORD';
      err.suggestions = zxcvbnResult.feedback.suggestions || [];
      throw err;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return withTransaction(async (client) => {
      const tokenRes = await client.query(
        `SELECT id, user_id, expires_at, used_at
         FROM password_reset_tokens
         WHERE token_hash = $1 FOR UPDATE`,
        [tokenHash]
      );

      const tokenRecord = tokenRes.rows[0];
      if (!tokenRecord || tokenRecord.used_at || new Date(tokenRecord.expires_at) < new Date()) {
        const err = new Error('Invalid, used, or expired reset token.');
        err.status = 400;
        err.code = 'INVALID_TOKEN';
        throw err;
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      // Update user's password
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
        [passwordHash, tokenRecord.user_id]
      );

      // Mark token as used
      await client.query(
        'UPDATE password_reset_tokens SET used_at = now() WHERE id = $1',
        [tokenRecord.id]
      );

      // Revoke all active sessions
      await client.query(
        'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
        [tokenRecord.user_id]
      );

      return { success: true, message: 'Password has been successfully reset. Please log in.' };
    });
  }

  /**
   * Update user profile settings.
   */
  async updateProfile(userId, { displayName, motto, avatarUrl, timezone, notificationPreferences, aiPreferences, onboardingCompleted }) {
    const updates = [];
    const params = [userId];

    if (displayName !== undefined) {
      params.push(displayName.trim());
      updates.push(`display_name = $${params.length}`);
    }

    if (motto !== undefined) {
      params.push(motto.trim());
      updates.push(`motto = $${params.length}`);
    }

    if (avatarUrl !== undefined) {
      params.push(avatarUrl);
      updates.push(`avatar_url = $${params.length}`);
    }

    if (timezone !== undefined && isValidTimezone(timezone)) {
      params.push(timezone);
      updates.push(`timezone = $${params.length}`);
    }

    if (notificationPreferences !== undefined) {
      params.push(JSON.stringify(notificationPreferences));
      updates.push(`notification_preferences = $${params.length}::jsonb`);
    }

    if (aiPreferences !== undefined) {
      params.push(JSON.stringify(aiPreferences));
      updates.push(`ai_preferences = $${params.length}::jsonb`);
    }

    if (onboardingCompleted !== undefined) {
      params.push(Boolean(onboardingCompleted));
      updates.push(`onboarding_completed = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.getUserById(userId);
    }

    updates.push('updated_at = now()');

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1`,
      params
    );

    return this.getUserById(userId);
  }

  /**
   * Reset RPG Progression and all tasks/habits/inventory back to Level 1.
   */
  async resetAccount(userId) {
    return withTransaction(async (client) => {
      // 1. Reset character stats
      await client.query(
        `UPDATE character_stats
         SET level = 1,
             current_hp = 100,
             max_hp = 100,
             current_mana = 50,
             max_mana = 50,
             current_xp = 0,
             next_level_xp = 100,
             gold = 0,
             strength = 10,
             intelligence = 10,
             willpower = 10,
             agility = 10,
             constitution = 10,
             total_habits_completed = 0,
             total_dailies_completed = 0,
             total_quests_completed = 0,
             current_streak = 0,
             longest_streak = 0,
             updated_at = now()
         WHERE user_id = $1`,
        [userId]
      );

      // 2. Clear habits & logs
      await client.query('DELETE FROM habit_logs WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM habits WHERE user_id = $1', [userId]);

      // 3. Clear dailies & completions
      await client.query('DELETE FROM daily_completions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM dailies WHERE user_id = $1', [userId]);

      // 4. Clear quests
      await client.query('DELETE FROM quest_completions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM quest_milestones WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM quest_items WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM quests WHERE user_id = $1', [userId]);

      // 5. Clear inventory, focus sessions, reflections, notifications
      await client.query('DELETE FROM user_inventory WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM focus_sessions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM reflections WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);

      return { success: true, message: 'Account progression has been reset to Level 1.' };
    });
  }

  /**
   * Permanently delete user account and all cascaded data.
   */
  async deleteAccount(userId, confirmation) {
    if (confirmation !== 'DELETE') {
      const err = new Error('Confirmation keyword DELETE is required to permanently delete your account.');
      err.status = 400;
      throw err;
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);
    return { success: true, message: 'Account permanently deleted.' };
  }
}

export const authService = new AuthService();

