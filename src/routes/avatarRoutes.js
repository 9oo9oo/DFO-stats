// routes/avatarRoutes.js
const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');

// Fetch avatar data
router.get('/fetch/:serverId/:jobId/:jobGrowId', avatarController.getAvatar);

// Return avatar stats
router.get('/stats/:jobId/:jobGrowId', avatarController.getAvatarStats);

module.exports = router;