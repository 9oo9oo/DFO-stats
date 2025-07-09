"use strict";
// src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
// Import your route modules (ensure they’re also converted to TS or have type definitions)
const serverRoutes_1 = __importDefault(require("./routes/serverRoutes"));
const characterRoutes_1 = __importDefault(require("./routes/characterRoutes"));
const equipmentRoutes_1 = __importDefault(require("./routes/equipmentRoutes"));
const creatureRoutes_1 = __importDefault(require("./routes/creatureRoutes"));
const talismanRoutes_1 = __importDefault(require("./routes/talismanRoutes"));
const skillRoutes_1 = __importDefault(require("./routes/skillRoutes"));
const avatarRoutes_1 = __importDefault(require("./routes/avatarRoutes"));
const itemRoutes_1 = __importDefault(require("./routes/itemRoutes"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? '3000', 10);
// ─── Middleware ────────────────────────────────────────────────────────────
app.use(express_1.default.static(path_1.default.join(__dirname, '../client/dist')));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.set('json spaces', 2);
// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/servers', serverRoutes_1.default);
app.use('/api/character', characterRoutes_1.default);
app.use('/api/equipment', equipmentRoutes_1.default);
app.use('/api/creature', creatureRoutes_1.default);
app.use('/api/talisman', talismanRoutes_1.default);
app.use('/api/skill', skillRoutes_1.default);
app.use('/api/avatar', avatarRoutes_1.default);
app.use('/api/items', itemRoutes_1.default);
// Fallback to client
app.get('*', (req, res, next) => {
    res.sendFile(path_1.default.join(__dirname, '../client/dist', 'index.html'));
});
// ─── Server Start ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
