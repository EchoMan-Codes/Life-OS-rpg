import { characterService } from '../services/character.service.js';
import { allocateAttribute } from '../services/progression.service.js';

export class CharacterController {
  /**
   * Handle GET /api/v1/character
   */
  async getCharacter(req, res, next) {
    try {
      const data = await characterService.getCharacter(req.user?.id);
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handle POST /api/v1/character/allocate
   */
  async allocate(req, res, next) {
    try {
      const { attribute, points = 1 } = req.body;
      const data = await allocateAttribute(req.user.id, { attribute, points });
      return res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  }
}

export const characterController = new CharacterController();
