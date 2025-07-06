// src/routes/avatarRoutes.ts
import { Router } from 'express';
import avatarController from '../controllers/avatarController';

const router = Router();

// Fetch avatar data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  avatarController.getAvatar
);

// Return avatar stats
router.get(
  '/stats/:jobId/:jobGrowId',
  avatarController.getAvatarStats
);

export default router;
