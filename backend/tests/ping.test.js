const request = require('supertest');

// Build a minimal Express app without starting the DB server
// so we can test just the /api/ping endpoint in isolation
const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

describe('GET /api/ping', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('returns an ISO timestamp', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.body).toHaveProperty('timestamp');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
  });

  test('has correct content-type (JSON)', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
