// src/routes/creatureRoutes.ts
import { Router } from 'express';
import {
  fetchCreature,
  getCreatureStats,
  getCreatureArtifactCombinations
} from '../controllers/creatureController';

const router = Router();

// Fetch creature data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  fetchCreature
);

// Return creature stats
router.get(
  '/stats/:jobId/:jobGrowId',
  getCreatureStats
);

// Return creature & artifact combinations
router.get(
  '/combinations/:jobId/:jobGrowId',
  getCreatureArtifactCombinations
);

export default router;
