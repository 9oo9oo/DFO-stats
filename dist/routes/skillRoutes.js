"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/skillRoutes.ts
const express_1 = require("express");
const skillController_1 = require("../controllers/skillController");
const router = (0, express_1.Router)();
// Fetch skill data
router.get('/fetch/:serverId/:jobId/:jobGrowId', skillController_1.fetchSkills);
// Return skill stats
router.get('/stats/:jobId/:jobGrowId', skillController_1.getSkillStats);
exports.default = router;
