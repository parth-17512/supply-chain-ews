/**
 * gdeltFetcher.js — Geopolitical Event Alerts from GDELT Project
 *
 * GDELT is 100% free, no API key needed.
 * Monitors global geopolitical events (conflicts, sanctions, disasters)
 * that affect supply chains and creates Alert documents in MongoDB.
 * https://gdeltproject.org/
 *
 * Uses the GDELT DOC 2.0 API to search for supply-chain relevant events.
 */

const Alert = require('../models/Alert');

const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc';

// Supply-chain focused GDELT search themes
const SEARCHES = [
  { query: '"supply chain" disruption OR strike OR port',  type: 'logistics' },
  { query: '"Red Sea" OR "Suez Canal" ship OR cargo',      type: 'geopolitical' },
  { query: 'port strike OR "port closure" OR "port congestion"', type: 'labor' },
  { query: 'trade sanctions embargo shipping',             type: 'geopolitical' },
  { query: 'cyclone OR hurricane OR "port flood" shipping', type: 'weather'    },
];

// Tone → severity mapping (GDELT tone is positive=positive, negative=negative)
function toneToSeverity(tone) {
  if (tone <= -5) return 'critical';
  if (tone <= -2) return 'high';
  return 'moderate';
}

let searchIndex = 0;

async function fetchGdeltAlerts() {
  const search = SEARCHES[searchIndex % SEARCHES.length];
  searchIndex++;

  const params = new URLSearchParams({
    query:      search.query,
    mode:       'artlist',
    maxrecords: '10',
    format:     'json',
    timespan:   '24h',  // only last 24 hours
    sort:       'ToneDesc',  // most negative (alarming) first
  });

  let articles;
  try {
    const res = await fetch(`${GDELT_API}?${params}`, {
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`GDELT API ${res.status}`);
    const data = await res.json();
    articles = data.articles || [];
  } catch (err) {
    console.warn('⚠️  GDELT fetch failed:', err.message);
    return { created: 0, reason: 'network_error' };
  }

  if (!articles.length) return { created: 0, reason: 'no_results' };

  // Filter for strongly negative tone (genuine threats, not mild news)
  const alarming = articles.filter(a => (a.tone ?? 0) < -2);
  if (!alarming.length) return { created: 0, reason: 'no_alarming_events' };

  let created = 0;

  for (const article of alarming.slice(0, 3)) {
    const title    = article.title || 'Geopolitical Event Detected';
    const severity = toneToSeverity(article.tone ?? 0);

    // De-duplicate by title prefix
    const existing = await Alert.findOne({ title: { $regex: title.slice(0, 40), $options: 'i' } });
    if (existing) continue;

    await Alert.create({
      alertId:      `GDELT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      severity,
      type:         search.type,
      title:        title.slice(0, 120),
      description:  `Detected via GDELT real-time news monitoring. Tone score: ${article.tone?.toFixed(1) ?? 'N/A'}. Source: ${article.domain || 'Unknown'}.`,
      affectedRoute: { from: 'Global', to: 'Global', region: 'Global' },
      riskScore:    severity === 'critical' ? 88 : severity === 'high' ? 72 : 55,
      shipmentIds:  [],
      mitigation:   {
        suggestion: 'Monitor closely. Review affected shipment routes and prepare contingency plans.',
        alternativeRoutes: [],
        estimatedCostImpact: 0,
        status: 'pending',
      },
      isActive:     true,
      sourceUrl:    article.url || '',
    });
    created++;
  }

  console.log(`🌍 GDELT [${search.type}]: ${created} new alerts created from ${articles.length} articles`);
  return { created, search: search.query };
}

module.exports = { fetchGdeltAlerts };
