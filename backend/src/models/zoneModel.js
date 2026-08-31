const db = require('../config/db');

async function getAllZones() {
  const [rows] = await db.query('SELECT * FROM garden_zones ORDER BY id ASC');
  return rows;
}

async function getZoneById(id) {
  const [rows] = await db.query('SELECT * FROM garden_zones WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createZone({ name, locationNote, gridX, gridY }) {
  const [result] = await db.query(
    'INSERT INTO garden_zones (name, location_note, grid_x, grid_y) VALUES (?, ?, ?, ?)',
    [name, locationNote, gridX || 0, gridY || 0]
  );
  return result.insertId;
}

module.exports = { getAllZones, getZoneById, createZone };
