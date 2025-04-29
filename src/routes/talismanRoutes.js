// routes/tailsmanRoutes.js
const express = require('express');
const router = express.Router();
const talismanController = require('../controllers/talismanController');

// Fetch talisman data
router.get('/fetch/:serverId/:jobId/:jobGrowId', talismanController.fetchTalismanAndRunes);

// Return talisman stats
router.get('/stats/:jobId/:jobGrowId', talismanController.getTalismanRuneStats);

module.exports = router;
