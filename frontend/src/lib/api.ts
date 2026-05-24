const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => fetchAPI('/dashboard'),

  // Alerts
  getAlerts: (params?: { severity?: string; active?: boolean }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI(`/alerts${query ? `?${query}` : ''}`);
  },
  alertAction: (alertId: string, action: string) =>
    fetchAPI(`/alerts/${alertId}/action`, { method: 'PATCH', body: JSON.stringify({ action }) }),

  // Shipments
  getShipments: (params?: { status?: string; minRisk?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI(`/shipments${query ? `?${query}` : ''}`);
  },
  getHeatmapData: () => fetchAPI('/shipments/heatmap'),

  // What-If
  simulateWhatIf: (params: {
    portStatus: boolean;
    weatherSeverity: number;
    strikeProbability: number;
    congestionLevel: number;
    region?: string;
  }) => fetchAPI('/whatif', { method: 'POST', body: JSON.stringify(params) }),

  // News / Sentiment
  getNews: (params?: { category?: string; sentiment?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchAPI(`/news${query ? `?${query}` : ''}`);
  },

  // Live Data
  getLiveWeather: () => fetchAPI('/live/weather'),
  getLiveCongestion: () => fetchAPI('/live/congestion'),

  // System Health
  getHealth: () => fetchAPI('/health'),

  // Model Performance
  getModelPerformance: () => fetchAPI('/model'),

  // Notifications
  getNotificationPrefs: () => fetchAPI('/notifications'),
  updateNotificationPrefs: (prefs: Record<string, unknown>) =>
    fetchAPI('/notifications', { method: 'PUT', body: JSON.stringify(prefs) }),
};
