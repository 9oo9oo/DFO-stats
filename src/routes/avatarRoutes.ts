// src/routes/avatarRoutes.ts
import { Router } from 'express';
import { getAvatar, getAvatarStats } from '../controllers/avatarController';

const router = Router();

// Fetch avatar data
router.get(
  '/fetch/:serverId/:jobId/:jobGrowId',
  getAvatar
);

// Return avatar stats
router.get(
  '/stats/:jobId/:jobGrowId',
  getAvatarStats
);

export default router;