import { calendarService } from '../services/calendar.service.js';

export const calendarController = {
  async getEvents(req, res, next) {
    try {
      const events = await calendarService.getEventsForRange(req.user.id, req.query);
      return res.status(200).json({ data: events });
    } catch (err) {
      next(err);
    }
  },

  async createEvent(req, res, next) {
    try {
      const event = await calendarService.createEvent(req.user.id, req.body);
      return res.status(201).json({ data: event });
    } catch (err) {
      next(err);
    }
  },

  async updateEvent(req, res, next) {
    try {
      const event = await calendarService.updateEvent(req.user.id, req.params.id, req.body);
      return res.status(200).json({ data: event });
    } catch (err) {
      next(err);
    }
  },

  async deleteEvent(req, res, next) {
    try {
      const result = await calendarService.deleteEvent(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async checkConflicts(req, res, next) {
    try {
      const conflicts = await calendarService.checkConflicts(req.user.id, req.query);
      return res.status(200).json({ data: conflicts });
    } catch (err) {
      next(err);
    }
  },

  async scheduleTimeBlock(req, res, next) {
    try {
      const result = await calendarService.scheduleTimeBlock(req.user.id, req.body);
      return res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
};
