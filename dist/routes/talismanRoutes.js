"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/talismanRoutes.ts
const express_1 = require("express");
const talismanController_1 = require("../controllers/talismanController");
const router = (0, express_1.Router)();
// Fetch talisman data
router.get('/fetch/:serverId/:jobId/:jobGrowId', talismanController_1.fetchTalismanAndRunes);
// Return talisman stats
router.get('/stats/:jobId/:jobGrowId', talismanController_1.getTalismanRuneStats);
exports.default = router;
