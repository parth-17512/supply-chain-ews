'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface WeatherPort {
  port: string;
  condition: string;
  temperature: number;
  windSpeed: number;
  severity: number;
}

interface CongestionPort {
  port: string;
  congestionLevel: number;
}

export default function LiveConditionsPanel() {
  const [data, setData] = useState<{
    weather: { ports: WeatherPort[] } | null;
    congestion: { ports: CongestionPort[] } | null;
    loading: boolean;
  }>({ weather: null, congestion: null, loading: true });

  useEffect(() => {
    async function fetchLive() {
      try {
        const [w, c] = await Promise.all([
          api.getLiveWeather(),
          api.getLiveCongestion()
        ]);
        setData({ weather: w, congestion: c, loading: false });
      } catch (err) {
        // Fallback demo data if backend offline
        setData({
          weather: { ports: [{ port: 'Shanghai', condition: 'Foggy', temperature: 18, windSpeed: 25, severity: 0.6 }, { port: 'Mumbai', condition: 'Rain', temperature: 28, windSpeed: 55, severity: 0.8 }] },
          congestion: { ports: [{ port: 'Shanghai', congestionLevel: 0.85 }, { port: 'Mumbai', congestionLevel: 0.6 }] },
          loading: false
        });
      }
    }
    fetchLive();
  }, []);

  if (data.loading) {
    return (
      <div className="card">
        <div className="card-header"><span className="card-title">🌍 Live Port Conditions</span></div>
        <div className="card-body" style={{ opacity: 0.5, fontSize: 13, padding: 16 }}>Loading live telemetry...</div>
      </div>
    );
  }

  // Merge weather and congestion by port
  const portsMap = new Map();
  if (data.weather?.ports) {
    data.weather.ports.forEach(p => portsMap.set(p.port, { weather: p }));
  }
  if (data.congestion?.ports) {
    data.congestion.ports.forEach(p => {
      const existing = portsMap.get(p.port) || {};
      portsMap.set(p.port, { ...existing, congestion: p });
    });
  }

  // Sort by highest combined severity/congestion and take top 4
  const combinedList = Array.from(portsMap.values()).map(p => {
    const wSev = p.weather?.severity || 0;
    const cSev = p.congestion?.congestionLevel || 0;
    return { ...p, score: wSev + cSev, port: p.weather?.port || p.congestion?.port };
  }).sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">🌍 Live Port Conditions</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top 4 At-Risk</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px' }}>
        {combinedList.map(item => {
          const w = item.weather;
          const c = item.congestion;
          const wColor = w?.severity >= 0.7 ? 'var(--danger)' : w?.severity >= 0.4 ? 'var(--warning)' : 'var(--success)';
          const cColor = c?.congestionLevel >= 0.7 ? 'var(--danger)' : c?.congestionLevel >= 0.4 ? 'var(--warning)' : 'var(--success)';
          
          return (
            <div key={item.port} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{item.port}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Score: {(item.score * 10).toFixed(1)}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                {/* Weather */}
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Weather</div>
                  {w ? (
                    <div style={{ color: wColor, fontWeight: 600 }}>
                      {w.condition} ({Math.round(w.windSpeed)} km/h)
                    </div>
                  ) : <div style={{ color: 'var(--text-muted)' }}>N/A</div>}
                </div>
                
                {/* Congestion */}
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Congestion</div>
                  {c ? (
                    <div style={{ color: cColor, fontWeight: 600 }}>
                      {Math.round(c.congestionLevel * 100)}% Capacity
                    </div>
                  ) : <div style={{ color: 'var(--text-muted)' }}>N/A</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
