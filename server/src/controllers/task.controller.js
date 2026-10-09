import { taskService } from '../services/task.service.js';

export const taskController = {
  async listTasks(req, res, next) {
    try {
      const tasks = await taskService.listTasks(req.user.id, req.query);
      return res.status(200).json({ data: tasks });
    } catch (err) {
      next(err);
    }
  },

  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.user.id, req.body);
      return res.status(201).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async getTask(req, res, next) {
    try {
      const task = await taskService.getTask(req.user.id, req.params.id);
      return res.status(200).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
      return res.status(200).json({ data: task });
    } catch (err) {
      next(err);
    }
  },

  async completeTask(req, res, next) {
    try {
      const result = await taskService.completeTask(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async uncompleteTask(req, res, next) {
    try {
      const result = await taskService.uncompleteTask(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async deleteTask(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.user.id, req.params.id);
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async getSummary(req, res, next) {
    try {
      const summary = await taskService.getSummary(req.user.id);
      return res.status(200).json({ data: summary });
    } catch (err) {
      next(err);
    }
  },
};
