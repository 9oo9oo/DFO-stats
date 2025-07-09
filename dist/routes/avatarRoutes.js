"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/avatarRoutes.ts
const express_1 = require("express");
const avatarController_1 = require("../controllers/avatarController");
const router = (0, express_1.Router)();
// Fetch avatar data
router.get('/fetch/:serverId/:jobId/:jobGrowId', avatarController_1.getAvatar);
// Return avatar stats
router.get('/stats/:jobId/:jobGrowId', avatarController_1.getAvatarStats);
exports.default = router;
