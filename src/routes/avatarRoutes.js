// routes/avatarRoutes.js
const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');

router.get('/fetch/:serverId/:jobId/:jobGrowId', avatarController.getAvatar);

router.get('/stats/:jobId/:jobGrowId', avatarController.getAvatarStats);

module.exports = router;