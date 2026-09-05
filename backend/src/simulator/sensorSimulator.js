/**
 * Simulated sensor pipeline.
 *
 * Stands in for real soil moisture sensors (e.g. capacitive sensors on an
 * ESP32) until hardware is wired up. Each zone's moisture value decays
 * gradually over time (simulating soil drying out) and jumps back up when
 * the irrigation advisor decides to "water" it — so the dashboard and 3D
 * scene have realistic, changing data to visualize.
 *
 * Drying isn't uniform: each zone gets its own drying-rate multiplier
 * (e.g. a sunnier plot dries faster than a shaded one), and drying speeds
 * up during simulated "daytime" hours to mimic real evaporation patterns.
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

// Each simulated "day" compresses into this many minutes, purely for demo purposes,
// so day/night drying variation is visible without waiting for a real 24h cycle.
const SIMULATED_DAY_MINUTES = parseInt(process.env.SIMULATOR_DAY_MINUTES || '10', 10);

// In-memory moisture state per zone (zone IDs assumed to start at 1, matching the seed data)
const zoneState = {};
const zoneDryingRate = {}; // each zone dries at a slightly different baseline rate
for (let i = 1; i <= ZONE_COUNT; i++) {
  zoneState[i] = 60 + Math.random() * 20; // start reasonably moist
  zoneDryingRate[i] = 0.7 + Math.random() * 0.8; // 0.7x - 1.5x baseline drying speed
}

// Returns a 0.5–1.5 multiplier simulating stronger evaporation at "midday"
// and slower drying at simulated "night", based on wall-clock time compressed
// into SIMULATED_DAY_MINUTES-long cycles.
function timeOfDayFactor() {
  const cycleMs = SIMULATED_DAY_MINUTES * 60 * 1000;
  const phase = (Date.now() % cycleMs) / cycleMs; // 0..1 across the simulated day
  const sunAngle = Math.sin(phase * Math.PI * 2 - Math.PI / 2); // -1 (night) to 1 (midday)
  return 1 + sunAngle * 0.5; // ranges 0.5x (night) to 1.5x (midday)
}

function stepZone(moisture, zoneId) {
  const baseDry = Math.random() * 2 + 1; // 1-3% base loss per tick
  const dry = baseDry * zoneDryingRate[zoneId] * timeOfDayFactor();
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
    zoneState[zoneId] = stepZone(zoneState[zoneId], zoneId);
    const moisturePercent = Number(zoneState[zoneId].toFixed(2));

    try {
      await axios.post(API_URL, { zoneId: Number(zoneId), moisturePercent });
      console.log(`Zone ${zoneId}: ${moisturePercent}%`);
    } catch (err) {
      console.error(`Failed to post reading for zone ${zoneId}:`, err.message);
    }
  }
}

console.log(`Starting sensor simulator: ${ZONE_COUNT} zones, every ${INTERVAL_MS}ms, simulated day = ${SIMULATED_DAY_MINUTES}min`);
setInterval(tick, INTERVAL_MS);
tick();
