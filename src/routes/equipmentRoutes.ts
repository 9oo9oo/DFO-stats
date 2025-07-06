// src/routes/equipmentRoutes.ts
import { Router } from 'express';
import equipmentController from '../controllers/equipmentController';

const router = Router();

// Fetch equipment data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  equipmentController.fetchEquipment
);

// Return equipment stats
router.get(
  '/stats/:jobId/:jobGrowId',
  equipmentController.getEquipmentStats
);

// Equipment Combination Endpoint
router.get(
  '/combinations/:jobId/:jobGrowId',
  equipmentController.getEquipmentCombinations
);

export default router;
