'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'analyst') => {
    setUsername(role);
    setPassword(role === 'admin' ? 'admin123' : 'analyst123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
        top: '-10%', left: '-5%', animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
        bottom: '-10%', right: '5%', animation: 'float 10s ease-in-out infinite reverse',
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 11px 14px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .login-input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 0 3px rgba(0,212,255,0.1);
        }
        .login-input::placeholder { color: var(--text-muted); }
        .demo-btn {
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255,255,255,0.03);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 12px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .demo-btn:hover { border-color: var(--accent-cyan); color: var(--accent-cyan); background: rgba(0,212,255,0.06); }
      `}</style>

      {/* Login Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'blur(20px)',
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 1px rgba(0,212,255,0.1)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 8px 24px rgba(0,212,255,0.25)',
          }}>🔗</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: 'var(--text-primary)' }}>
            Supply Chain EWS
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
            Early Warning System — Secure Access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Username
            </label>
            <input
              id="username"
              className="login-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 16,
              background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--danger)', fontSize: 13,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--border-color)' : 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
              color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(0,212,255,0.25)',
            }}>
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Demo Access
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="demo-btn" style={{ flex: 1 }} onClick={() => fillDemo('admin')}>
              👑 Admin
            </button>
            <button className="demo-btn" style={{ flex: 1 }} onClick={() => fillDemo('analyst')}>
              📊 Analyst
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Click a role to autofill credentials
          </div>
        </div>
      </div>
    </div>
  );
}
