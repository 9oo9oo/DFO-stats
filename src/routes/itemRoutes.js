// routes/itemRoutes.js
const express = require('express');
const router = express.Router();
const { getItemInfo } = require('../controllers/itemController');

router.get('/:itemId', getItemInfo);

module.exports = router;