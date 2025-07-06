// src/routes/skillRoutes.ts
import { Router } from 'express';
import skillController from '../controllers/skillController';

const router = Router();

// Fetch skill data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  skillController.fetchSkills
);

// Return skill stats
router.get(
  '/stats/:jobId/:jobGrowId',
  skillController.getSkillStats
);

export default router;
