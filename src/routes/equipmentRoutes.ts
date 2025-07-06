// src/routes/equipmentRoutes.ts
import { Router } from 'express';
import {
  fetchEquipment,
  getEquipmentStats,
  getEquipmentCombinations
} from '../controllers/equipmentController';

const router = Router();

// Fetch equipment data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  fetchEquipment
);

// Return equipment stats
router.get(
  '/stats/:jobId/:jobGrowId',
  getEquipmentStats
);

// Equipment Combination Endpoint
router.get(
  '/combinations/:jobId/:jobGrowId',
  getEquipmentCombinations
);

export default router;
