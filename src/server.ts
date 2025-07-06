// src/server.ts

import 'dotenv/config';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';

// Import your route modules (ensure they’re also converted to TS or have type definitions)
import serverRoutes from './routes/serverRoutes';
import characterRoutes from './routes/characterRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import creatureRoutes from './routes/creatureRoutes';
import talismanRoutes from './routes/talismanRoutes';
import skillRoutes from './routes/skillRoutes';
import avatarRoutes from './routes/avatarRoutes';
import itemRoutes from './routes/itemRoutes';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(
  express.static(path.join(__dirname, '../client/dist'))
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('json spaces', 2);

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/servers', serverRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/creature', creatureRoutes);
app.use('/api/talisman', talismanRoutes);
app.use('/api/skill', skillRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/items', itemRoutes);

// Fallback to client
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// ─── Server Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
