import { studyService } from '../services/study.service.js';

export class StudyController {
  async getStudyLogs(req, res, next) {
    try {
      const logs = await studyService.getStudyLogs({
        userId: req.user.id,
        limit: parseInt(req.query.limit || '50', 10),
        offset: parseInt(req.query.offset || '0', 10),
      });
      return res.status(200).json({ data: { logs } });
    } catch (err) {
      next(err);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await studyService.getStudySummary({ userId: req.user.id });
      return res.status(200).json({ data: { summary } });
    } catch (err) {
      next(err);
    }
  }

  async logStudy(req, res, next) {
    try {
      const { subject, durationMinutes, notes } = req.body;
      const result = await studyService.logStudySession({
        userId: req.user.id,
        subject,
        durationMinutes,
        notes,
      });
      return res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const studyController = new StudyController();
