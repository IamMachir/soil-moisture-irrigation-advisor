const express = require('express');
const router = express.Router();
const { listZones, addZone } = require('../controllers/zoneController');

router.get('/', listZones);
router.post('/', addZone);

module.exports = router;
