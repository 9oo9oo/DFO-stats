// routes/skillRoutes.js
const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

// Fetch equipment data for characters.
router.get('/fetch/:serverId/:jobId/:jobGrowId', skillController.fetchSkills);

// Return equipment statistics.
router.get('/stats/:jobId/:jobGrowId', skillController.getSkillStats);

module.exports = router;
