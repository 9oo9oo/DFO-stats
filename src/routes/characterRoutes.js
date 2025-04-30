// routes/characterRoutes.js
const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');

// Fetch character IDs for each class / advancement
router.get('/:serverId/:jobId/:jobGrowId', characterController.getCharacter);

module.exports = router;