/**
 * Browser-based irrigation simulation engine.
 *
 * Replicates the backend's sensorSimulator.js + sensorCalibration.js +
 * irrigationAdvisor.js logic, but runs entirely in the browser with no
 * backend or database. This models the same measurement chain:
 *
 *   raw ADC drift (physics) -> sensor noise -> calibration to % ->
 *   rule-based advisor (per-zone threshold + cooldown) ->
 *   apply watering effect only if advisor says watered: true
 */

const ADC_MAX = 4095;

const DEFAULT_CALIBRATION = { wetRaw: 1200, dryRaw: 3000 };

export function rawToPercent(rawValue, calibration = DEFAULT_CALIBRATION) {
  const { wetRaw, dryRaw } = calibration;
  const clampedRaw = Math.max(Math.min(rawValue, dryRaw), wetRaw);
  const percent = ((dryRaw - clampedRaw) / (dryRaw - wetRaw)) * 100;
  return Math.max(0, Math.min(100, percent));
}

function randCalibration() {
  const wetRaw = 1100 + Math.round(Math.random() * 200);
  const dryRaw = 2850 + Math.round(Math.random() * 300);
  return { wetRaw, dryRaw };
}

function adcNoise() {
  return (Math.random() - 0.5) * 24;
}

/**
 * Per-zone simulation state. Each zone has its own calibration (simulating
 * manufacturing variance), drying rate (sunnier plots dry faster), and a
 * moisture-threshold that triggers watering.
 */
export function createZone({ id, name, locationNote, gridX, gridY, threshold = 30 }) {
  const calibration = randCalibration();
  const startFraction = 0.15 + Math.random() * 0.15;
  return {
    id,
    name,
    locationNote: locationNote || '',
    gridX: gridX ?? 0,
    gridY: gridY ?? 0,
    moistureThreshold: threshold,
    calibration,
    rawValue: calibration.wetRaw + (calibration.dryRaw - calibration.wetRaw) * startFraction,
    dryingRate: 0.7 + Math.random() * 0.8,
    currentMoisture: 0,
    lastEventTime: null,
    events: [],
    history: [],
  };
}

function timeOfDayFactor(simulatedDayMinutes, now = Date.now()) {
  const cycleMs = simulatedDayMinutes * 60 * 1000;
  const phase = (now % cycleMs) / cycleMs;
  const sunAngle = Math.sin(phase * Math.PI * 2 - Math.PI / 2);
  return 1 + sunAngle * 0.5;
}

function driftZone(zone, simulatedDayMinutes) {
  const { wetRaw, dryRaw } = zone.calibration;
  const range = dryRaw - wetRaw;
  const baseDriftFraction = 0.01 + Math.random() * 0.02;
  const drift = range * baseDriftFraction * zone.dryingRate * timeOfDayFactor(simulatedDayMinutes);
  zone.rawValue = Math.min(dryRaw, zone.rawValue + drift);
}

function applyWateringEffect(zone) {
  const { wetRaw, dryRaw } = zone.calibration;
  const current = zone.rawValue;
  const recoveryFraction = 0.6 + Math.random() * 0.25;
  zone.rawValue = current - (current - wetRaw) * recoveryFraction;
  zone.rawValue = Math.max(wetRaw, Math.min(dryRaw, zone.rawValue));
}

/**
 * The rule-based advisor — same logic as backend irrigationAdvisor.js.
 * Returns watered: true only if moisture is below the zone's threshold AND
 * the cooldown window has passed since the last watering event.
 */
function evaluateAdvisor(zone, moisturePercent, cooldownMinutes) {
  const threshold = zone.moistureThreshold;

  if (moisturePercent >= threshold) {
    return { watered: false, threshold };
  }

  if (zone.lastEventTime) {
    const minutesSince = (Date.now() - zone.lastEventTime) / 60000;
    if (minutesSince < cooldownMinutes) {
      return { watered: false, threshold, withinCooldown: true };
    }
  }

  zone.lastEventTime = Date.now();
  zone.events.unshift({
    id: zone.events.length + 1,
    zoneId: zone.id,
    zoneName: zone.name,
    triggeredBy: 'auto',
    moistureBefore: moisturePercent,
    timestamp: Date.now(),
  });
  if (zone.events.length > 50) zone.events.pop();
  return { watered: true, threshold };
}

/**
 * Advance the simulation by one tick for all zones.
 * Returns updated zone references (mutated in place).
 */
export function tickSimulation(zones, { cooldownMinutes = 10, simulatedDayMinutes = 10 } = {}) {
  const tickTime = Date.now();
  const results = [];

  for (const zone of zones) {
    driftZone(zone, simulatedDayMinutes);
    const measuredRaw = Math.max(0, Math.min(ADC_MAX, zone.rawValue + adcNoise()));
    const moisturePercent = Number(rawToPercent(measuredRaw, zone.calibration).toFixed(2));
    zone.currentMoisture = moisturePercent;

    zone.history.push({ timestamp: tickTime, moisture: moisturePercent });
    if (zone.history.length > 60) zone.history.shift();

    const advisorResult = evaluateAdvisor(zone, moisturePercent, cooldownMinutes);

    if (advisorResult.watered) {
      applyWateringEffect(zone);
    }

    results.push({ zoneId: zone.id, moisturePercent, advisorResult });
  }

  return results;
}

/**
 * Manually trigger watering for a zone (the dashboard's "Water now" button).
 */
export function manualWater(zone) {
  const moistureBefore = zone.currentMoisture;
  applyWateringEffect(zone);
  const measuredRaw = Math.max(0, Math.min(ADC_MAX, zone.rawValue + adcNoise()));
  zone.currentMoisture = Number(rawToPercent(measuredRaw, zone.calibration).toFixed(2));
  zone.lastEventTime = Date.now();
  zone.events.unshift({
    id: zone.events.length + 1,
    zoneId: zone.id,
    zoneName: zone.name,
    triggeredBy: 'manual',
    moistureBefore,
    timestamp: Date.now(),
  });
  if (zone.events.length > 50) zone.events.pop();
}

/**
 * Create a set of default starter zones matching the backend's seed data.
 */
export function createDefaultZones() {
  return [
    createZone({ id: 1, name: 'Zone A — Tomato bed', locationNote: 'South greenhouse', gridX: 0, gridY: 0, threshold: 30 }),
    createZone({ id: 2, name: 'Zone B — Herb garden', locationNote: 'Near entrance', gridX: 1, gridY: 0, threshold: 35 }),
    createZone({ id: 3, name: 'Zone C — Lawn strip', locationNote: 'East wall', gridX: 0, gridY: 1, threshold: 25 }),
    createZone({ id: 4, name: 'Zone D — Pepper plot', locationNote: 'North corner', gridX: 1, gridY: 1, threshold: 30 }),
  ];
}
