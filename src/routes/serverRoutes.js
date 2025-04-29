// routes/serverRoutes.js
const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');

// Return server data
router.get('/', serverController.getServers);

module.exports = router;