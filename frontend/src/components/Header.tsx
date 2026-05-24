'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [time, setTime] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'list' | 'split'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<Array<{ alertId: string; title: string; severity: string }>>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent alerts for bell dropdown
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/alerts?limit=5');
        if (res.ok) {
          const data = await res.json();
          setRecentAlerts((data.alerts || data).slice(0, 5));
        }
      } catch {
        // use demo if backend offline
        setRecentAlerts([
          { alertId: 'ALT-001', title: 'CRITICAL Risk: Shanghai → LA', severity: 'critical' },
          { alertId: 'ALT-002', title: 'HIGH Risk: Mumbai → Hamburg', severity: 'high' },
          { alertId: 'ALT-003', title: 'Strike warning at Rotterdam', severity: 'high' },
        ]);
      }
    };
    if (user) fetchAlerts();
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Dashboard view switcher — only active on dashboard, changes layout class on body
  const isDashboard = pathname === '/';
  const handleViewChange = (view: 'dashboard' | 'list' | 'split') => {
    setActiveView(view);
    // Communicate view to dashboard page via custom event
    window.dispatchEvent(new CustomEvent('dashboardViewChange', { detail: view }));
  };

  const roleColor = user?.role === 'Admin' ? 'var(--accent-cyan)' : 'var(--warning)';
  const severityColor = (s: string) =>
    s === 'critical' ? 'var(--danger)' : s === 'high' ? 'var(--warning)' : 'var(--accent-cyan)';

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Supply Chain Disruption Early Warning System</h1>
      </div>

      {/* View Switcher — only functional on dashboard */}
      <div className="header-center">
        <span className="header-label" style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>
          Dashboard View
        </span>
        {(['dashboard', 'list', 'split'] as const).map((view, i) => (
          <button
            key={view}
            className={`view-btn ${activeView === view ? 'active' : ''} ${!isDashboard ? 'view-btn-disabled' : ''}`}
            onClick={() => isDashboard && handleViewChange(view)}
            title={isDashboard ? `${view} view` : 'Only available on dashboard'}
            style={{ opacity: isDashboard ? 1 : 0.4, cursor: isDashboard ? 'pointer' : 'not-allowed' }}
          >
            {(['📊', '📋', '⊞'] as const)[i]}
          </button>
        ))}
      </div>

      <div className="header-right">
        {/* Notification Bell with Dropdown */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            className="view-btn"
            title="Recent Alerts"
            onClick={() => setBellOpen(o => !o)}
            style={{
              position: 'relative',
              background: bellOpen ? 'var(--bg-card)' : 'transparent',
              border: `1px solid ${bellOpen ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
            }}
          >
            🔔
            {recentAlerts.length > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--danger)', color: '#fff',
                fontSize: 9, fontWeight: 700, borderRadius: '50%',
                width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1,
              }}>
                {recentAlerts.length}
              </span>
            )}
          </button>

          {bellOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)', padding: 8, minWidth: 280, maxWidth: 320,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200,
              animation: 'slideUp 0.15s ease both',
            }}>
              <div style={{ padding: '6px 12px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>🚨 Recent Alerts</span>
              </div>
              {recentAlerts.map(alert => (
                <button
                  key={alert.alertId}
                  onClick={() => { setBellOpen(false); router.push('/'); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8,
                    transition: 'background 0.15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                    background: severityColor(alert.severity),
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>{alert.title}</span>
                </button>
              ))}
              <div style={{ padding: '8px 12px 4px', borderTop: '1px solid var(--border-color)', marginTop: 4 }}>
                <button
                  onClick={() => { setBellOpen(false); router.push('/'); }}
                  style={{
                    fontSize: 11, color: 'var(--accent-cyan)', background: 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  View all alerts on dashboard →
                </button>
              </div>
            </div>
          )}
        </div>

        <span className="header-datetime">🕐 {time}</span>

        {/* User Avatar + Dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            title="User menu"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: menuOpen ? 'var(--bg-card)' : 'transparent',
              border: `1px solid ${menuOpen ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)', padding: '4px 10px 4px 6px',
              cursor: 'pointer', fontSize: 12,
              transition: 'all 0.2s',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="var(--border-color)" strokeWidth="1.5" fill="var(--bg-card)" />
              <circle cx="14" cy="11" r="4" fill="var(--text-muted)" />
              <path d="M6 24c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="var(--text-muted)" />
            </svg>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.username || 'Guest'}</span>
            {user?.role && (
              <span style={{ fontSize: 10, color: roleColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {user.role}
              </span>
            )}
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)', padding: 8, minWidth: 200,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200,
              animation: 'slideUp 0.15s ease both',
            }}>
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.username}</div>
                <div style={{ fontSize: 11, color: roleColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{user?.role}</div>
                {user?.role === 'Analyst' && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    Read-only access. Contact admin to modify alerts.
                  </div>
                )}
              </div>
              <button
                id="logout-btn"
                onClick={() => { setMenuOpen(false); logout(); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-soft)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
