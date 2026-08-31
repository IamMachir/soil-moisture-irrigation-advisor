const { getAllZones, createZone } = require('../models/zoneModel');

async function listZones(req, res) {
  try {
    const zones = await getAllZones();
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch zones', details: err.message });
  }
}

async function addZone(req, res) {
  try {
    const { name, locationNote, gridX, gridY } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = await createZone({ name, locationNote, gridX, gridY });
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create zone', details: err.message });
  }
}

module.exports = { listZones, addZone };
