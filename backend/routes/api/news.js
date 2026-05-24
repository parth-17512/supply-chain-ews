const express = require('express');
const router = express.Router();
const NewsArticle = require('../../models/NewsArticle');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// GET /api/news — sentiment feed with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, sentiment, limit: queryLimit } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (sentiment) filter['sentiment.label'] = sentiment;

    const articles = await NewsArticle.find(filter)
      .sort({ publishedAt: -1 })
      .limit(parseInt(queryLimit) || 30);

    res.json({ count: articles.length, articles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

/**
 * POST /api/news/score
 * Accepts an array of article objects ({ id, text }) and returns
 * ML-generated sentiment scores for each. Falls back to a simple
 * keyword heuristic if the ML service is unavailable.
 *
 * Body: { articles: [{ id: string, text: string }] }
 */
router.post('/score', async (req, res) => {
  try {
    const { articles } = req.body;
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ error: 'articles array is required' });
    }

    const texts = articles.map(a => a.text || '');

    // ── Try ML service ───────────────────────────────────────────────────────
    try {
      const mlRes = await fetch(`${ML_SERVICE_URL}/sentiment/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
        signal: AbortSignal.timeout(5000),
      });

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        // Zip ML results back with article ids
        const scored = (mlData.results || []).map((r, i) => ({
          id: articles[i]?.id,
          text: r.text,
          label: r.label,           // 'positive' | 'neutral' | 'negative'
          score: r.score,           // numeric confidence
          entities: r.entities || [],
          source: 'ml',
        }));
        return res.json({ count: scored.length, results: scored, mlAvailable: true });
      }
    } catch { /* ML unavailable, fall through */ }

    // ── Keyword fallback ─────────────────────────────────────────────────────
    const negativeWords = ['disruption', 'strike', 'delay', 'closure', 'sanction', 'shortage', 'crisis', 'war', 'flood', 'blockage'];
    const positiveWords = ['recovery', 'growth', 'record', 'expansion', 'open', 'increase', 'stabilize', 'improve'];

    const scored = articles.map(a => {
      const text = (a.text || '').toLowerCase();
      const negHits = negativeWords.filter(w => text.includes(w)).length;
      const posHits = positiveWords.filter(w => text.includes(w)).length;
      const label = negHits > posHits ? 'negative' : posHits > negHits ? 'positive' : 'neutral';
      const score = label === 'negative' ? -(negHits / 5) : label === 'positive' ? posHits / 5 : 0;
      return { id: a.id, text: a.text, label, score: Math.max(-1, Math.min(1, score)), entities: [], source: 'fallback' };
    });

    res.json({ count: scored.length, results: scored, mlAvailable: false });
  } catch (error) {
    console.error('News scoring error:', error);
    res.status(500).json({ error: 'Failed to score articles' });
  }
});

/**
 * POST /api/news/score-db
 * Re-scores all unscored NewsArticles in the database using the ML sentiment
 * service and persists the results. Useful as a background job trigger.
 */
router.post('/score-db', async (req, res) => {
  try {
    // Fetch articles that haven't been ML-scored yet
    const unscored = await NewsArticle.find({ 'sentiment.source': { $ne: 'ml' } })
      .limit(50);

    if (unscored.length === 0) {
      return res.json({ message: 'All articles already scored', updated: 0 });
    }

    const texts = unscored.map(a => a.headline || a.title || a.summary || '');

    const mlRes = await fetch(`${ML_SERVICE_URL}/sentiment/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(10000),
    });

    if (!mlRes.ok) {
      return res.status(502).json({ error: 'ML service returned error', mlAvailable: false });
    }

    const mlData = await mlRes.json();
    let updated = 0;

    await Promise.all((mlData.results || []).map(async (r, i) => {
      const article = unscored[i];
      if (!article) return;
      article.sentiment = {
        label: r.label,
        score: r.score,
        entities: r.entities || [],
        source: 'ml',
        scoredAt: new Date(),
      };
      await article.save();
      updated++;
    }));

    res.json({ message: 'Scoring complete', updated, mlAvailable: true });
  } catch (error) {
    console.error('DB scoring error:', error);
    res.status(500).json({ error: 'Failed to score database articles' });
  }
});

module.exports = router;
