'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const mainNavItems = [
  { href: '/',           label: 'Dashboard',           icon: '📊' },
  { href: '/alerts',     label: 'Alert Center',         icon: '🚨' },
  { href: '/shipments',  label: 'Shipments',            icon: '📦' },
  { href: '/reports',    label: 'Reports',              icon: '📄' },
  { href: '/analytics',  label: 'Analytics',            icon: '📈' },
  { href: '/simulator',  label: 'Predictive Simulator', icon: '🔮' },
  { href: '/playback',   label: 'Historical Playback',  icon: '⏪' },
];

const systemNavItems = [
  { href: '/notifications', label: 'Notification Center', icon: '🔔' },
  { href: '/maintenance',   label: 'System Health',        icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [notifToggles, setNotifToggles] = useState({ email: false, sms: false, push: true });
  const { user } = useAuth();

  const toggle = (key: 'email' | 'sms' | 'push') =>
    setNotifToggles(prev => ({ ...prev, [key]: !prev[key] }));

  const NavLink = ({ href, label, icon, badge }: { href: string; label: string; icon: string; badge?: number }) => (
    <Link
      href={href}
      className={`nav-item ${pathname === href ? 'active' : ''}`}
      title={collapsed ? label : undefined}
      style={{ position: 'relative' }}
    >
      <span className="nav-icon">{icon}</span>
      <span className="sidebar-hide-collapsed">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="sidebar-hide-collapsed" style={{
          marginLeft: 'auto',
          background: 'var(--danger)',
          color: '#fff',
          fontSize: 10,
          fontWeight: 700,
          borderRadius: '10px',
          padding: '1px 6px',
          minWidth: 18,
          textAlign: 'center',
        }}>{badge > 99 ? '99+' : badge}</span>
      )}
    </Link>
  );

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon sidebar-hide-collapsed">🚨</div>
        <div className="logo-text sidebar-hide-collapsed">
          Supply Chain<br />Disruption EWS
        </div>
        <button
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {/* Main Navigation */}
        {mainNavItems.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        <div className="nav-divider" />

        {/* System Navigation */}
        <div className="sidebar-hide-collapsed" style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '4px 12px 6px', fontWeight: 600 }}>
          System
        </div>
        {systemNavItems.map(item => (
          <NavLink key={item.href} {...item} />
        ))}

        <div className="nav-divider" />

        {/* Notification Quick Toggles (sidebar only, not collapsed) */}
        <div className="sidebar-hide-collapsed">
          <div className="sidebar-section-label">Quick Notifications</div>
          {(['email', 'sms', 'push'] as const).map(key => (
            <div key={key} className="toggle-row">
              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <button
                className={`toggle-switch ${notifToggles[key] ? 'active' : ''}`}
                onClick={() => toggle(key)}
              />
            </div>
          ))}
        </div>

        {/* User role badge at bottom */}
        {user && !collapsed && (
          <div style={{
            marginTop: 'auto',
            padding: '10px 12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: user.role === 'Admin' ? 'rgba(0,212,255,0.15)' : 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              {user.role === 'Admin' ? '👑' : '📊'}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</div>
              <div style={{ fontSize: 10, color: user.role === 'Admin' ? 'var(--accent-cyan)' : 'var(--warning)', fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
