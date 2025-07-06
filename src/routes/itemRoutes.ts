// src/routes/itemRoutes.ts
import { Router } from 'express';
import { getItemInfo } from '../controllers/itemController';

const router = Router();

// Return item data when mouse hovered (for tooltip)
router.get(
    '/:itemId',
    getItemInfo
);

export default router;
