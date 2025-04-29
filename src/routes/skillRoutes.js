// routes/skillRoutes.js
const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

// Fetch skill data
router.get('/fetch/:serverId/:jobId/:jobGrowId', skillController.fetchSkills);

// Return skill stats
router.get('/stats/:jobId/:jobGrowId', skillController.getSkillStats);

module.exports = router;
