// src/routes/serverRoutes.ts
import { Router } from 'express';
import { getServers } from '../controllers/serverController';

const router = Router();

// Return server data
router.get('/', getServers);

export default router;
