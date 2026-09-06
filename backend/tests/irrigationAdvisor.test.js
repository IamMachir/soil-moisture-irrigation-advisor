jest.mock('../src/models/zoneModel');
jest.mock('../src/models/irrigationModel');

const { getZoneById } = require('../src/models/zoneModel');
const { logIrrigationEvent } = require('../src/models/irrigationModel');
const { evaluateZone } = require('../src/utils/irrigationAdvisor');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('evaluateZone', () => {
  it('does not water a zone above its threshold', async () => {
    getZoneById.mockResolvedValue({ id: 1, moisture_threshold: 30 });

    const result = await evaluateZone({ zoneId: 1, moisturePercent: 35 });

    expect(result).toEqual({ watered: false, threshold: 30 });
    expect(logIrrigationEvent).not.toHaveBeenCalled();
  });

  it('waters a zone below its threshold and logs the event', async () => {
    getZoneById.mockResolvedValue({ id: 1, moisture_threshold: 30 });

    const result = await evaluateZone({ zoneId: 1, moisturePercent: 25 });

    expect(result).toEqual({ watered: true, threshold: 30 });
    expect(logIrrigationEvent).toHaveBeenCalledWith({
      zoneId: 1,
      triggeredBy: 'auto',
      moistureBefore: 25,
    });
  });

  it('respects a higher per-zone threshold, watering earlier than the 30% default', async () => {
    getZoneById.mockResolvedValue({ id: 2, moisture_threshold: 50 });

    const result = await evaluateZone({ zoneId: 2, moisturePercent: 45 });

    // 45% is above the old global default of 30%, but below this zone's
    // custom 50% threshold, so it should still trigger watering.
    expect(result).toEqual({ watered: true, threshold: 50 });
  });

  it('respects a lower per-zone threshold, not watering until moisture drops further', async () => {
    getZoneById.mockResolvedValue({ id: 3, moisture_threshold: 15 });

    const result = await evaluateZone({ zoneId: 3, moisturePercent: 20 });

    // 20% would trigger watering under the default 30% threshold, but this
    // zone's custom 15% threshold means it shouldn't water yet.
    expect(result).toEqual({ watered: false, threshold: 15 });
  });

  it('falls back to the default threshold if the zone cannot be found', async () => {
    getZoneById.mockResolvedValue(null);

    const result = await evaluateZone({ zoneId: 999, moisturePercent: 25 });

    expect(result.threshold).toBe(30);
    expect(result.watered).toBe(true);
  });
});
