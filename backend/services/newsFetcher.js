/**
 * newsFetcher.js — Live Supply Chain News from NewsAPI.org
 *
 * Fetches real-world supply chain / trade / geopolitical news every hour,
 * scores each headline via the ML sentiment service (VADER + custom lexicon),
 * and persists new (de-duplicated) articles to MongoDB.
 *
 * Requires: NEWS_API_KEY in .env (free at newsapi.org)
 * Optional: ML_SERVICE_URL in .env (falls back to keyword heuristic if down)
 */

const NewsArticle = require('../models/NewsArticle');

const NEWS_API_KEY    = process.env.NEWS_API_KEY;
const ML_SERVICE_URL  = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Supply-chain focused search queries (round-robined each fetch) ────────────
const SEARCH_QUERIES = [
  'supply chain disruption',
  'port congestion shipping',
  'trade sanctions embargo',
  'shipping delay logistics',
  'port strike workers',
  'Suez Canal Red Sea shipping',
  'container shortage freight',
  'trade tariffs export import',
];

// ── Category classifier (keyword → category) ─────────────────────────────────
function classifyCategory(text) {
  const t = text.toLowerCase();
  if (/strike|labor|workers|union|protest/.test(t))           return 'labor';
  if (/sanction|embargo|tariff|geopolit|war|military/.test(t)) return 'geopolitical';
  if (/cyclone|hurricane|earthquake|flood|drought|storm/.test(t)) return 'weather';
  if (/trade|export|import|wto|free trade/.test(t))           return 'trade';
  if (/shipping|freight|container|port|logistics|congestion/.test(t)) return 'logistics';
  if (/economic|gdp|recession|growth|inflation/.test(t))       return 'economic';
  return 'other';
}

// ── Region extractor (headline text → region string) ─────────────────────────
const REGION_MAP = {
  'Shanghai': 'Asia Pacific',  'China': 'Asia Pacific',      'Singapore': 'Asia Pacific',
  'Busan': 'Asia Pacific',     'Japan': 'Asia Pacific',       'Korea': 'Asia Pacific',
  'India': 'South Asia',       'Mumbai': 'South Asia',        'Sri Lanka': 'South Asia',
  'Rotterdam': 'Europe',       'Hamburg': 'Europe',           'Piraeus': 'Europe',
  'EU': 'Europe',              'Europe': 'Europe',
  'Suez': 'Middle East',       'Dubai': 'Middle East',        'Red Sea': 'Middle East',
  'Los Angeles': 'North America', 'US': 'North America',      'Canada': 'North America',
  'Santos': 'South America',   'Brazil': 'South America',
  'Mombasa': 'Africa',         'Africa': 'Africa',
  'Panama': 'Central America',
};

function extractRegion(text) {
  for (const [keyword, region] of Object.entries(REGION_MAP)) {
    if (text.includes(keyword)) return region;
  }
  return 'Global';
}

// ── Keyword-based sentiment fallback ─────────────────────────────────────────
const NEG_WORDS = ['disruption','strike','blockage','congestion','delay','shortage',
  'earthquake','cyclone','hurricane','tsunami','flood','sanctions','embargo',
  'tariff','closure','bankruptcy','cyberattack','conflict','war'];
const POS_WORDS = ['expansion','efficient','record throughput','recovery',
  'stabilized','growth','reopens','surplus','agreement','deal'];

function keywordSentiment(text) {
  const t = text.toLowerCase();
  const neg = NEG_WORDS.filter(w => t.includes(w)).length;
  const pos = POS_WORDS.filter(w => t.includes(w)).length;
  if (neg > pos) return { score: Math.min(-0.1, -(neg * 0.25)), label: 'negative', confidence: Math.min(0.9, neg * 0.2) };
  if (pos > neg) return { score: Math.max(0.1, pos * 0.25), label: 'positive', confidence: Math.min(0.9, pos * 0.2) };
  return { score: 0, label: 'neutral', confidence: 0.3 };
}

// ── Score a batch of texts via ML service ─────────────────────────────────────
async function scoreSentimentBatch(texts) {
  try {
    const res = await fetch(`${ML_SERVICE_URL}/sentiment/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      return { results: data.results, mlEnriched: true };
    }
  } catch {
    // ML service down — fall through to keyword fallback
  }
  return { results: texts.map(t => keywordSentiment(t)), mlEnriched: false };
}

// ── Main fetch & persist function ─────────────────────────────────────────────
let queryIndex = 0;

async function fetchAndStoreNews() {
  if (!NEWS_API_KEY) {
    console.warn('⚠️  NEWS_API_KEY not set — skipping NewsAPI fetch. Add it to .env to enable live news.');
    return { fetched: 0, saved: 0, reason: 'no_api_key' };
  }

  // Round-robin through queries
  const query = SEARCH_QUERIES[queryIndex % SEARCH_QUERIES.length];
  queryIndex++;

  const url = `https://newsapi.org/v2/everything?` + new URLSearchParams({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: '20',
    apiKey: NEWS_API_KEY,
  });

  let articles;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`❌ NewsAPI error: ${err.message || res.statusText}`);
      return { fetched: 0, saved: 0, reason: err.message || 'api_error' };
    }
    const data = await res.json();
    articles = data.articles || [];
  } catch (err) {
    console.error('❌ NewsAPI fetch failed:', err.message);
    return { fetched: 0, saved: 0, reason: 'network_error' };
  }

  if (!articles.length) return { fetched: 0, saved: 0, reason: 'no_results' };

  // De-duplicate: skip headlines already in DB
  const headlines = articles.map(a => a.title).filter(Boolean);
  const existing  = await NewsArticle.find({ headline: { $in: headlines } }).select('headline').lean();
  const existingSet = new Set(existing.map(e => e.headline));
  const newArticles = articles.filter(a => a.title && !existingSet.has(a.title));

  if (!newArticles.length) {
    console.log(`📰 NewsAPI [${query}]: 0 new (${articles.length} already stored)`);
    return { fetched: articles.length, saved: 0, reason: 'all_duplicate' };
  }

  // Score sentiment for new headlines
  const texts = newArticles.map(a => `${a.title}. ${a.description || ''}`);
  const { results: sentimentResults, mlEnriched } = await scoreSentimentBatch(texts);

  // Build documents to insert
  const docs = newArticles.map((a, i) => {
    const s = sentimentResults[i];
    return {
      headline: a.title,
      source:   a.source?.name || 'NewsAPI',
      url:      a.url || '',
      publishedAt: new Date(a.publishedAt || Date.now()),
      sentiment: {
        score:      typeof s.score  === 'number' ? s.score  : s.compound || 0,
        label:      s.label || 'neutral',
        confidence: typeof s.confidence === 'number' ? s.confidence : Math.abs(s.score || 0),
      },
      entities:      [],                            // entity extraction handled by ML /sentiment endpoint
      category:      classifyCategory(`${a.title} ${a.description || ''}`),
      relevanceScore: 0.7,                          // NewsAPI search results are already relevant
      region:        extractRegion(`${a.title} ${a.description || ''}`),
    };
  });

  await NewsArticle.insertMany(docs, { ordered: false }).catch(() => {}); // ordered:false skips any remaining duplicates

  console.log(`📰 NewsAPI [${query}]: ${docs.length} new articles saved (ML: ${mlEnriched ? '✅' : '⚠️ fallback'})`);
  return { fetched: articles.length, saved: docs.length, mlEnriched, query };
}

module.exports = { fetchAndStoreNews };
