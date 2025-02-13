const express = require('express');
const router = express.Router();
const buildController = require('../controllers/buildController');

// POST /api/builds - add a new build
router.post('/', buildController.createBuild);

// GET /api/builds - retrieve all builds or filter by class
router.get('/', buildController.getBuilds);

module.exports = router;
