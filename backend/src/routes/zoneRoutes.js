const express = require('express');
const router = express.Router();
const { listZones, addZone, editZone } = require('../controllers/zoneController');

router.get('/', listZones);
router.post('/', addZone);
router.put('/:id', editZone);

module.exports = router;
