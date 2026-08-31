const db = require('../config/db');

async function addReading({ zoneId, moisturePercent }) {
  const [result] = await db.query(
    'INSERT INTO sensor_readings (zone_id, moisture_percent) VALUES (?, ?)',
    [zoneId, moisturePercent]
  );
  return result.insertId;
}

// Latest reading for every zone (used by the dashboard's live status cards)
async function getLatestReadings() {
  const [rows] = await db.query(`
    SELECT sr.zone_id, sr.moisture_percent, sr.recorded_at
    FROM sensor_readings sr
    INNER JOIN (
      SELECT zone_id, MAX(recorded_at) AS max_time
      FROM sensor_readings
      GROUP BY zone_id
    ) latest ON sr.zone_id = latest.zone_id AND sr.recorded_at = latest.max_time
  `);
  return rows;
}

// Reading history for a single zone (used for the chart panel)
async function getHistoryForZone(zoneId, limit = 50) {
  const [rows] = await db.query(
    'SELECT moisture_percent, recorded_at FROM sensor_readings WHERE zone_id = ? ORDER BY recorded_at DESC LIMIT ?',
    [zoneId, limit]
  );
  return rows.reverse();
}

module.exports = { addReading, getLatestReadings, getHistoryForZone };
