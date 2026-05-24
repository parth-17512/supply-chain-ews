'use client';

import { useState, useEffect } from 'react';

interface Alert {
  alertId: string;
  shipmentId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  riskScore: number;
  status: 'active' | 'resolved' | 'acknowledged';
  createdAt: string;
  mitigation?: { suggestion: string; status: string };
}

const DEMO_ALERTS: Alert[] = [
  { alertId: 'ALT-0001', shipmentId: 'SHP-2401', severity: 'critical', type: 'congestion', title: 'CRITICAL Risk: Shanghai → Los Angeles', description: 'Severe port congestion detected at Shanghai (Yangshan). Average wait time exceeds 72 hours.', riskScore: 94, status: 'active', createdAt: new Date(Date.now() - 3600000).toISOString(), mitigation: { suggestion: 'Reroute via Busan or delay by 48h. Activate backup carrier COSCO.', status: 'pending' } },
  { alertId: 'ALT-0002', shipmentId: 'SHP-2398', severity: 'critical', type: 'weather', title: 'CRITICAL Risk: Mumbai → Hamburg', description: 'Cyclone warning in Bay of Bengal. Wind speeds >120 km/h forecast for next 72 hours.', riskScore: 91, status: 'active', createdAt: new Date(Date.now() - 7200000).toISOString(), mitigation: { suggestion: 'Hold shipment until weather clears. Expected clearance in 48-72 hours.', status: 'pending' } },
  { alertId: 'ALT-0003', shipmentId: 'SHP-2401', severity: 'critical', type: 'geopolitical', title: 'CRITICAL Risk: Colombo → Yokohama', description: 'Red Sea tensions escalating. Major carriers rerouting around Cape of Good Hope (+14 days).', riskScore: 88, status: 'active', createdAt: new Date(Date.now() - 10800000).toISOString(), mitigation: { suggestion: 'Plan for extended transit time. Notify customer of 14-day delay.', status: 'pending' } },
  { alertId: 'ALT-0004', shipmentId: 'SHP-2395', severity: 'high', type: 'strike', title: 'HIGH Risk: Santos → Felixstowe', description: 'Port workers at Santos announced 72-hour strike starting Tuesday. Loading operations halted.', riskScore: 80, status: 'active', createdAt: new Date(Date.now() - 14400000).toISOString(), mitigation: { suggestion: 'Activate backup carrier. Pre-position inventory at Rio de Janeiro as fallback.', status: 'pending' } },
  { alertId: 'ALT-0005', shipmentId: 'SHP-2391', severity: 'high', type: 'congestion', title: 'HIGH Risk: Mumbai (JNPT) → Colombo', description: 'JNPT experiencing 35% above-average vessel traffic due to diverted Red Sea shipments.', riskScore: 76, status: 'active', createdAt: new Date(Date.now() - 18000000).toISOString(), mitigation: { suggestion: 'Monitor situation. Consider detouring via Chennai for time-critical cargo.', status: 'pending' } },
  { alertId: 'ALT-0006', shipmentId: 'SHP-2388', severity: 'high', type: 'geopolitical', title: 'HIGH Risk: Port Said → Piraeus', description: 'Elevated geopolitical tension in Eastern Mediterranean. Insurance premiums increased 40%.', riskScore: 72, status: 'acknowledged', createdAt: new Date(Date.now() - 86400000).toISOString(), mitigation: { suggestion: 'Review insurance coverage. Monitor Lloyd\'s of London risk updates daily.', status: 'acknowledged' } },
  { alertId: 'ALT-0007', shipmentId: 'SHP-2382', severity: 'medium', type: 'weather', title: 'MEDIUM Risk: Hamburg → New York', description: 'Atlantic storm system forming. Potential 24-36 hour delay in departure window.', riskScore: 58, status: 'acknowledged', createdAt: new Date(Date.now() - 172800000).toISOString(), mitigation: { suggestion: 'Monitor NOAA forecast. Adjust departure window by 48 hours if needed.', status: 'acknowledged' } },
  { alertId: 'ALT-0008', shipmentId: 'SHP-2370', severity: 'medium', type: 'congestion', title: 'MEDIUM Risk: Rotterdam → NYC', description: 'Seasonal high volume period causing 18-24 hour processing delays at Rotterdam terminals.', riskScore: 52, status: 'resolved', createdAt: new Date(Date.now() - 259200000).toISOString(), mitigation: { suggestion: 'Resolved: Congestion cleared. Shipment back on schedule.', status: 'resolved' } },
  { alertId: 'ALT-0009', shipmentId: 'SHP-2365', severity: 'low', type: 'regulatory', title: 'LOW Risk: Singapore → Hamburg', description: 'New customs documentation requirements from Jan 1. Minor compliance update needed.', riskScore: 28, status: 'resolved', createdAt: new Date(Date.now() - 432000000).toISOString(), mitigation: { suggestion: 'Resolved: Documentation updated. Compliant with new regulations.', status: 'resolved' } },
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--danger)',   bg: 'var(--danger-soft)',   label: '🔴 CRITICAL' },
  high:     { color: 'var(--warning)',  bg: 'var(--warning-soft)',  label: '🟠 HIGH' },
  medium:   { color: '#f59e0b',         bg: 'rgba(245,158,11,0.1)', label: '🟡 MEDIUM' },
  low:      { color: 'var(--success)',  bg: 'var(--success-soft)',  label: '🟢 LOW' },
};
const DEFAULT_SEV = { color: 'var(--text-muted)', bg: 'var(--bg-card)', label: 'UNKNOWN' };

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  active:       { color: 'var(--danger)',  bg: 'var(--danger-soft)',  label: 'Active' },
  acknowledged: { color: 'var(--warning)', bg: 'var(--warning-soft)', label: 'Acknowledged' },
  resolved:     { color: 'var(--success)', bg: 'var(--success-soft)', label: 'Resolved' },
};
const DEFAULT_STA = { color: 'var(--text-muted)', bg: 'var(--bg-card)', label: 'Unknown' };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/alerts?limit=50');
        if (res.ok) {
          const data = await res.json();
          const fetched = (data.alerts || data);
          if (fetched.length > 0) setAlerts(fetched);
        }
      } catch { /* use demo */ }
      finally { setLoading(false); }
    };
    fetchAlerts();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (alertId: string, action: 'approve' | 'ignore' | 'acknowledge') => {
    try {
      await fetch(`http://localhost:5000/api/alerts/${alertId}/${action}`, { method: 'POST' });
    } catch { /* optimistic */ }
    setAlerts(prev => prev.map(a => a.alertId === alertId
      ? { ...a, status: action === 'approve' ? 'resolved' : action === 'acknowledge' ? 'acknowledged' : 'resolved' }
      : a
    ));
    showToast(
      action === 'approve' ? `✅ Reroute approved for ${alerts.find(a=>a.alertId===alertId)?.title?.split(':')[1]?.trim() || alertId}` :
      action === 'acknowledge' ? `👁 Alert acknowledged` :
      `🔕 Alert dismissed`
    );
  };

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    high:     alerts.filter(a => a.severity === 'high'     && a.status === 'active').length,
    active:   alerts.filter(a => a.status === 'active').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: 'var(--bg-secondary)', border: '1px solid var(--accent-cyan)', borderRadius: 'var(--radius)', padding: '12px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', animation: 'slideUp 0.2s ease both' }}>
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>🚨 Alert Center</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${counts.active} active alerts · ${counts.resolved} resolved`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Summary badges */}
          {[
            { label: 'Critical', count: counts.critical, color: 'var(--danger)' },
            { label: 'High', count: counts.high, color: 'var(--warning)' },
          ].map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', border: `1px solid ${b.color}`, borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: 12 }}>
              <span style={{ color: b.color, fontWeight: 800 }}>{b.count}</span>
              <span style={{ color: 'var(--text-muted)' }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <input
          placeholder="🔍 Search alerts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
        {/* Severity filter */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 4, border: '1px solid var(--border-color)' }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: severityFilter === s ? 'var(--accent-cyan)' : 'transparent', color: severityFilter === s ? '#000' : 'var(--text-muted)', textTransform: 'capitalize' }}>
              {s === 'all' ? 'All Severity' : s}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 4, border: '1px solid var(--border-color)' }}>
          {['all', 'active', 'acknowledged', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: statusFilter === s ? 'var(--bg-secondary)' : 'transparent', color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
              {s === 'all' ? 'All Status' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Showing {filtered.length} of {alerts.length} alerts
      </div>

      {/* Alert List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🟢</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>No alerts match your filters</div>
          <div style={{ fontSize: 13 }}>Try adjusting the severity or status filters</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(alert => {
            const sev = SEVERITY_CONFIG[alert.severity] ?? DEFAULT_SEV;
            const sta = STATUS_CONFIG[alert.status] ?? DEFAULT_STA;
            const isExpanded = expandedId === alert.alertId;
            return (
              <div key={alert.alertId} className="card" style={{ border: `1px solid ${alert.status === 'active' ? sev.color + '44' : 'var(--border-color)'}`, transition: 'border-color 0.2s' }}>
                {/* Alert Row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : alert.alertId)}
                >
                  {/* Risk Score */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: sev.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: sev.color }}>{alert.riskScore}</span>
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: sev.bg, color: sev.color, fontWeight: 700 }}>{sev.label}</span>
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: sta.bg, color: sta.color, fontWeight: 600 }}>{sta.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.description}
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: 3, textTransform: 'capitalize', color: 'var(--accent-cyan)' }}>{alert.type}</div>
                    <div>{new Date(alert.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    {alert.shipmentId && <div style={{ marginTop: 2 }}>{alert.shipmentId}</div>}
                  </div>

                  {/* Chevron */}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-color)', padding: '14px 16px', background: 'rgba(0,0,0,0.15)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{alert.description}</div>
                    {alert.mitigation && (
                      <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>💡 Mitigation Suggestion</div>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{alert.mitigation.suggestion}</div>
                      </div>
                    )}
                    {alert.status === 'active' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleAction(alert.alertId, 'approve')}
                          style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: 'var(--accent-cyan)', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          ✅ Approve Reroute
                        </button>
                        <button onClick={() => handleAction(alert.alertId, 'acknowledge')}
                          style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid var(--warning)', background: 'transparent', color: 'var(--warning)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          👁 Acknowledge
                        </button>
                        <button onClick={() => handleAction(alert.alertId, 'ignore')}
                          style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Dismiss
                        </button>
                      </div>
                    )}
                    {alert.status !== 'active' && (
                      <div style={{ fontSize: 12, color: sta.color, fontWeight: 600 }}>
                        {alert.status === 'resolved' ? '✅ This alert has been resolved' : '👁 This alert has been acknowledged'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
