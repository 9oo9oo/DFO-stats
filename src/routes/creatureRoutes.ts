// src/routes/creatureRoutes.ts
import { Router } from 'express';
import creatureController from '../controllers/creatureController';

const router = Router();

// Fetch creature data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  creatureController.fetchCreature
);

// Return creature stats
router.get(
  '/stats/:jobId/:jobGrowId',
  creatureController.getCreatureStats
);

// Return creature & artifact combinations
router.get(
  '/combinations/:jobId/:jobGrowId',
  creatureController.getCreatureArtifactCombinations
);

export default router;
