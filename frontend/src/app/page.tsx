'use client';

import { useEffect, useState, useCallback } from 'react';
import DisruptionGauge from '@/components/DisruptionGauge';
import CriticalAlerts from '@/components/CriticalAlerts';
import PredictiveConfidence from '@/components/PredictiveConfidence';
import RiskHeatmap from '@/components/RiskHeatmap';
import SentimentFeed from '@/components/SentimentFeed';
import SystemHealth from '@/components/SystemHealth';
import MitigationSuggestions from '@/components/MitigationSuggestions';
import LiveConditionsPanel from '@/components/LiveConditionsPanel';
import { api } from '@/lib/api';

// ── Demo data (used when backend is offline) ─────────────────────────────────
const DEMO_DATA = {
  disruptionIndex: 67,
  predictiveConfidence: 78,
  activeAlerts: {
    count: 4,
    items: [
      { alertId: 'ALT-0001', severity: 'critical', title: 'CRITICAL Risk: Shanghai → Los Angeles', description: 'Risk score of 92 detected.', riskScore: 92, type: 'congestion', mitigation: { suggestion: 'Severe congestion at Shanghai port. Consider rerouting via Singapore or delaying shipment by 24-48 hours.', status: 'pending' } },
      { alertId: 'ALT-0002', severity: 'critical', title: 'CRITICAL Risk: Mumbai → Hamburg', description: 'Risk score of 88 detected.', riskScore: 88, type: 'weather', mitigation: { suggestion: 'Cyclone warning in Bay of Bengal. Recommend holding shipment until weather clears in 48-72 hours.', status: 'pending' } },
      { alertId: 'ALT-0003', severity: 'high', title: 'HIGH Risk: Santos → Felixstowe', description: 'Risk score of 76 detected.', riskScore: 76, type: 'strike', mitigation: { suggestion: 'Port worker strike announced at Santos. Activate backup carrier and pre-position inventory.', status: 'pending' } },
      { alertId: 'ALT-0004', severity: 'high', title: 'HIGH Risk: Busan → Los Angeles', description: 'Risk score of 72 detected.', riskScore: 72, type: 'geopolitical', mitigation: { suggestion: 'New trade tariffs may cause delays. Monitor situation and prepare alternative customs routes.', status: 'pending' } },
    ]
  },
  sentimentFeed: [
    { headline: 'Port of Shanghai reports record congestion levels amid surge in exports', publishedAt: new Date(Date.now() - 3600000).toISOString(), sentiment: { score: -0.6, label: 'negative' as const, confidence: 0.8 }, entities: [{ text: 'Shanghai', type: 'port' }, { text: 'China', type: 'location' }], source: 'Reuters', category: 'logistics' },
    { headline: 'Tropical cyclone warning issued for Bay of Bengal shipping lanes', publishedAt: new Date(Date.now() - 7200000).toISOString(), sentiment: { score: -0.8, label: 'negative' as const, confidence: 0.9 }, entities: [{ text: 'Bay of Bengal', type: 'location' }], source: 'Bloomberg', category: 'weather' },
    { headline: 'Dock workers in Rotterdam announce 48-hour strike over pay dispute', publishedAt: new Date(Date.now() - 10800000).toISOString(), sentiment: { score: -0.9, label: 'negative' as const, confidence: 0.95 }, entities: [{ text: 'Rotterdam', type: 'port' }], source: 'Financial Times', category: 'labor' },
    { headline: 'Suez Canal reopens after brief blockage, backlog expected to clear', publishedAt: new Date(Date.now() - 14400000).toISOString(), sentiment: { score: 0.3, label: 'positive' as const, confidence: 0.6 }, entities: [{ text: 'Suez Canal', type: 'port' }], source: "Lloyd's List", category: 'logistics' },
    { headline: 'Red Sea tensions force major carriers to reroute via Cape of Good Hope', publishedAt: new Date(Date.now() - 28800000).toISOString(), sentiment: { score: -0.85, label: 'negative' as const, confidence: 0.92 }, entities: [{ text: 'Red Sea', type: 'location' }], source: 'Financial Times', category: 'geopolitical' },
  ],
  heatmapData: [
    { lat: 31.23, lng: 121.47, name: 'Shanghai', avgRisk: 85, intensity: 0.85, count: 12 },
    { lat: 1.35, lng: 103.82, name: 'Singapore', avgRisk: 35, intensity: 0.35, count: 8 },
    { lat: 51.92, lng: 4.48, name: 'Rotterdam', avgRisk: 72, intensity: 0.72, count: 6 },
    { lat: 33.74, lng: -118.27, name: 'Los Angeles', avgRisk: 42, intensity: 0.42, count: 5 },
    { lat: 25.04, lng: 55.11, name: 'Dubai', avgRisk: 28, intensity: 0.28, count: 4 },
    { lat: 53.55, lng: 9.99, name: 'Hamburg', avgRisk: 55, intensity: 0.55, count: 3 },
    { lat: 35.18, lng: 129.08, name: 'Busan', avgRisk: 48, intensity: 0.48, count: 7 },
    { lat: 18.95, lng: 72.95, name: 'Mumbai', avgRisk: 78, intensity: 0.78, count: 5 },
    { lat: -23.96, lng: -46.33, name: 'Santos', avgRisk: 65, intensity: 0.65, count: 3 },
    { lat: 31.26, lng: 32.28, name: 'Port Said', avgRisk: 58, intensity: 0.58, count: 4 },
    { lat: 35.44, lng: 139.64, name: 'Yokohama', avgRisk: 38, intensity: 0.38, count: 5 },
    { lat: -4.04, lng: 39.67, name: 'Mombasa', avgRisk: 32, intensity: 0.32, count: 2 },
    { lat: 51.95, lng: 1.35, name: 'Felixstowe', avgRisk: 45, intensity: 0.45, count: 3 },
    { lat: 6.95, lng: 79.84, name: 'Colombo', avgRisk: 40, intensity: 0.40, count: 3 },
  ],
  systemHealth: { apiLatency: 45.2, uptime: 86400 },
  mlServiceStatus: 'connected' as string,
};

type DashboardView = 'dashboard' | 'list' | 'split';

export default function DashboardPage() {
  const [data, setData] = useState(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DashboardView>('dashboard');
  const [toast, setToast] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashboardRes, heatmapRes] = await Promise.all([
        api.getDashboard(),
        api.getHeatmapData()
      ]);
      setData({
        ...dashboardRes,
        heatmapData: heatmapRes,
        mlServiceStatus: dashboardRes.systemHealth?.mlServiceStatus || 'unknown'
      });
    } catch {
      console.log('Using demo data — backend not connected');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Listen for view switcher events from Header
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<DashboardView>;
      setView(custom.detail);
    };
    window.addEventListener('dashboardViewChange', handler);
    return () => window.removeEventListener('dashboardViewChange', handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      await api.alertAction(alertId, action);
      showToast(action === 'approve' ? '✅ Reroute approved successfully' : '🔕 Alert dismissed');
      fetchDashboard();
    } catch {
      // Optimistic update
      setData(prev => ({
        ...prev,
        activeAlerts: {
          ...prev.activeAlerts,
          items: prev.activeAlerts.items.filter(a => a.alertId !== alertId),
          count: prev.activeAlerts.count - 1,
        }
      }));
      showToast(action === 'approve' ? '✅ Reroute approved' : '🔕 Alert dismissed');
    }
  };

  // ── LIST VIEW (table-style stacked layout) ───────────────────────────────
  if (view === 'list') {
    return (
      <div style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        {toast && <Toast message={toast} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            <DisruptionGauge score={data.disruptionIndex} />
            <PredictiveConfidence confidence={data.predictiveConfidence} />
            <SystemHealth
              apiLatency={data.systemHealth?.apiLatency || 0}
              ingestionRate={35}
              mlStatus={data.mlServiceStatus || 'disconnected'}
              uptime={data.systemHealth?.uptime || 0}
            />
          </div>
          {/* Row 2: alerts full-width */}
          <CriticalAlerts alerts={data.activeAlerts?.items || []} onAction={handleAlertAction} />
          {/* Row 3: feed + suggestions + live conditions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <SentimentFeed articles={data.sentimentFeed || []} />
            <MitigationSuggestions alerts={data.activeAlerts?.items || []} onAction={handleAlertAction} />
            <LiveConditionsPanel />
          </div>
        </div>
      </div>
    );
  }

  // ── SPLIT VIEW (heatmap left, all panels right) ───────────────────────────
  if (view === 'split') {
    return (
      <div style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
        {toast && <Toast message={toast} />}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, height: 'calc(100vh - 80px)' }}>
          {/* Left: full-height heatmap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              <DisruptionGauge score={data.disruptionIndex} />
              <PredictiveConfidence confidence={data.predictiveConfidence} />
              <SystemHealth
                apiLatency={data.systemHealth?.apiLatency || 0}
                ingestionRate={35}
                mlStatus={data.mlServiceStatus || 'disconnected'}
                uptime={data.systemHealth?.uptime || 0}
              />
            </div>
            <div style={{ flex: 1 }}>
              <RiskHeatmap data={data.heatmapData || []} />
            </div>
          </div>
          {/* Right: scrollable panel */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <LiveConditionsPanel />
            <CriticalAlerts alerts={data.activeAlerts?.items || []} onAction={handleAlertAction} />
            <SentimentFeed articles={data.sentimentFeed || []} />
            <MitigationSuggestions alerts={data.activeAlerts?.items || []} onAction={handleAlertAction} />
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT DASHBOARD VIEW ────────────────────────────────────────────────
  return (
    <div className="dashboard-body" style={{ opacity: loading ? 0.7 : 1, transition: 'opacity 0.3s' }}>
      {toast && <Toast message={toast} />}

      {/* LEFT: Main Column */}
      <div className="dashboard-main">
        <div className="top-row">
          <DisruptionGauge score={data.disruptionIndex} />
          <CriticalAlerts alerts={data.activeAlerts?.items || []} onAction={handleAlertAction} />
          <PredictiveConfidence confidence={data.predictiveConfidence} />
        </div>
        <div className="map-area">
          <RiskHeatmap data={data.heatmapData || []} />
        </div>
      </div>

      {/* RIGHT: Sidebar Column */}
      <div className="dashboard-aside">
        <LiveConditionsPanel />
        <SentimentFeed articles={data.sentimentFeed || []} />
        <MitigationSuggestions alerts={data.activeAlerts?.items || []} onAction={handleAlertAction} />
        <SystemHealth
          apiLatency={data.systemHealth?.apiLatency || 0}
          ingestionRate={35}
          mlStatus={data.mlServiceStatus || 'disconnected'}
          uptime={data.systemHealth?.uptime || 0}
        />
      </div>
    </div>
  );
}

// ── Toast notification component ─────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      background: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)',
      borderRadius: 'var(--radius)', padding: '12px 20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
      animation: 'slideUp 0.2s ease both',
    }}>
      {message}
    </div>
  );
}
