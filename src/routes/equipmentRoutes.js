// routes/equipmentRoutes.js
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Fetch equipment data
router.get('/fetch/:serverId/:jobId/:jobGrowId', equipmentController.fetchEquipment);

// Return equipment stats
router.get('/stats/:jobId/:jobGrowId', equipmentController.getEquipmentStats);

// Equipment Combination Endpoint
router.get('/combinations/:jobId/:jobGrowId', equipmentController.getEquipmentCombinations);

module.exports = router;
