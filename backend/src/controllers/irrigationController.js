const { getRecentEvents } = require('../models/irrigationModel');

async function recentEvents(req, res) {
  try {
    const events = await getRecentEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch irrigation events', details: err.message });
  }
}

module.exports = { recentEvents };
