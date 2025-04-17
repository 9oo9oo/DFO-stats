// routes/creatureRoutes.js
const express = require('express');
const router = express.Router();
const creatureController = require('../controllers/creatureController');

// Fetch creature data for characters.
router.get('/fetch/:serverId/:jobId/:jobGrowId', creatureController.fetchCreature);

// Return creature statistics.
router.get('/stats/:jobId/:jobGrowId', creatureController.getCreatureStats);

module.exports = router;