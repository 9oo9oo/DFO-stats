// src/routes/skillRoutes.ts
import { Router } from 'express';
import {
  fetchSkills,
  getSkillStats
} from '../controllers/skillController';

const router = Router();

// Fetch skill data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  fetchSkills
);

// Return skill stats
router.get(
  '/stats/:jobId/:jobGrowId',
  getSkillStats
);

export default router;
