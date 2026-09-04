const express = require('express');
const router = express.Router();
const { submitReading, latestStatus, zoneHistory } = require('../controllers/readingController');
const { handleValidation, readingRules } = require('../middleware/validation');

router.post('/', readingRules, handleValidation, submitReading);
router.get('/latest', latestStatus);
router.get('/history/:zoneId', zoneHistory);

module.exports = router;
