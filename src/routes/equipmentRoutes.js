// routes/equipmentRoutes.js
const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Fetch equipment data for characters.
router.get('/fetch/:serverId/:jobId/:jobGrowId', equipmentController.fetchEquipment);

// Return equipment statistics.
router.get('/stats/:jobId/:jobGrowId', equipmentController.getEquipmentStats);

module.exports = router;
