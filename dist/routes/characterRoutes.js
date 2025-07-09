"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/characterRoutes.ts
const express_1 = require("express");
const characterController_1 = require("../controllers/characterController");
const router = (0, express_1.Router)();
// Fetch character IDs for each class / advancement
router.get('/:serverId/:jobId/:jobGrowId', characterController_1.getCharacter);
exports.default = router;
