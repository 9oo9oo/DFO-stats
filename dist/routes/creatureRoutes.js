"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/creatureRoutes.ts
const express_1 = require("express");
const creatureController_1 = require("../controllers/creatureController");
const router = (0, express_1.Router)();
// Fetch creature data
router.get('/fetch/:serverId/:jobId/:jobGrowId', creatureController_1.fetchCreature);
// Return creature stats
router.get('/stats/:jobId/:jobGrowId', creatureController_1.getCreatureStats);
// Return creature & artifact combinations
router.get('/combinations/:jobId/:jobGrowId', creatureController_1.getCreatureArtifactCombinations);
exports.default = router;
