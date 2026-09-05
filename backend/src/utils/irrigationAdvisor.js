require('dotenv').config();
const { logIrrigationEvent } = require('../models/irrigationModel');
const { getZoneById } = require('../models/zoneModel');

// Fallback used only if a zone somehow has no threshold set (shouldn't happen
// since the schema defaults new zones to 30%, but kept as a safety net).
const DEFAULT_THRESHOLD = parseFloat(process.env.MOISTURE_THRESHOLD || '30');

/**
 * Decide whether a zone needs watering, and log an irrigation event if so.
 * Each zone can have its own configurable moisture_threshold (e.g. thirstier
 * plants might want a higher threshold), rather than one global setting.
 * This is the rule-based "advisor" — simple, explainable logic rather than
 * ML, which is appropriate for a low-cost campus-scale system.
 */
async function evaluateZone({ zoneId, moisturePercent }) {
  const zone = await getZoneById(zoneId);
  const threshold = zone ? Number(zone.moisture_threshold) : DEFAULT_THRESHOLD;

  if (moisturePercent < threshold) {
    await logIrrigationEvent({ zoneId, triggeredBy: 'auto', moistureBefore: moisturePercent });
    return { watered: true, threshold };
  }
  return { watered: false, threshold };
}

module.exports = { evaluateZone, DEFAULT_THRESHOLD };
