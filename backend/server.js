require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const connectDB = require('./config/db');

// Data fetcher services
const { fetchAndStoreNews }     = require('./services/newsFetcher');
const { fetchAllPortWeather }   = require('./services/weatherFetcher');
const { fetchAllPortCongestion }= require('./services/portCongestionFetcher');
const { fetchGdeltAlerts }      = require('./services/gdeltFetcher');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(require('./middleware/latencyTracker'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/dashboard',     require('./routes/api/dashboard'));
app.use('/api/alerts',        require('./routes/api/alerts'));
app.use('/api/shipments',     require('./routes/api/shipments'));
app.use('/api/whatif',        require('./routes/api/whatif'));
app.use('/api/health',        require('./routes/api/health'));
app.use('/api/notifications', require('./routes/api/notifications'));
app.use('/api/news',          require('./routes/api/news'));
app.use('/api/model',         require('./routes/api/model'));

// Health check
app.get('/api/ping', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Live data cache (in-memory, refreshed by cron) ───────────────────────────
let liveWeather    = null;
let liveCongestion = null;

// ── Live data endpoints ───────────────────────────────────────────────────────

// GET /api/live/weather — current weather at all major ports
app.get('/api/live/weather', async (req, res) => {
  if (!liveWeather) liveWeather = await fetchAllPortWeather();
  res.json(liveWeather);
});

// GET /api/live/congestion — port congestion from IMF PortWatch
app.get('/api/live/congestion', async (req, res) => {
  if (!liveCongestion) liveCongestion = await fetchAllPortCongestion();
  res.json(liveCongestion);
});

// Manual trigger endpoints
app.post('/api/news/fetch', async (req, res) => {
  const result = await fetchAndStoreNews();
  if (result.reason === 'no_api_key') {
    return res.status(400).json({
      error: 'NEWS_API_KEY is not configured in .env',
      hint: 'Sign up free at https://newsapi.org and add NEWS_API_KEY=your_key to .env',
    });
  }
  res.json({ message: 'News fetch complete', ...result });
});

app.post('/api/live/fetch-weather', async (req, res) => {
  liveWeather = await fetchAllPortWeather();
  res.json({ message: 'Weather updated', ...liveWeather });
});

app.post('/api/live/fetch-congestion', async (req, res) => {
  liveCongestion = await fetchAllPortCongestion();
  res.json({ message: 'Congestion updated', ...liveCongestion });
});

app.post('/api/live/fetch-alerts', async (req, res) => {
  const result = await fetchGdeltAlerts();
  res.json({ message: 'GDELT alerts processed', ...result });
});

// ── Connect DB then start all cron jobs ──────────────────────────────────────
connectDB().then(async () => {

  // ── Startup: fetch everything immediately ─────────────────────────────────
  console.log('\n🚀 Running startup data fetches...');

  // Weather and port congestion — fully free, always run
  fetchAllPortWeather().then(r => { liveWeather = r; });
  fetchAllPortCongestion().then(r => { liveCongestion = r; });

  // GDELT geopolitical alerts — free, run on startup
  fetchGdeltAlerts();

  // NewsAPI — only if key is set
  if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY.trim()) {
    console.log('🔑 NEWS_API_KEY detected — fetching live news...');
    fetchAndStoreNews().then(r => console.log('📰 News startup fetch:', r));
  } else {
    console.log('ℹ️  NEWS_API_KEY not set — using seeded news. Add it to .env for live news.');
  }

  // ── Cron: News every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ [CRON] NewsAPI fetch...');
    const r = await fetchAndStoreNews();
    console.log('⏰ [CRON] News:', r);
  });

  // ── Cron: Weather every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('⏰ [CRON] Weather fetch...');
    liveWeather = await fetchAllPortWeather();
  });

  // ── Cron: Port congestion every 6 hours (PortWatch updates weekly, no need to hammer it)
  cron.schedule('30 */6 * * *', async () => {
    console.log('⏰ [CRON] Port congestion fetch...');
    liveCongestion = await fetchAllPortCongestion();
  });

  // ── Cron: GDELT geopolitical alerts every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('⏰ [CRON] GDELT alert fetch...');
    await fetchGdeltAlerts();
  });

}).catch(err => console.error('❌ DB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend server running on port ${PORT}`));

module.exports = app;
