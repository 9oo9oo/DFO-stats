"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/equipmentRoutes.ts
const express_1 = require("express");
const equipmentController_1 = require("../controllers/equipmentController");
const router = (0, express_1.Router)();
// Fetch equipment data
router.get('/fetch/:serverId/:jobId/:jobGrowId', equipmentController_1.fetchEquipment);
// Return equipment stats
router.get('/stats/:jobId/:jobGrowId', equipmentController_1.getEquipmentStats);
// Equipment Combination Endpoint
router.get('/combinations/:jobId/:jobGrowId', equipmentController_1.getEquipmentCombinations);
exports.default = router;
