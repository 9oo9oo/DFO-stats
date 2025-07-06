// src/routes/talismanRoutes.ts
import { Router } from 'express';
import talismanController from '../controllers/talismanController';

const router = Router();

// Fetch talisman data
router.get(
    '/fetch/:serverId/:jobId/:jobGrowId',
    talismanController.fetchTalismanAndRunes
);

// Return talisman stats
router.get(
    '/stats/:jobId/:jobGrowId',
    talismanController.getTalismanRuneStats
);

export default router;
