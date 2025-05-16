// routes/creatureRoutes.js
const express = require('express');
const router = express.Router();
const creatureController = require('../controllers/creatureController');

// Fetch creature data
router.get('/fetch/:serverId/:jobId/:jobGrowId', creatureController.fetchCreature);

// Return creature stats
router.get('/stats/:jobId/:jobGrowId', creatureController.getCreatureStats);

// Return creature & artifact combinations
router.get('/combinations/:jobId/:jobGrowId', creatureController.getCreatureArtifactCombinations);

module.exports = router;