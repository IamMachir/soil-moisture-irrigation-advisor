const express = require('express');
const router = express.Router();
const { recentEvents, manualWater } = require('../controllers/irrigationController');

router.get('/', recentEvents);
router.post('/manual', manualWater);

module.exports = router;
