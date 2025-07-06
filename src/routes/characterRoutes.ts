// src/routes/characterRoutes.ts
import { Router } from 'express';
import { getCharacter } from '../controllers/characterController';

const router = Router();

// Fetch character IDs for each class / advancement
router.get('/:serverId/:jobId/:jobGrowId', getCharacter);

export default router;