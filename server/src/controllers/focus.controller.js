import { z } from 'zod';
import { focusService } from '../services/focus.service.js';

const startSessionSchema = z.object({
  plannedDurationSeconds: z.coerce.number().int().min(60).max(14400).default(1500),
  ambientSound: z.enum(['rain', 'lofi', 'silence']).optional().default('silence'),
  taskId: z.string().uuid().optional().nullable(),
  taskType: z.string().optional().default('task'),
  taskTitle: z.string().optional().nullable(),
  sessionType: z.enum(['focus', 'short_break', 'long_break']).optional().default('focus'),
  commitmentLevel: z.coerce.number().int().min(1).max(3).optional().default(1),
  shieldProfileId: z.string().uuid().optional().nullable(),
  goalDescription: z.string().max(255).optional().nullable(),
  linkedEntityType: z.enum(['none', 'task', 'quest', 'daily', 'habit']).optional().default('none'),
  linkedEntityId: z.string().uuid().optional().nullable(),
});

const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(50).optional().default('general'),
  restrictedApps: z.array(z.any()).optional().default([]),
  restrictedDomains: z.array(z.any()).optional().default([]),
  defaultDurationSeconds: z.coerce.number().int().min(60).max(14400).optional().default(1500),
  commitmentLevel: z.coerce.number().int().min(1).max(3).optional().default(1),
  isDefault: z.boolean().optional().default(false),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(50).optional(),
  restrictedApps: z.array(z.any()).optional(),
  restrictedDomains: z.array(z.any()).optional(),
  defaultDurationSeconds: z.coerce.number().int().min(60).max(14400).optional(),
  commitmentLevel: z.coerce.number().int().min(1).max(3).optional(),
  isDefault: z.boolean().optional(),
});

const recordEventSchema = z.object({
  eventType: z.string().min(1).max(50),
  metadata: z.record(z.any()).optional().default({}),
  clientTimestamp: z.string().optional().nullable(),
});

const earlyExitSchema = z.object({
  reason: z.string().max(255).optional().default('user_cancelled'),
  holdConfirmed: z.boolean().optional().default(true),
});

const emergencyExitSchema = z.object({
  reason: z.string().max(255).optional().default('emergency'),
});

export class FocusController {
  /**
   * GET /api/v1/focus/capabilities
   */
  async getCapabilities(req, res, next) {
    try {
      const platform = req.query.platform || 'web';
      const capabilities = focusService.getCapabilities(platform);
      return res.status(200).json({ data: capabilities });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/profiles
   */
  async listProfiles(req, res, next) {
    try {
      const profiles = await focusService.listProfiles(req.user.id);
      return res.status(200).json({ data: profiles });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/profiles
   */
  async createProfile(req, res, next) {
    try {
      const parsed = createProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = new Error('Invalid profile parameters');
        err.status = 400;
        err.code = 'INVALID_REQUEST';
        err.details = parsed.error.format();
        return next(err);
      }

      const profile = await focusService.createProfile(req.user.id, parsed.data);
      return res.status(201).json({ data: profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/focus/profiles/:id
   */
  async updateProfile(req, res, next) {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = new Error('Invalid profile parameters');
        err.status = 400;
        err.code = 'INVALID_REQUEST';
        err.details = parsed.error.format();
        return next(err);
      }

      const updated = await focusService.updateProfile(req.user.id, req.params.id, parsed.data);
      return res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/focus/profiles/:id
   */
  async deleteProfile(req, res, next) {
    try {
      const result = await focusService.deleteProfile(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/start
   */
  async start(req, res, next) {
    try {
      const parsed = startSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = new Error('Invalid focus session parameters');
        err.status = 400;
        err.code = 'INVALID_REQUEST';
        err.details = parsed.error.format();
        return next(err);
      }

      const session = await focusService.startSession(req.user.id, parsed.data);
      return res.status(201).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/pause
   */
  async pause(req, res, next) {
    try {
      const result = await focusService.pauseSession(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/resume
   */
  async resume(req, res, next) {
    try {
      const result = await focusService.resumeSession(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/event
   */
  async recordEvent(req, res, next) {
    try {
      const parsed = recordEventSchema.safeParse(req.body);
      if (!parsed.success) {
        const err = new Error('Invalid event payload');
        err.status = 400;
        err.code = 'INVALID_REQUEST';
        err.details = parsed.error.format();
        return next(err);
      }

      const event = await focusService.recordEvent(req.user.id, req.params.id, parsed.data);
      return res.status(201).json({ data: event });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/early-exit
   */
  async earlyExit(req, res, next) {
    try {
      const parsed = earlyExitSchema.safeParse(req.body || {});
      const result = await focusService.earlyExitSession(
        req.user.id,
        req.params.id,
        parsed.success ? parsed.data : {}
      );
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/emergency-exit
   */
  async emergencyExit(req, res, next) {
    try {
      const parsed = emergencyExitSchema.safeParse(req.body || {});
      const result = await focusService.emergencyExitSession(
        req.user.id,
        req.params.id,
        parsed.success ? parsed.data : {}
      );
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/complete
   */
  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await focusService.completeSession(req.user.id, id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/focus/:id/abandon
   */
  async abandon(req, res, next) {
    try {
      const { id } = req.params;
      const session = await focusService.abandonSession(req.user.id, id);
      return res.status(200).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/current
   */
  async getCurrent(req, res, next) {
    try {
      const session = await focusService.getActiveSession(req.user.id);
      return res.status(200).json({ data: session });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/history
   */
  async list(req, res, next) {
    try {
      const sessions = await focusService.listSessions(req.user.id, req.query);
      return res.status(200).json({ data: sessions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/summary
   */
  async getSummary(req, res, next) {
    try {
      const summary = await focusService.getSummary(req.user.id);
      return res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/focus/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const summary = await focusService.getSummary(req.user.id);
      return res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  }
}

export const focusController = new FocusController();
