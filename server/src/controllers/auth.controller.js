import { authService } from '../services/auth.service.js';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
} from '../services/token.service.js';
import { env } from '../config/env.js';

export class AuthController {
  async register(req, res, next) {
    try {
      const userAgent = req.headers['user-agent'] || null;
      const ip = req.ip || req.socket.remoteAddress || null;

      const result = await authService.register({
        ...req.body,
        userAgent,
        ip,
      });

      res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, REFRESH_COOKIE_OPTIONS);

      return res.status(201).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.rawRefreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const userAgent = req.headers['user-agent'] || null;
      const ip = req.ip || req.socket.remoteAddress || null;

      const result = await authService.login({
        ...req.body,
        userAgent,
        ip,
      });

      res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, REFRESH_COOKIE_OPTIONS);

      return res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.rawRefreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    const rawRefreshToken =
      req.cookies[REFRESH_COOKIE_NAME] ||
      req.headers['x-refresh-token'] ||
      req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token cookie is missing.',
        },
      });
    }

    try {
      const userAgent = req.headers['user-agent'] || null;
      const ip = req.ip || req.socket.remoteAddress || null;

      const result = await authService.refresh({
        rawRefreshToken,
        userAgent,
        ip,
      });

      res.cookie(REFRESH_COOKIE_NAME, result.rawRefreshToken, REFRESH_COOKIE_OPTIONS);

      return res.status(200).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.rawRefreshToken,
        },
      });
    } catch (err) {
      // Clear refresh cookie on any refresh error (expired, invalid, or reuse detected)
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const rawRefreshToken =
        req.cookies[REFRESH_COOKIE_NAME] ||
        req.headers['x-refresh-token'] ||
        req.body?.refreshToken;

      if (rawRefreshToken) {
        await authService.logout({ rawRefreshToken });
      }

      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);

      return res.status(200).json({
        data: {
          message: 'Logged out successfully.',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);
      return res.status(200).json({
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async googleCallback(req, res) {
    if (!req.user || !req.user.rawRefreshToken) {
      return res.redirect(`${env.CLIENT_ORIGIN}/auth/callback?auth_error=google_failed`);
    }

    res.cookie(REFRESH_COOKIE_NAME, req.user.rawRefreshToken, REFRESH_COOKIE_OPTIONS);

    // Redirect to client without tokens in URL per Phase 1.2 spec
    return res.redirect(`${env.CLIENT_ORIGIN}/auth/callback`);
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.user.id, req.body);
      return res.status(200).json({ data: { user } });
    } catch (err) {
      next(err);
    }
  }

  async resetAccount(req, res, next) {
    try {
      const result = await authService.resetAccount(req.user.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetSection(req, res, next) {
    try {
      const { target } = req.body;
      const result = await authService.resetSection(req.user.id, target);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const result = await authService.deleteAccount(req.user.id, req.body.confirmation);
      res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
