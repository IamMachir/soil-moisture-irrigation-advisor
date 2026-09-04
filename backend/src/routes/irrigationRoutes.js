const express = require('express');
const router = express.Router();
const { recentEvents, manualWater } = require('../controllers/irrigationController');
const { handleValidation, manualWaterRules } = require('../middleware/validation');

router.get('/', recentEvents);
router.post('/manual', manualWaterRules, handleValidation, manualWater);

module.exports = router;
