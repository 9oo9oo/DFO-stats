// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const { getItemInfo } = require('../controllers/itemController');

// Return item data when mouse hovered (for tooltip)
router.get('/:itemId', getItemInfo);

module.exports = router;