// routes/tailsmanRoutes.js
const express = require('express');
const router = express.Router();
const talismanController = require('../controllers/talismanController');

// Fetch equipment data for characters.
router.get('/fetch/:serverId/:jobId/:jobGrowId', talismanController.fetchTalismanAndRunes);

// Return equipment statistics.
router.get('/stats/:jobId/:jobGrowId', talismanController.getTalismanRuneStats);

module.exports = router;
