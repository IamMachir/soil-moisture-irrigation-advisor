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

module.exports = { logIrrigationEvent, getRecentEvents };
