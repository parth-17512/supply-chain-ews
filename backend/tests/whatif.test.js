const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Import the router directly — it has a local fallback when ML service is unreachable
const whatifRouter = require('../routes/api/whatif');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/whatif', whatifRouter);
  return app;
}

describe('POST /api/whatif', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  const basePayload = {
    portStatus: true,
    weatherSeverity: 0.3,
    strikeProbability: 0.1,
    congestionLevel: 0.4,
    region: 'Asia Pacific',
  };

  test('returns 200 with simulatedRiskScore in range 0–100', async () => {
    const res = await request(app).post('/api/whatif').send(basePayload);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('simulatedRiskScore');
    expect(res.body.simulatedRiskScore).toBeGreaterThanOrEqual(0);
    expect(res.body.simulatedRiskScore).toBeLessThanOrEqual(100);
  });

  test('response has all required fields', async () => {
    const res = await request(app).post('/api/whatif').send(basePayload);
    expect(res.body).toHaveProperty('confidence');
    expect(res.body).toHaveProperty('breakdown');
    expect(res.body).toHaveProperty('recommendation');
    expect(res.body).toHaveProperty('isSimulation', true);
  });

  test('closed port increases simulated risk vs open port', async () => {
    const openPort = await request(app).post('/api/whatif').send({ ...basePayload, portStatus: true, weatherSeverity: 0, strikeProbability: 0, congestionLevel: 0 });
    const closedPort = await request(app).post('/api/whatif').send({ ...basePayload, portStatus: false, weatherSeverity: 0, strikeProbability: 0, congestionLevel: 0 });
    // Closed port contributes +30 to risk, open port contributes 0
    expect(closedPort.body.simulatedRiskScore).toBeGreaterThan(openPort.body.simulatedRiskScore);
  });

  test('max all params yields high risk', async () => {
    const res = await request(app).post('/api/whatif').send({
      portStatus: false,
      weatherSeverity: 1.0,
      strikeProbability: 1.0,
      congestionLevel: 1.0,
    });
    expect(res.body.simulatedRiskScore).toBeGreaterThanOrEqual(50);
  });

  test('breakdown fields are numbers', async () => {
    const res = await request(app).post('/api/whatif').send(basePayload);
    const { breakdown } = res.body;
    expect(typeof breakdown.portClosure).toBe('number');
    expect(typeof breakdown.weatherImpact).toBe('number');
    expect(typeof breakdown.strikeRisk).toBe('number');
    expect(typeof breakdown.congestion).toBe('number');
  });

  test('recommendation string is one of the three expected values', async () => {
    const res = await request(app).post('/api/whatif').send(basePayload);
    const validRecs = [
      'HIGH RISK: Immediate rerouting recommended',
      'MODERATE RISK: Monitor closely, prepare contingency',
      'LOW RISK: Continue as planned',
    ];
    expect(validRecs).toContain(res.body.recommendation);
  });

  test('empty body returns a valid risk score (all defaults)', async () => {
    const res = await request(app).post('/api/whatif').send({});
    expect(res.statusCode).toBe(200);
    expect(res.body.simulatedRiskScore).toBeGreaterThanOrEqual(0);
  });
});
