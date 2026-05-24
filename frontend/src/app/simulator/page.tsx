'use client';

import { useState } from 'react';

const SliderWithTooltip = ({ label, value, onChange }: { label: string; value: number; onChange: (val: number) => void }) => {
  const percent = value * 100;

  return (
    <div className="simulator-control">
      <div className="simulator-label">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="slider-container" style={{ position: 'relative', marginTop: 8 }}>
        <input 
          type="range" min="0" max="100" value={Math.round(percent)}
          onChange={e => onChange(parseInt(e.target.value) / 100)}
          className="simulator-slider" 
        />
        <div 
          className="slider-tooltip"
          style={{ left: `calc(${percent}% + (${8 - percent * 0.16}px))` }}
        >
          {Math.round(percent)}%
        </div>
      </div>
    </div>
  );
};

export default function SimulatorPage() {
  const [params, setParams] = useState({
    portStatus: true,
    weatherSeverity: 0.2,
    strikeProbability: 0.0,
    congestionLevel: 0.3,
  });
  const [result, setResult] = useState<{
    simulatedRiskScore: number;
    confidence: number;
    breakdown: Record<string, number>;
    recommendation: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/whatif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        throw new Error('API error');
      }
    } catch {
      // Local fallback simulation
      const portFactor = params.portStatus ? 0 : 30;
      const weatherFactor = params.weatherSeverity * 20;
      const strikeFactor = params.strikeProbability * 25;
      const congestionFactor = params.congestionLevel * 15;
      const simulatedRisk = Math.min(100, Math.round(portFactor + weatherFactor + strikeFactor + congestionFactor + Math.random() * 10));
      setResult({
        simulatedRiskScore: simulatedRisk,
        confidence: Math.round((0.6 + Math.random() * 0.3) * 100),
        breakdown: { portClosure: Math.round(portFactor), weatherImpact: Math.round(weatherFactor), strikeRisk: Math.round(strikeFactor), congestion: Math.round(congestionFactor) },
        recommendation: simulatedRisk >= 80 ? 'HIGH RISK: Immediate rerouting recommended' : simulatedRisk >= 50 ? 'MODERATE RISK: Monitor closely' : 'LOW RISK: Continue as planned',
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) =>
    score >= 80 ? 'var(--danger)' : score >= 50 ? 'var(--warning)' : 'var(--success)';

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>🔮 Predictive &ldquo;What-If&rdquo; Simulator</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 13 }}>
        Simulate supply chain disruptions: toggle port closures, adjust weather severity, and see the predicted risk impact in real-time.
      </p>

      <div className="dashboard-grid">
        {/* Controls */}
        <div className="card widget-half">
          <div className="card-header">
            <span className="card-title">⚙️ Simulation Parameters</span>
          </div>
          <div className="card-body">
            <div className="simulator-control">
              <div className="simulator-label">
                <span>Port Status</span>
                <span style={{ color: params.portStatus ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {params.portStatus ? '✅ OPEN' : '❌ CLOSED'}
                </span>
              </div>
              <button
                className={`toggle-switch ${params.portStatus ? 'active' : ''}`}
                onClick={() => setParams(p => ({ ...p, portStatus: !p.portStatus }))}
                style={{ width: 50, height: 26 }}
              />
            </div>

            <SliderWithTooltip 
              label="Weather Severity" 
              value={params.weatherSeverity} 
              onChange={v => setParams(p => ({ ...p, weatherSeverity: v }))} 
            />

            <SliderWithTooltip 
              label="Strike Probability" 
              value={params.strikeProbability} 
              onChange={v => setParams(p => ({ ...p, strikeProbability: v }))} 
            />

            <SliderWithTooltip 
              label="Congestion Level" 
              value={params.congestionLevel} 
              onChange={v => setParams(p => ({ ...p, congestionLevel: v }))} 
            />

            <button className="btn btn-primary" onClick={simulate} disabled={loading}
              style={{ width: '100%', padding: '10px', marginTop: 12, fontSize: 14 }}>
              {loading ? '⏳ Simulating...' : '🚀 Run Simulation'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card widget-half">
          <div className="card-header">
            <span className="card-title">📊 Simulation Results</span>
          </div>
          <div className="card-body">
            {result ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 56, fontWeight: 800, color: getRiskColor(result.simulatedRiskScore) }}>
                    {result.simulatedRiskScore}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Simulated Risk Score</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Confidence: {result.confidence}%
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                  background: result.simulatedRiskScore >= 80 ? 'var(--danger-soft)' : result.simulatedRiskScore >= 50 ? 'var(--warning-soft)' : 'var(--success-soft)',
                  color: getRiskColor(result.simulatedRiskScore), fontSize: 13, fontWeight: 600
                }}>
                  {result.recommendation}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>RISK BREAKDOWN</div>
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <div key={key} className="health-metric" style={{ marginBottom: 10 }}>
                    <div className="health-metric-header">
                      <span className="health-metric-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="health-metric-value">{value}</span>
                    </div>
                    <div className="health-bar">
                      <div className="health-bar-fill" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
                <p>Adjust the parameters and click &ldquo;Run Simulation&rdquo; to see the predicted risk impact.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
