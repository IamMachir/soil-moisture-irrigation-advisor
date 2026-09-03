const { getRecentEvents, logIrrigationEvent } = require('../models/irrigationModel');
const { getLatestReadings } = require('../models/readingModel');

async function recentEvents(req, res) {
  try {
    const events = await getRecentEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch irrigation events', details: err.message });
  }
}

async function manualWater(req, res) {
  try {
    const { zoneId } = req.body;
    if (!zoneId) return res.status(400).json({ error: 'zoneId is required' });

    // Look up the most recent moisture reading for this zone, if any, to log alongside the event
    const latest = await getLatestReadings();
    const zoneReading = latest.find((r) => r.zone_id === Number(zoneId));

    const id = await logIrrigationEvent({
      zoneId,
      triggeredBy: 'manual',
      moistureBefore: zoneReading ? zoneReading.moisture_percent : null,
    });

    res.status(201).json({ id, message: 'Manual watering logged' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log manual watering', details: err.message });
  }
}

module.exports = { recentEvents, manualWater };
