'use client';

import { useState, useEffect, Fragment } from 'react';

interface Shipment {
  shipmentId: string;
  origin: { name: string; country: string };
  destination: { name: string; country: string };
  carrier: string;
  mode: 'sea' | 'air' | 'rail' | 'road';
  status: 'in_transit' | 'delivered' | 'delayed' | 'at_risk' | 'cancelled';
  eta: string;
  delayHours: number;
  cargo: { cargoType: string; weight: number; value: number };
  riskScore: number;
}

const DEMO_SHIPMENTS: Shipment[] = [
  { shipmentId: 'SHP-2401', origin: { name: 'Shanghai', country: 'CN' }, destination: { name: 'Los Angeles', country: 'US' }, carrier: 'COSCO', mode: 'sea', status: 'at_risk', eta: new Date(Date.now() + 86400000 * 5).toISOString(), delayHours: 48, cargo: { cargoType: 'Electronics', weight: 12000, value: 2400000 }, riskScore: 94 },
  { shipmentId: 'SHP-2398', origin: { name: 'Mumbai', country: 'IN' }, destination: { name: 'Hamburg', country: 'DE' }, carrier: 'Maersk', mode: 'sea', status: 'delayed', eta: new Date(Date.now() + 86400000 * 8).toISOString(), delayHours: 72, cargo: { cargoType: 'Textiles', weight: 8500, value: 850000 }, riskScore: 88 },
  { shipmentId: 'SHP-2395', origin: { name: 'Santos', country: 'BR' }, destination: { name: 'Felixstowe', country: 'GB' }, carrier: 'MSC', mode: 'sea', status: 'delayed', eta: new Date(Date.now() + 86400000 * 12).toISOString(), delayHours: 96, cargo: { cargoType: 'Agricultural', weight: 20000, value: 600000 }, riskScore: 80 },
  { shipmentId: 'SHP-2391', origin: { name: 'Mumbai (JNPT)', country: 'IN' }, destination: { name: 'Colombo', country: 'LK' }, carrier: 'Evergreen', mode: 'sea', status: 'at_risk', eta: new Date(Date.now() + 86400000 * 2).toISOString(), delayHours: 24, cargo: { cargoType: 'Pharmaceuticals', weight: 3200, value: 1800000 }, riskScore: 76 },
  { shipmentId: 'SHP-2388', origin: { name: 'Port Said', country: 'EG' }, destination: { name: 'Piraeus', country: 'GR' }, carrier: 'CMA CGM', mode: 'sea', status: 'in_transit', eta: new Date(Date.now() + 86400000 * 1).toISOString(), delayHours: 0, cargo: { cargoType: 'Machinery', weight: 15000, value: 3200000 }, riskScore: 72 },
  { shipmentId: 'SHP-2382', origin: { name: 'Hamburg', country: 'DE' }, destination: { name: 'New York', country: 'US' }, carrier: 'Hapag-Lloyd', mode: 'sea', status: 'in_transit', eta: new Date(Date.now() + 86400000 * 6).toISOString(), delayHours: 0, cargo: { cargoType: 'Automotive', weight: 18000, value: 4100000 }, riskScore: 58 },
  { shipmentId: 'SHP-2378', origin: { name: 'Singapore', country: 'SG' }, destination: { name: 'Rotterdam', country: 'NL' }, carrier: 'Maersk', mode: 'sea', status: 'in_transit', eta: new Date(Date.now() + 86400000 * 14).toISOString(), delayHours: 0, cargo: { cargoType: 'Consumer Goods', weight: 9800, value: 1200000 }, riskScore: 42 },
  { shipmentId: 'SHP-2370', origin: { name: 'Rotterdam', country: 'NL' }, destination: { name: 'New York', country: 'US' }, carrier: 'MSC', mode: 'sea', status: 'delivered', eta: new Date(Date.now() - 86400000 * 2).toISOString(), delayHours: 18, cargo: { cargoType: 'Chemicals', weight: 11000, value: 950000 }, riskScore: 35 },
  { shipmentId: 'SHP-2365', origin: { name: 'Singapore', country: 'SG' }, destination: { name: 'Hamburg', country: 'DE' }, carrier: 'COSCO', mode: 'sea', status: 'delivered', eta: new Date(Date.now() - 86400000 * 5).toISOString(), delayHours: 0, cargo: { cargoType: 'Electronics', weight: 6500, value: 3800000 }, riskScore: 28 },
  { shipmentId: 'SHP-2360', origin: { name: 'Dubai', country: 'AE' }, destination: { name: 'Mumbai', country: 'IN' }, carrier: 'Emirates SkyCargo', mode: 'air', status: 'in_transit', eta: new Date(Date.now() + 86400000 * 0.5).toISOString(), delayHours: 0, cargo: { cargoType: 'Perishables', weight: 800, value: 620000 }, riskScore: 22 },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  at_risk:    { color: 'var(--danger)',      bg: 'var(--danger-soft)',      label: '⚠ At Risk',    icon: '🔴' },
  delayed:    { color: 'var(--warning)',     bg: 'var(--warning-soft)',     label: '⏳ Delayed',    icon: '🟠' },
  in_transit: { color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.1)',     label: '🚢 In Transit', icon: '🔵' },
  delivered:  { color: 'var(--success)',     bg: 'var(--success-soft)',     label: '✅ Delivered',  icon: '🟢' },
  cancelled:  { color: 'var(--text-muted)',  bg: 'var(--bg-card)',          label: '❌ Cancelled',  icon: '⚫' },
};
const DEFAULT_STA = { color: 'var(--text-muted)', bg: 'var(--bg-card)', label: 'Unknown', icon: '⚪' };

const MODE_ICONS: Record<string, string> = { sea: '🚢', air: '✈️', rail: '🚂', road: '🚛' };

type SortKey = 'riskScore' | 'eta' | 'delayHours' | 'shipmentId';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>(DEMO_SHIPMENTS);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/shipments');
        if (res.ok) {
          const data = await res.json();
          const items = data.shipments || data;
          if (items.length > 0) setShipments(items);
        }
      } catch { /* use demo */ }
      finally { setLoading(false); }
    };
    fetchShipments();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const filtered = shipments
    .filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search && !`${s.shipmentId} ${s.origin.name} ${s.destination.name} ${s.carrier}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortBy] as number | string;
      let vb = b[sortBy] as number | string;
      if (sortBy === 'eta') { va = new Date(va as string).getTime(); vb = new Date(vb as string).getTime(); }
      return sortDir === 'desc' ? (vb as number) - (va as number) : (va as number) - (vb as number);
    });

  const stats = {
    total: shipments.length,
    atRisk: shipments.filter(s => s.status === 'at_risk').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    avgRisk: Math.round(shipments.reduce((s, x) => s + x.riskScore, 0) / shipments.length),
  };

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <th onClick={() => handleSort(col)} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: sortBy === col ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
      {label} {sortBy === col ? (sortDir === 'desc' ? '↓' : '↑') : '⇅'}
    </th>
  );

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>📦 Shipments</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {loading ? 'Loading...' : `${stats.total} shipments tracked · ${stats.atRisk + stats.delayed} require attention`}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Shipments', value: stats.total, color: 'var(--accent-cyan)' },
          { label: 'At Risk', value: stats.atRisk, color: 'var(--danger)' },
          { label: 'Delayed', value: stats.delayed, color: 'var(--warning)' },
          { label: 'Avg Risk Score', value: stats.avgRisk, color: stats.avgRisk > 70 ? 'var(--danger)' : stats.avgRisk > 50 ? 'var(--warning)' : 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="card-body" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Search shipments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: 4, border: '1px solid var(--border-color)' }}>
          {['all', 'at_risk', 'delayed', 'in_transit', 'delivered'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: statusFilter === s ? 'var(--accent-cyan)' : 'transparent', color: statusFilter === s ? '#000' : 'var(--text-muted)', textTransform: s === 'all' ? 'none' : 'capitalize', whiteSpace: 'nowrap' }}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Shipment</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Route</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Carrier</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                <SortBtn col="eta" label="ETA" />
                <SortBtn col="delayHours" label="Delay" />
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cargo</th>
                <SortBtn col="riskScore" label="Risk" />
                <th style={{ padding: '10px 12px' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const sta = STATUS_CONFIG[s.status] ?? DEFAULT_STA;
                const isExpanded = expandedId === s.shipmentId;
                const riskColor = s.riskScore >= 70 ? 'var(--danger)' : s.riskScore >= 50 ? 'var(--warning)' : 'var(--success)';
                return (
                  <Fragment key={s.shipmentId}>
                    <tr
                      style={{ borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: isExpanded ? 'rgba(0,212,255,0.03)' : 'transparent', transition: 'background 0.15s' }}
                      onClick={() => setExpandedId(isExpanded ? null : s.shipmentId)}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: 12 }}>{s.shipmentId}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{MODE_ICONS[s.mode]} {s.mode}</div>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{s.origin.name} → {s.destination.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.origin.country} → {s.destination.country}</div>
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{s.carrier}</td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: sta.bg, color: sta.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{sta.label}</span>
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(s.eta).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 12px', fontSize: 12 }}>
                        {s.delayHours > 0
                          ? <span style={{ color: 'var(--warning)', fontWeight: 600 }}>+{s.delayHours}h</span>
                          : <span style={{ color: 'var(--success)' }}>On time</span>
                        }
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.cargo.cargoType}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.cargo.weight.toLocaleString()} kg · ${(s.cargo.value / 1000).toFixed(0)}K</div>
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: `${riskColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: riskColor }}>{s.riskScore}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: 12, color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${s.shipmentId}-detail`} style={{ background: 'rgba(0,0,0,0.15)' }}>
                        <td colSpan={9} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Cargo Details</div>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{s.cargo.cargoType}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.cargo.weight.toLocaleString()} kg</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>${s.cargo.value.toLocaleString()} value</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Transit Info</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ETA: {new Date(s.eta).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mode: {MODE_ICONS[s.mode]} {s.mode.charAt(0).toUpperCase() + s.mode.slice(1)}</div>
                              {s.delayHours > 0 && <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600 }}>Delayed by {s.delayHours} hours</div>}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Risk Assessment</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 10, background: `${riskColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 16, fontWeight: 800, color: riskColor }}>{s.riskScore}</span>
                                </div>
                                <div style={{ fontSize: 12, color: riskColor, fontWeight: 600 }}>
                                  {s.riskScore >= 80 ? 'Critical Risk' : s.riskScore >= 60 ? 'High Risk' : s.riskScore >= 40 ? 'Medium Risk' : 'Low Risk'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No shipments match your filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
