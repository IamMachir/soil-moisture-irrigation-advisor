const db = require('../config/db');

async function getAllZones() {
  const [rows] = await db.query('SELECT * FROM garden_zones ORDER BY id ASC');
  return rows;
}

async function getZoneById(id) {
  const [rows] = await db.query('SELECT * FROM garden_zones WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createZone({ name, locationNote, gridX, gridY, moistureThreshold }) {
  const [result] = await db.query(
    'INSERT INTO garden_zones (name, location_note, grid_x, grid_y, moisture_threshold) VALUES (?, ?, ?, ?, ?)',
    [name, locationNote, gridX || 0, gridY || 0, moistureThreshold ?? 30]
  );
  return result.insertId;
}

async function updateZone(id, { name, locationNote, gridX, gridY, moistureThreshold }) {
  await db.query(
    'UPDATE garden_zones SET name = ?, location_note = ?, grid_x = ?, grid_y = ?, moisture_threshold = ? WHERE id = ?',
    [name, locationNote, gridX, gridY, moistureThreshold, id]
  );
}

module.exports = { getAllZones, getZoneById, createZone, updateZone };
