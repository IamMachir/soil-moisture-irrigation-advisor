const express = require('express');
const router = express.Router();
const { recentEvents } = require('../controllers/irrigationController');

router.get('/', recentEvents);

module.exports = router;
