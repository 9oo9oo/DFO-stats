// src/routes/characterRoutes.ts
import { Router } from 'express';
import characterController from '../controllers/characterController';

const router = Router();

// Fetch character IDs for each class / advancement
router.get(
  '/:serverId/:jobId/:jobGrowId',
  characterController.getCharacter
);

export default router;
