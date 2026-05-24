'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User { username: string; role: string; token: string; }

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ews_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('ews_user'); }
    }
    setIsLoading(false);
  }, []);

  // Guard: redirect to /login if not authenticated (except on auth pages)
  useEffect(() => {
    if (isLoading) return;
    const isAuthPage = pathname.startsWith('/login');
    if (!user && !isAuthPage) router.push('/login');
    if (user && isAuthPage) router.push('/');
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string) => {
    // Try backend; fall back to demo credentials if backend is offline
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const userData: User = { username: data.username, role: data.role, token: data.token };
        setUser(userData);
        localStorage.setItem('ews_user', JSON.stringify(userData));
        return;
      }
      if (res.status === 401) throw new Error('Invalid credentials');
    } catch (err: unknown) {
      // If it's a credentials error, rethrow
      if (err instanceof Error && err.message === 'Invalid credentials') throw err;
      // Otherwise backend is offline — use demo credentials
    }

    // Demo mode (backend offline): accept admin/admin123 or analyst/analyst123
    const DEMO_USERS: Record<string, User> = {
      'admin:admin123': { username: 'admin', role: 'Admin', token: 'demo-token' },
      'analyst:analyst123': { username: 'analyst', role: 'Analyst', token: 'demo-token' },
    };
    const demo = DEMO_USERS[`${username}:${password}`];
    if (demo) {
      setUser(demo);
      localStorage.setItem('ews_user', JSON.stringify(demo));
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ews_user');
    router.push('/login');
  };

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
