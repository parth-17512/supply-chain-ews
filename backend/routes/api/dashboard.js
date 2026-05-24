const express = require('express');
const router = express.Router();
const Shipment = require('../../models/Shipment');
const Alert = require('../../models/Alert');
const RiskScore = require('../../models/RiskScore');
const NewsArticle = require('../../models/NewsArticle');
const ModelPerformance = require('../../models/ModelPerformance');
const latencyTracker = require('../../middleware/latencyTracker');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * callMlPredict — calls /predict on the ML service for a single shipment.
 * Returns null if the ML service is unavailable (graceful fallback).
 */
async function callMlPredict(shipment) {
  try {
    const payload = {
      delay_ratio: Math.min(1, (shipment.delayDays || 0) / 30),
      port_congestion: (shipment.portCongestionLevel || 0) / 100,
      weather_severity: (shipment.weatherSeverity || 0) / 100,
      sentiment_score: shipment.sentimentScore || 0,
      historical_reliability: shipment.carrierReliability || 0.85,
      volume_change: shipment.volumeChange || 0,
      weather_risk: shipment.weatherRisk || 20,
      historical_delay: shipment.historicalDelay || 15,
    };

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000), // 3 s timeout
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null; // ML service down — caller will use DB scores
  }
}

// GET /api/dashboard — aggregated dashboard data
router.get('/', async (req, res) => {
  try {
    // Get latest risk scores from DB
    const latestScores = await RiskScore.find({ isSimulation: false })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get shipments at risk
    const atRiskShipments = await Shipment.find({ riskScore: { $gte: 60 } })
      .sort({ riskScore: -1 })
      .limit(20);

    // ── ML enrichment ────────────────────────────────────────────────────────
    // Call /predict for up to 5 high-risk shipments and use the ML score
    // to recalculate the disruption index. Falls back to DB scores on error.
    let mlEnrichedScores = [];
    let mlAvailable = false;
    try {
      const sample = atRiskShipments.slice(0, 5);
      const mlResults = await Promise.all(sample.map(s => callMlPredict(s)));
      mlEnrichedScores = mlResults.filter(Boolean);
      mlAvailable = mlEnrichedScores.length > 0;
    } catch { /* ignore */ }

    // Compute disruption index: prefer ML scores, fall back to DB
    let disruptionIndex;
    if (mlAvailable) {
      disruptionIndex = Math.round(
        mlEnrichedScores.reduce((sum, r) => sum + r.risk_score, 0) / mlEnrichedScores.length
      );
    } else {
      const topScores = latestScores.slice(0, 10);
      disruptionIndex = topScores.length > 0
        ? Math.round(topScores.reduce((sum, s) => sum + s.overallScore, 0) / topScores.length)
        : 0;
    }
    // ────────────────────────────────────────────────────────────────────────

    // Get active critical alerts
    const activeAlerts = await Alert.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get latest model confidence
    const latestPerformance = await ModelPerformance.findOne()
      .sort({ createdAt: -1 });

    // Predictive confidence: use ML confidence if available, else DB average
    let predictiveConfidence;
    if (mlAvailable) {
      predictiveConfidence = Math.round(
        mlEnrichedScores.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / mlEnrichedScores.length * 100
      );
    } else {
      const avgConfidence = latestScores.length > 0
        ? latestScores.reduce((sum, s) => sum + (s.confidence || 0.5), 0) / latestScores.length
        : 0.5;
      predictiveConfidence = Math.round(avgConfidence * 100);
    }

    // Get recent news
    const recentNews = await NewsArticle.find()
      .sort({ publishedAt: -1 })
      .limit(20);

    // Get system health
    const latencyData = latencyTracker.getLatencyData();

    res.json({
      disruptionIndex,
      predictiveConfidence,
      mlEnriched: mlAvailable,          // flag so frontend knows if ML data is live
      activeAlerts: {
        count: activeAlerts.length,
        items: activeAlerts
      },
      atRiskShipments: {
        count: atRiskShipments.length,
        items: atRiskShipments
      },
      sentimentFeed: recentNews,
      riskScores: latestScores,
      modelPerformance: latestPerformance,
      systemHealth: {
        apiLatency: Math.round(latencyData.average * 100) / 100,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
