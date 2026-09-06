const { getAllZones, getZoneById, createZone, updateZone, deleteZone } = require('../models/zoneModel');

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
    const { name, locationNote, gridX, gridY, moistureThreshold } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = await createZone({ name, locationNote, gridX, gridY, moistureThreshold });
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create zone', details: err.message });
  }
}

async function editZone(req, res) {
  try {
    const existing = await getZoneById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Zone not found' });

    const { name, locationNote, gridX, gridY, moistureThreshold } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    await updateZone(req.params.id, {
      name,
      locationNote,
      gridX: gridX ?? existing.grid_x,
      gridY: gridY ?? existing.grid_y,
      moistureThreshold: moistureThreshold ?? existing.moisture_threshold,
    });
    res.json({ id: Number(req.params.id), name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update zone', details: err.message });
  }
}

async function removeZone(req, res) {
  try {
    const existing = await getZoneById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Zone not found' });

    await deleteZone(req.params.id);
    res.json({ message: 'Zone deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete zone', details: err.message });
  }
}

module.exports = { listZones, addZone, editZone, removeZone };
