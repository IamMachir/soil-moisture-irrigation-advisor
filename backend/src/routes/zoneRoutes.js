const express = require('express');
const router = express.Router();
const { listZones, addZone, editZone } = require('../controllers/zoneController');
const { handleValidation, zoneRules } = require('../middleware/validation');

router.get('/', listZones);
router.post('/', zoneRules, handleValidation, addZone);
router.put('/:id', zoneRules, handleValidation, editZone);

module.exports = router;
