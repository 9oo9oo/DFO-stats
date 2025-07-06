// src/routes/serverRoutes.ts
import { Router } from 'express';
import serverController from '../controllers/serverController';

const router = Router();

// Return server data
router.get('/', serverController.getServers);

export default router;
