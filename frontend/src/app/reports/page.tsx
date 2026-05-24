'use client';

import { useState, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Full dataset per time range ─────────────────────────────────────────────
const DATA_BY_RANGE = {
  '7D': {
    weekly: [
      { week: 'Mon', riskScore: 61, disruptions: 4 },
      { week: 'Tue', riskScore: 72, disruptions: 6 },
      { week: 'Wed', riskScore: 67, disruptions: 5 },
      { week: 'Thu', riskScore: 80, disruptions: 8 },
      { week: 'Fri', riskScore: 88, disruptions: 10 },
      { week: 'Sat', riskScore: 74, disruptions: 7 },
      { week: 'Sun', riskScore: 70, disruptions: 6 },
    ],
    routes: [
      { route: 'Shanghai → LA', riskScore: 91 },
      { route: 'Mumbai → Hamburg', riskScore: 85 },
      { route: 'Rotterdam → NYC', riskScore: 78 },
      { route: 'Singapore → Hamburg', riskScore: 72 },
      { route: 'Busan → Seattle', riskScore: 65 },
    ],
    frequency: [
      { month: 'Mon', critical: 3, high: 5, medium: 8 },
      { month: 'Tue', critical: 4, high: 7, medium: 11 },
      { month: 'Wed', critical: 2, high: 6, medium: 9 },
      { month: 'Thu', critical: 5, high: 8, medium: 13 },
      { month: 'Fri', critical: 7, high: 10, medium: 16 },
      { month: 'Sat', critical: 3, high: 6, medium: 10 },
      { month: 'Sun', critical: 4, high: 7, medium: 12 },
    ],
    stats: [
      { label: 'Avg Daily Alerts', value: '18', change: '+22%', up: true },
      { label: 'Critical Incidents', value: '28', change: '+15%', up: true },
      { label: 'Routes Monitored', value: '124', change: '+2', up: true },
      { label: 'Avg Risk Score', value: '73', change: '+8pts', up: true },
    ],
  },
  '30D': {
    weekly: [
      { week: 'Feb W1', riskScore: 48, disruptions: 3 },
      { week: 'Feb W2', riskScore: 62, disruptions: 5 },
      { week: 'Feb W3', riskScore: 55, disruptions: 4 },
      { week: 'Feb W4', riskScore: 71, disruptions: 7 },
      { week: 'Mar W1', riskScore: 58, disruptions: 4 },
      { week: 'Mar W2', riskScore: 83, disruptions: 9 },
      { week: 'Mar W3', riskScore: 74, disruptions: 6 },
      { week: 'Mar W4', riskScore: 67, disruptions: 5 },
    ],
    routes: [
      { route: 'Shanghai → LA', riskScore: 88 },
      { route: 'Rotterdam → NYC', riskScore: 74 },
      { route: 'Singapore → Hamburg', riskScore: 69 },
      { route: 'Dubai → Mumbai', riskScore: 61 },
      { route: 'Tokyo → Seattle', riskScore: 54 },
    ],
    frequency: [
      { month: 'W1', critical: 4, high: 9, medium: 14 },
      { month: 'W2', critical: 6, high: 11, medium: 17 },
      { month: 'W3', critical: 3, high: 7, medium: 12 },
      { month: 'W4', critical: 8, high: 13, medium: 20 },
      { month: 'W5', critical: 5, high: 10, medium: 18 },
      { month: 'W6', critical: 11, high: 15, medium: 22 },
    ],
    stats: [
      { label: 'Avg Monthly Alerts', value: '46', change: '+12%', up: true },
      { label: 'Critical Incidents', value: '37', change: '+8%', up: true },
      { label: 'Routes Monitored', value: '124', change: '+5', up: true },
      { label: 'Avg Risk Score', value: '65', change: '-3pts', up: false },
    ],
  },
  '90D': {
    weekly: [
      { week: 'Jan', riskScore: 42, disruptions: 2 },
      { week: 'Feb W1', riskScore: 55, disruptions: 4 },
      { week: 'Feb W2', riskScore: 63, disruptions: 5 },
      { week: 'Feb W3', riskScore: 71, disruptions: 7 },
      { week: 'Mar W1', riskScore: 58, disruptions: 4 },
      { week: 'Mar W2', riskScore: 83, disruptions: 9 },
      { week: 'Mar W3', riskScore: 74, disruptions: 6 },
      { week: 'Mar W4', riskScore: 67, disruptions: 5 },
      { week: 'Apr Proj', riskScore: 72, disruptions: 7 },
    ],
    routes: [
      { route: 'Shanghai → LA', riskScore: 85 },
      { route: 'Red Sea Routes', riskScore: 80 },
      { route: 'Rotterdam → NYC', riskScore: 70 },
      { route: 'Colombo → Hamburg', riskScore: 64 },
      { route: 'Santos → Felixstowe', riskScore: 57 },
    ],
    frequency: [
      { month: 'Jan', critical: 3, high: 7, medium: 13 },
      { month: 'Feb', critical: 5, high: 10, medium: 18 },
      { month: 'Mar', critical: 11, high: 15, medium: 22 },
    ],
    stats: [
      { label: 'Avg Monthly Alerts', value: '52', change: '+18%', up: true },
      { label: 'Critical Incidents', value: '19', change: '+31%', up: true },
      { label: 'Routes Monitored', value: '124', change: '+11', up: true },
      { label: 'Avg Risk Score', value: '61', change: '+6pts', up: true },
    ],
  },
  '1Y': {
    weekly: [
      { week: 'Apr', riskScore: 38, disruptions: 2 },
      { week: 'May', riskScore: 45, disruptions: 3 },
      { week: 'Jun', riskScore: 52, disruptions: 4 },
      { week: 'Jul', riskScore: 61, disruptions: 5 },
      { week: 'Aug', riskScore: 56, disruptions: 4 },
      { week: 'Sep', riskScore: 49, disruptions: 3 },
      { week: 'Oct', riskScore: 58, disruptions: 5 },
      { week: 'Nov', riskScore: 71, disruptions: 7 },
      { week: 'Dec', riskScore: 63, disruptions: 5 },
      { week: 'Jan', riskScore: 55, disruptions: 4 },
      { week: 'Feb', riskScore: 68, disruptions: 6 },
      { week: 'Mar', riskScore: 74, disruptions: 7 },
    ],
    routes: [
      { route: 'Shanghai → LA', riskScore: 86 },
      { route: 'Red Sea / Suez', riskScore: 82 },
      { route: 'Rotterdam → NYC', riskScore: 68 },
      { route: 'Singapore → Hamburg', riskScore: 61 },
      { route: 'Mumbai → Colombo', riskScore: 53 },
    ],
    frequency: [
      { month: 'Q2 23', critical: 8, high: 14, medium: 22 },
      { month: 'Q3 23', critical: 6, high: 11, medium: 19 },
      { month: 'Q4 23', critical: 10, high: 17, medium: 26 },
      { month: 'Q1 24', critical: 13, high: 20, medium: 31 },
    ],
    stats: [
      { label: 'Total Alerts (YTD)', value: '548', change: '+34%', up: true },
      { label: 'Critical Incidents', value: '47', change: '+27%', up: true },
      { label: 'Routes Monitored', value: '124', change: '+28', up: true },
      { label: 'Avg Risk Score', value: '58', change: '+12pts', up: true },
    ],
  },
};

const ChartTooltipStyle = {
  backgroundColor: '#1a1f35',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8, fontSize: 12, color: '#f0f4ff',
};

type Range = '7D' | '30D' | '90D' | '1Y';

export default function ReportsPage() {
  const [range, setRange] = useState<Range>('30D');
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const d = DATA_BY_RANGE[range];

  const handleExportPDF = () => {
    setExporting(true);
    // Add print class to signal print CSS
    document.body.classList.add('printing-report');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-report');
      setExporting(false);
    }, 200);
  };

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .sidebar, .header, .no-print { display: none !important; }
          .main-content { margin: 0 !important; padding: 0 !important; }
          body { background: white !important; color: black !important; }
          .card { border: 1px solid #ddd !important; background: white !important; break-inside: avoid; }
          .card-title { color: #111 !important; }
        }
      `}</style>

      <div ref={printRef}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 2 }}>📄 Reports</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Generated: {new Date().toLocaleString()} · Range: {range}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }} className="no-print">
            {/* Time Range Filter */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 4, border: '1px solid var(--border-color)' }}>
              {(['7D', '30D', '90D', '1Y'] as Range[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    background: range === r ? 'var(--accent-cyan)' : 'transparent',
                    color: range === r ? '#000' : 'var(--text-muted)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '7px 16px', opacity: exporting ? 0.7 : 1 }}
            >
              {exporting ? '⏳ Preparing...' : '⬇ Export PDF'}
            </button>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          {d.stats.map(s => (
            <div key={s.label} className="card">
              <div className="card-body" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,var(--accent-cyan),var(--accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: s.up ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{s.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Risk Trend */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">📈 Weekly Risk Trend</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{range} period</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={d.weekly} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="disruptionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#5a6480' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5a6480' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={ChartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8b95b0' }} />
                <Area type="monotone" dataKey="riskScore" name="Risk Score" stroke="#00d4ff" strokeWidth={2} fill="url(#riskGradient)" dot={{ r: 3, fill: '#00d4ff' }} />
                <Area type="monotone" dataKey="disruptions" name="Disruptions" stroke="#ef4444" strokeWidth={2} fill="url(#disruptionGradient)" dot={{ r: 3, fill: '#ef4444' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Top At-Risk Routes */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🚢 Top 5 At-Risk Routes</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{range} period</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={d.routes} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#00d4ff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#5a6480' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="route" type="category" tick={{ fontSize: 11, fill: '#8b95b0' }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip contentStyle={ChartTooltipStyle} formatter={(v: number) => [`${v}`, 'Risk Score']} />
                  <Bar dataKey="riskScore" name="Risk Score" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alert Frequency */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🔔 Alert Frequency</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{range} breakdown</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={d.frequency} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5a6480' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#5a6480' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={ChartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#8b95b0' }} />
                  <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" />
                  <Bar dataKey="high" name="High" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="medium" name="Medium" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
