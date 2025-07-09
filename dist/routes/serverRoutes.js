"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/serverRoutes.ts
const express_1 = require("express");
const serverController_1 = require("../controllers/serverController");
const router = (0, express_1.Router)();
// Return server data
router.get('/', serverController_1.getServers);
exports.default = router;
