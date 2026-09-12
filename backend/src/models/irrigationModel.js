const db = require('../config/db');

async function logIrrigationEvent({ zoneId, triggeredBy = 'auto', moistureBefore }) {
  const [result] = await db.query(
    'INSERT INTO irrigation_events (zone_id, triggered_by, moisture_before) VALUES (?, ?, ?)',
    [zoneId, triggeredBy, moistureBefore]
  );
  return result.insertId;
}

async function getRecentEvents(limit = 20) {
  const [rows] = await db.query(
    `SELECT ie.*, gz.name AS zone_name
     FROM irrigation_events ie
     JOIN garden_zones gz ON ie.zone_id = gz.id
     ORDER BY ie.started_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

// Used by the advisor's cooldown check: has this zone been watered recently,
// regardless of trigger type? Prevents re-triggering a physical pump every
// few seconds while a zone sits below threshold — a real relay/pump needs
// time to run and for water to absorb before the next decision is useful.
async function getMostRecentEventForZone(zoneId) {
  const [rows] = await db.query(
    'SELECT * FROM irrigation_events WHERE zone_id = ? ORDER BY started_at DESC LIMIT 1',
    [zoneId]
  );
  return rows[0] || null;
}

module.exports = { logIrrigationEvent, getRecentEvents, getMostRecentEventForZone };
