// src/routes/talismanRoutes.ts
import { Router } from 'express';
import {
    fetchTalismanAndRunes,
    getTalismanRuneStats
} from '../controllers/talismanController';

const router = Router();

// Fetch talisman data
router.get(
    '/fetch/:serverId/:jobId/:jobGrowId',
    fetchTalismanAndRunes
);

// Return talisman stats
router.get(
    '/stats/:jobId/:jobGrowId',
    getTalismanRuneStats
);

export default router;
