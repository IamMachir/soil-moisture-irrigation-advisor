require('dotenv').config();
const { logIrrigationEvent } = require('../models/irrigationModel');

const THRESHOLD = parseFloat(process.env.MOISTURE_THRESHOLD || '30');

/**
 * Decide whether a zone needs watering, and log an irrigation event if so.
 * This is the rule-based "advisor" — simple, explainable logic rather than ML,
 * which is appropriate for a low-cost campus-scale system.
 */
async function evaluateZone({ zoneId, moisturePercent }) {
  if (moisturePercent < THRESHOLD) {
    await logIrrigationEvent({ zoneId, triggeredBy: 'auto', moistureBefore: moisturePercent });
    return { watered: true, threshold: THRESHOLD };
  }
  return { watered: false, threshold: THRESHOLD };
}

module.exports = { evaluateZone, THRESHOLD };
