const express = require('express');
const router = express.Router();
const { submitReading, latestStatus, zoneHistory } = require('../controllers/readingController');

router.post('/', submitReading);
router.get('/latest', latestStatus);
router.get('/history/:zoneId', zoneHistory);

module.exports = router;
