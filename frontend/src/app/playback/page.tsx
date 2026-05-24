'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ── Generate a full 30-day dataset ─────────────────────────
function generatePlaybackData(startDays = 30) {
  const data = [];
  let risk = 50;
  const now = new Date();
  for (let i = startDays; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    risk = Math.max(10, Math.min(95, risk + (Math.random() * 18 - 9)));
    const predicted = Math.max(10, Math.min(95, risk + (Math.random() * 12 - 6)));
    data.push({ date: label, actualRisk: Math.round(risk), predictedRisk: Math.round(predicted), alerts: Math.round(Math.random() * 8) });
  }
  return data;
}

const FULL_DATA = generatePlaybackData(30);

const validationMetrics = [
  { label: 'Prediction Accuracy', value: '87.4%', status: 'good' },
  { label: 'False Positive Rate', value: '8.2%', status: 'good' },
  { label: 'Mean Absolute Error', value: '6.1 pts', status: 'warn' },
  { label: 'Alert Precision', value: '91.6%', status: 'good' },
];

const ChartTooltipStyle = {
  backgroundColor: '#1a1f35',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 8,
  fontSize: 12,
  color: '#f0f4ff',
};

// ─────────────────────────────────────────────────────────────
export default function PlaybackPage() {
  const [playHead, setPlayHead] = useState(0);   // index into FULL_DATA
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);         // 1×, 2×, 4×
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setPlayHead(p => {
          if (p >= FULL_DATA.length - 1) {
            setIsPlaying(false);
            return FULL_DATA.length - 1;
          }
          return p + 1;
        });
      }, 800 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, speed]);

  const visibleData = FULL_DATA.slice(0, playHead + 1);
  const current = FULL_DATA[playHead];
  const riskColor = current.actualRisk >= 70 ? 'var(--danger)' : current.actualRisk >= 45 ? 'var(--warning)' : 'var(--success)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20 }}>⏪ Historical Playback &amp; Validation</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed:</span>
          {[1, 2, 4].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '4px 10px', color: speed === s ? 'var(--accent-cyan)' : undefined, borderColor: speed === s ? 'var(--accent-cyan)' : undefined }}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">📅 Timeline — Last 30 Days</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {current.date} &nbsp;·&nbsp; Day {playHead + 1} of {FULL_DATA.length}
          </span>
        </div>
        <div className="card-body" style={{ paddingBottom: 8 }}>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={visibleData} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#5a6480' }} axisLine={false} tickLine={false}
                interval={Math.max(0, Math.floor(visibleData.length / 6) - 1)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#5a6480' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ChartTooltipStyle} />
              <ReferenceLine y={70} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" label={{ value: 'High', fill: '#ef4444', fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="predictedRisk" name="Predicted" stroke="#f59e0b" strokeWidth={1.5} fill="url(#predGrad)" strokeDasharray="5 3" dot={false} />
              <Area type="monotone" dataKey="actualRisk" name="Actual" stroke="#00d4ff" strokeWidth={2} fill="url(#actualGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* Scrubber */}
          <div style={{ padding: '8px 0 0' }}>
            <input type="range" min={0} max={FULL_DATA.length - 1} value={playHead}
              onChange={e => { setIsPlaying(false); setPlayHead(Number(e.target.value)); }}
              className="simulator-slider" style={{ width: '100%' }} />
          </div>

          {/* Play controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, justifyContent: 'center' }}>
            <button className="btn btn-ghost" style={{ fontSize: 14, padding: '6px 12px' }}
              onClick={() => { setIsPlaying(false); setPlayHead(0); }}>⏮</button>
            <button className="btn btn-ghost" style={{ fontSize: 14, padding: '6px 12px' }}
              onClick={() => setPlayHead(p => Math.max(0, p - 1))}>⏪</button>
            <button className="btn btn-primary" style={{ fontSize: 14, padding: '6px 20px', minWidth: 80 }}
              onClick={() => setIsPlaying(p => !p)}>
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 14, padding: '6px 12px' }}
              onClick={() => setPlayHead(p => Math.min(FULL_DATA.length - 1, p + 1))}>⏩</button>
            <button className="btn btn-ghost" style={{ fontSize: 14, padding: '6px 12px' }}
              onClick={() => { setIsPlaying(false); setPlayHead(FULL_DATA.length - 1); }}>⏭</button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Snapshot + Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Day Snapshot */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📸 Day Snapshot — {current.date}</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>ACTUAL RISK</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: riskColor, lineHeight: 1 }}>{current.actualRisk}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>out of 100</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>PREDICTED</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{current.predictedRisk}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>by model</div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>ALERTS FIRED</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: current.alerts >= 6 ? 'var(--danger)' : current.alerts >= 3 ? 'var(--warning)' : 'var(--success)' }}>{current.alerts}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>DELTA</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: Math.abs(current.actualRisk - current.predictedRisk) <= 5 ? 'var(--success)' : 'var(--warning)' }}>
                  {current.actualRisk > current.predictedRisk ? '+' : ''}{current.actualRisk - current.predictedRisk}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>ACCURACY</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
                  {Math.max(0, 100 - Math.abs(current.actualRisk - current.predictedRisk))}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Metrics */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">✅ Model Validation Metrics</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Full period</span>
          </div>
          <div className="card-body">
            {validationMetrics.map(m => (
              <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m.label}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: m.status === 'good' ? 'var(--success)' : 'var(--warning)' }}>{m.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>✅ Model Performing Well</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>All primary metrics within acceptable thresholds. Accuracy above 85% target.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
