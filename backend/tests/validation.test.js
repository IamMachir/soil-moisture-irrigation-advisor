const express = require('express');
const request = require('supertest');
const { handleValidation, readingRules, zoneRules, manualWaterRules } = require('../src/middleware/validation');

function buildApp(rules) {
  const app = express();
  app.use(express.json());
  app.post('/test', rules, handleValidation, (req, res) => res.json({ ok: true }));
  return app;
}

describe('readingRules', () => {
  const app = buildApp(readingRules);

  it('rejects an out-of-range moisture value', async () => {
    const res = await request(app).post('/test').send({ zoneId: 1, moisturePercent: 150 });
    expect(res.status).toBe(400);
    expect(res.body.details[0].msg).toMatch(/between 0 and 100/);
  });

  it('rejects a missing zoneId', async () => {
    const res = await request(app).post('/test').send({ moisturePercent: 45 });
    expect(res.status).toBe(400);
  });

  it('accepts a valid reading', async () => {
    const res = await request(app).post('/test').send({ zoneId: 1, moisturePercent: 45.5 });
    expect(res.status).toBe(200);
  });
});

describe('zoneRules', () => {
  const app = buildApp(zoneRules);

  it('rejects an empty zone name', async () => {
    const res = await request(app).post('/test').send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range moistureThreshold', async () => {
    const res = await request(app).post('/test').send({ name: 'Zone A', moistureThreshold: 200 });
    expect(res.status).toBe(400);
  });

  it('accepts a valid zone payload', async () => {
    const res = await request(app)
      .post('/test')
      .send({ name: 'Zone A', gridX: 1, gridY: 2, moistureThreshold: 40 });
    expect(res.status).toBe(200);
  });
});

describe('manualWaterRules', () => {
  const app = buildApp(manualWaterRules);

  it('rejects a non-integer zoneId', async () => {
    const res = await request(app).post('/test').send({ zoneId: 'abc' });
    expect(res.status).toBe(400);
  });

  it('accepts a valid zoneId', async () => {
    const res = await request(app).post('/test').send({ zoneId: 3 });
    expect(res.status).toBe(200);
  });
});
