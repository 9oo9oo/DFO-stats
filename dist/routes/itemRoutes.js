"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/itemRoutes.ts
const express_1 = require("express");
const itemController_1 = require("../controllers/itemController");
const router = (0, express_1.Router)();
// Return item data when mouse hovered (for tooltip)
router.get('/:itemId', itemController_1.getItemInfo);
exports.default = router;
