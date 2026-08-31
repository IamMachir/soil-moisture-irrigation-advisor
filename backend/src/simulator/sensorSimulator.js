/**
 * Simulated sensor pipeline.
 *
 * Stands in for real soil moisture sensors (e.g. capacitive sensors on an
 * ESP32) until hardware is wired up. Each zone's moisture value decays
 * gradually over time (simulating soil drying out) and jumps back up when
 * the irrigation advisor decides to "water" it — so the dashboard and 3D
 * scene have realistic, changing data to visualize.
 *
 * Once real sensors exist, this file can be swapped for an MQTT/HTTP
 * listener that receives real readings — the rest of the pipeline
 * (POST /api/readings -> advisor -> DB) does not need to change.
 */
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.SIMULATOR_API_URL || 'http://localhost:5001/api/readings';
const ZONE_COUNT = parseInt(process.env.SIMULATOR_ZONE_COUNT || '4', 10);
const INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || '5000', 10);

// In-memory moisture state per zone (zone IDs assumed to start at 1, matching the seed data)
const zoneState = {};
for (let i = 1; i <= ZONE_COUNT; i++) {
  zoneState[i] = 60 + Math.random() * 20; // start reasonably moist
}

function stepZone(moisture) {
  // Natural drying: lose 1-3% per tick
  const dry = Math.random() * 2 + 1;
  let next = moisture - dry;

  // If it drops below the watering threshold, simulate the advisor's
  // irrigation kicking in and bumping moisture back up
  if (next < 30) {
    next = 65 + Math.random() * 10;
  }

  return Math.max(0, Math.min(100, next));
}

async function tick() {
  for (const zoneId of Object.keys(zoneState)) {
    zoneState[zoneId] = stepZone(zoneState[zoneId]);
    const moisturePercent = Number(zoneState[zoneId].toFixed(2));

    try {
      await axios.post(API_URL, { zoneId: Number(zoneId), moisturePercent });
      console.log(`Zone ${zoneId}: ${moisturePercent}%`);
    } catch (err) {
      console.error(`Failed to post reading for zone ${zoneId}:`, err.message);
    }
  }
}

console.log(`Starting sensor simulator: ${ZONE_COUNT} zones, every ${INTERVAL_MS}ms`);
setInterval(tick, INTERVAL_MS);
tick();
