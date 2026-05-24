require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const Alert = require('../models/Alert');
const NewsArticle = require('../models/NewsArticle');
const RiskScore = require('../models/RiskScore');
const ModelPerformance = require('../models/ModelPerformance');

const PORTS = [
  { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Rotterdam', country: 'Netherlands', lat: 51.9225, lng: 4.4792 },
  { name: 'Los Angeles', country: 'USA', lat: 33.7405, lng: -118.2653 },
  { name: 'Dubai (Jebel Ali)', country: 'UAE', lat: 25.0443, lng: 55.1056 },
  { name: 'Hamburg', country: 'Germany', lat: 53.5511, lng: 9.9937 },
  { name: 'Busan', country: 'South Korea', lat: 35.1796, lng: 129.0756 },
  { name: 'Mumbai (JNPT)', country: 'India', lat: 18.9506, lng: 72.9496 },
  { name: 'Santos', country: 'Brazil', lat: -23.9608, lng: -46.3336 },
  { name: 'Mombasa', country: 'Kenya', lat: -4.0435, lng: 39.6682 },
  { name: 'Port Said', country: 'Egypt', lat: 31.2565, lng: 32.2841 },
  { name: 'Yokohama', country: 'Japan', lat: 35.4437, lng: 139.6380 },
  { name: 'Felixstowe', country: 'UK', lat: 51.9536, lng: 1.3511 },
  { name: 'Piraeus', country: 'Greece', lat: 37.9475, lng: 23.6372 },
  { name: 'Colombo', country: 'Sri Lanka', lat: 6.9497, lng: 79.8428 },
];

const CARRIERS = ['Maersk', 'MSC', 'CMA CGM', 'COSCO', 'Hapag-Lloyd', 'ONE', 'Evergreen', 'Yang Ming', 'ZIM', 'HMM'];
const CARGO_TYPES = ['Electronics', 'Automotive Parts', 'Pharmaceuticals', 'Textiles', 'Raw Materials', 'Food & Beverages', 'Chemicals', 'Machinery', 'Consumer Goods', 'Medical Supplies'];
const STATUSES = ['in_transit', 'in_transit', 'in_transit', 'delayed', 'at_risk', 'delivered']; // weighted

const NEWS_HEADLINES = [
  { headline: 'Port of Shanghai reports record congestion levels amid surge in exports', category: 'logistics', sentiment: -0.6, entities: [{ text: 'Shanghai', type: 'port' }, { text: 'China', type: 'location' }] },
  { headline: 'Suez Canal reopens after brief blockage, backlog expected to clear in 48 hours', category: 'logistics', sentiment: 0.3, entities: [{ text: 'Suez Canal', type: 'port' }, { text: 'Egypt', type: 'location' }] },
  { headline: 'Tropical cyclone warning issued for Bay of Bengal shipping lanes', category: 'weather', sentiment: -0.8, entities: [{ text: 'Bay of Bengal', type: 'location' }, { text: 'Cyclone', type: 'event' }] },
  { headline: 'Dock workers in Rotterdam announce 48-hour strike over pay dispute', category: 'labor', sentiment: -0.9, entities: [{ text: 'Rotterdam', type: 'port' }, { text: 'Strike', type: 'event' }] },
  { headline: 'US-China trade tensions escalate with new tariffs on semiconductor components', category: 'geopolitical', sentiment: -0.7, entities: [{ text: 'US', type: 'location' }, { text: 'China', type: 'location' }, { text: 'Semiconductors', type: 'commodity' }] },
  { headline: 'Mediterranean shipping rates fall 15% as new capacity enters market', category: 'economic', sentiment: 0.5, entities: [{ text: 'Mediterranean', type: 'location' }] },
  { headline: 'Global container shortage eases as manufacturers ramp up production', category: 'logistics', sentiment: 0.6, entities: [{ text: 'Container Shortage', type: 'event' }] },
  { headline: 'Indian monsoon threatens to disrupt Mumbai port operations for two weeks', category: 'weather', sentiment: -0.7, entities: [{ text: 'Mumbai', type: 'port' }, { text: 'Monsoon', type: 'event' }, { text: 'India', type: 'location' }] },
  { headline: 'New EU sanctions on Russian oil tankers impact Baltic Sea shipping', category: 'geopolitical', sentiment: -0.6, entities: [{ text: 'EU', type: 'organization' }, { text: 'Russia', type: 'location' }, { text: 'Baltic Sea', type: 'location' }] },
  { headline: 'Port of Singapore achieves record throughput with automated systems', category: 'logistics', sentiment: 0.8, entities: [{ text: 'Singapore', type: 'port' }] },
  { headline: 'Major earthquake off coast of Japan disrupts Yokohama port operations', category: 'weather', sentiment: -0.9, entities: [{ text: 'Japan', type: 'location' }, { text: 'Yokohama', type: 'port' }, { text: 'Earthquake', type: 'event' }] },
  { headline: 'African Continental Free Trade Area boosts Mombasa port activity', category: 'trade', sentiment: 0.7, entities: [{ text: 'AfCFTA', type: 'organization' }, { text: 'Mombasa', type: 'port' }] },
  { headline: 'Semiconductor chip shortage continues to impact automotive supply chains', category: 'economic', sentiment: -0.5, entities: [{ text: 'Semiconductors', type: 'commodity' }, { text: 'Automotive', type: 'commodity' }] },
  { headline: 'Brazil port workers demand better safety conditions, threaten walkout', category: 'labor', sentiment: -0.6, entities: [{ text: 'Santos', type: 'port' }, { text: 'Brazil', type: 'location' }] },
  { headline: 'Green hydrogen fuel cells reduce shipping emissions by 40% in pilot program', category: 'trade', sentiment: 0.9, entities: [{ text: 'Hydrogen', type: 'commodity' }] },
  { headline: 'Red Sea tensions force major carriers to reroute around Cape of Good Hope', category: 'geopolitical', sentiment: -0.85, entities: [{ text: 'Red Sea', type: 'location' }, { text: 'Houthi', type: 'organization' }] },
  { headline: 'Panama Canal restricts transit due to historic drought conditions', category: 'weather', sentiment: -0.75, entities: [{ text: 'Panama Canal', type: 'port' }, { text: 'Drought', type: 'event' }] },
  { headline: 'Korean shipbuilders report full order books through 2027', category: 'economic', sentiment: 0.6, entities: [{ text: 'South Korea', type: 'location' }, { text: 'Busan', type: 'port' }] },
  { headline: 'Cyber attack on Maersk subsidiary disrupts booking systems worldwide', category: 'logistics', sentiment: -0.8, entities: [{ text: 'Maersk', type: 'organization' }, { text: 'Cyber Attack', type: 'event' }] },
  { headline: 'Sri Lanka port expansion attracts major Asian shipping lines', category: 'trade', sentiment: 0.65, entities: [{ text: 'Colombo', type: 'port' }, { text: 'Sri Lanka', type: 'location' }] },
];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/supply_chain_ews');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Shipment.deleteMany({}),
      Alert.deleteMany({}),
      NewsArticle.deleteMany({}),
      RiskScore.deleteMany({}),
      ModelPerformance.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Seed Shipments
    const shipments = [];
    for (let i = 0; i < 50; i++) {
      const origin = randomFrom(PORTS);
      let dest = randomFrom(PORTS);
      while (dest.name === origin.name) dest = randomFrom(PORTS);

      const riskScore = randomBetween(5, 95);
      const status = riskScore > 80 ? 'at_risk' : riskScore > 60 ? 'delayed' : randomFrom(STATUSES);

      shipments.push({
        shipmentId: `SHP-${String(i + 1).padStart(4, '0')}`,
        origin: { name: origin.name, country: origin.country, lat: origin.lat, lng: origin.lng },
        destination: { name: dest.name, country: dest.country, lat: dest.lat, lng: dest.lng },
        carrier: randomFrom(CARRIERS),
        mode: randomFrom(['sea', 'sea', 'sea', 'air', 'rail']),
        status,
        eta: new Date(Date.now() + randomBetween(1, 30) * 86400000),
        delayHours: status === 'delayed' ? randomBetween(6, 72) : 0,
        cargo: { cargoType: randomFrom(CARGO_TYPES), weight: randomBetween(100, 50000), value: randomBetween(10000, 5000000) },
        riskScore,
        riskFactors: [
          { factor: 'weather', weight: 0.2, score: randomBetween(0, 100) },
          { factor: 'congestion', weight: 0.3, score: randomBetween(0, 100) },
          { factor: 'geopolitical', weight: 0.3, score: randomBetween(0, 100) },
          { factor: 'historical', weight: 0.2, score: randomBetween(0, 100) }
        ],
        route: [
          { port: origin.name, country: origin.country, lat: origin.lat, lng: origin.lng, status: randomFrom(['clear', 'clear', 'congested']) },
          { port: dest.name, country: dest.country, lat: dest.lat, lng: dest.lng, status: 'clear' }
        ]
      });
    }
    await Shipment.insertMany(shipments);
    console.log(`✅ Seeded ${shipments.length} shipments`);

    // Seed News Articles
    const articles = [];
    for (let i = 0; i < NEWS_HEADLINES.length; i++) {
      const h = NEWS_HEADLINES[i];
      articles.push({
        headline: h.headline,
        source: randomFrom(['Reuters', 'Bloomberg', 'Financial Times', 'Lloyd\'s List', 'FreightWaves', 'The Maritime Executive']),
        publishedAt: new Date(Date.now() - randomBetween(0, 7) * 86400000 - randomBetween(0, 86400000)),
        sentiment: {
          score: h.sentiment,
          label: h.sentiment > 0.1 ? 'positive' : h.sentiment < -0.1 ? 'negative' : 'neutral',
          confidence: Math.abs(h.sentiment) * 0.9 + 0.1
        },
        entities: h.entities,
        category: h.category,
        relevanceScore: Math.random() * 0.5 + 0.5,
        region: h.entities.find(e => e.type === 'location')?.text || 'Global'
      });
    }
    await NewsArticle.insertMany(articles);
    console.log(`✅ Seeded ${articles.length} news articles`);

    // Seed Risk Scores
    const riskScores = [];
    for (const s of shipments.slice(0, 30)) {
      riskScores.push({
        shipmentId: s.shipmentId,
        overallScore: s.riskScore,
        components: {
          anomalyScore: randomBetween(10, 90),
          sentimentRisk: randomBetween(10, 80),
          weatherRisk: randomBetween(5, 70),
          historicalDelay: randomBetween(5, 60)
        },
        predictedDelay: s.delayHours || randomBetween(0, 48),
        confidence: Math.random() * 0.5 + 0.4,
        modelVersion: 'v1.0.0',
        isSimulation: false
      });
    }
    await RiskScore.insertMany(riskScores);
    console.log(`✅ Seeded ${riskScores.length} risk scores`);

    // Seed Alerts
    const highRiskShipments = shipments.filter(s => s.riskScore >= 70);
    const alerts = [];
    for (let i = 0; i < Math.min(8, highRiskShipments.length); i++) {
      const s = highRiskShipments[i];
      const alertTypes = ['port_closure', 'weather', 'geopolitical', 'congestion', 'strike'];
      alerts.push({
        alertId: `ALT-${String(i + 1).padStart(4, '0')}`,
        severity: s.riskScore >= 85 ? 'critical' : 'high',
        type: randomFrom(alertTypes),
        title: `${s.riskScore >= 85 ? 'CRITICAL' : 'HIGH'} Risk: ${s.origin.name} → ${s.destination.name}`,
        description: `Elevated risk score of ${s.riskScore} detected. Monitoring required.`,
        affectedRoute: { from: s.origin.name, to: s.destination.name, region: s.origin.country },
        riskScore: s.riskScore,
        shipmentIds: [s.shipmentId],
        mitigation: {
          suggestion: `Consider alternative routing via ${randomFrom(PORTS).name} to avoid risk zone.`,
          alternativeRoutes: [`${s.origin.name} → Singapore → ${s.destination.name}`, `${s.origin.name} → Dubai → ${s.destination.name}`],
          estimatedCostImpact: randomBetween(5000, 50000),
          status: 'pending'
        },
        isActive: true
      });
    }
    await Alert.insertMany(alerts);
    console.log(`✅ Seeded ${alerts.length} alerts`);

    // Seed Model Performance
    const perfLogs = [];
    for (let i = 0; i < 14; i++) {
      perfLogs.push({
        modelName: 'IsolationForest',
        version: 'v1.0.0',
        metrics: {
          mae: parseFloat((Math.random() * 5 + 3).toFixed(2)),
          rmse: parseFloat((Math.random() * 8 + 4).toFixed(2)),
          f1Score: parseFloat((Math.random() * 0.2 + 0.75).toFixed(3)),
          precision: parseFloat((Math.random() * 0.15 + 0.78).toFixed(3)),
          recall: parseFloat((Math.random() * 0.2 + 0.72).toFixed(3)),
          accuracy: parseFloat((Math.random() * 0.1 + 0.82).toFixed(3))
        },
        dataPointsUsed: randomBetween(500, 2000),
        trainingDuration: randomBetween(10, 120),
        evaluatedAt: new Date(Date.now() - i * 86400000)
      });
    }
    await ModelPerformance.insertMany(perfLogs);
    console.log(`✅ Seeded ${perfLogs.length} model performance logs`);

    console.log('\n🎉 Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
