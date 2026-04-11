'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '@/types';
import { Clock, Search, ArrowRight, CalendarDays, Route, Users, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

// ============================================================
// Bus SVG Icon Component
// ============================================================
function BusIcon({ className = 'w-10 h-10', animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg className={`${className} ${animate ? 'animate-bus-bounce' : ''}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bus body */}
      <rect x="8" y="12" width="48" height="32" rx="6" fill="currentColor" opacity="0.9" />
      {/* Windshield */}
      <rect x="12" y="16" width="16" height="12" rx="2" fill="rgba(255,255,255,0.25)" />
      {/* Side windows */}
      <rect x="32" y="16" width="8" height="12" rx="1.5" fill="rgba(255,255,255,0.2)" />
      <rect x="44" y="16" width="8" height="12" rx="1.5" fill="rgba(255,255,255,0.2)" />
      {/* Door */}
      <rect x="28" y="28" width="8" height="14" rx="1" fill="rgba(255,255,255,0.15)" />
      {/* Door line */}
      <line x1="32" y1="28" x2="32" y2="42" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Wheels */}
      <circle cx="18" cy="46" r="5" fill="#1e293b" />
      <circle cx="18" cy="46" r="2.5" fill="#475569" />
      <circle cx="46" cy="46" r="5" fill="#1e293b" />
      <circle cx="46" cy="46" r="2.5" fill="#475569" />
      {/* Bottom stripe */}
      <rect x="8" y="38" width="48" height="3" rx="1" fill="rgba(255,255,255,0.12)" />
      {/* Headlights */}
      <circle cx="10" cy="22" r="2" fill="#fbbf24" />
      <circle cx="54" cy="22" r="2" fill="#ef4444" />
      {/* Roof detail */}
      <rect x="14" y="10" width="36" height="3" rx="1.5" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// ============================================================
// Login Page Component
// ============================================================
function LoginPage({ onLogin }: { onLogin: (user: UserProfile, token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('busRememberEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const quickLogins = [
    { label: 'Admin', email: 'admin@bus.com', color: 'bg-red-500 hover:bg-red-600' },
    { label: 'Driver', email: 'driver1@bus.com', color: 'bg-amber-500 hover:bg-amber-600' },
    { label: 'Conductor', email: 'conductor1@bus.com', color: 'bg-teal-500 hover:bg-teal-600' },
    { label: 'Customer', email: 'customer1@bus.com', color: 'bg-emerald-500 hover:bg-emerald-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Save or clear remembered email
    if (rememberMe) {
      localStorage.setItem('busRememberEmail', email);
    } else {
      localStorage.removeItem('busRememberEmail');
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      onLogin(data.user, data.token);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (loginEmail: string) => {
    setEmail(loginEmail);
    setPassword('password123');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail, password: 'password123' }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      onLogin(data.user, data.token);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Bus Route Background Animation */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Route 1 */}
        <path
          d="M0,300 Q200,200 400,300 Q600,400 800,250"
          stroke="#3b82f6"
          strokeWidth="2"
          fill="none"
          strokeDasharray="8 6"
          className="animate-route-dash-1"
          filter="url(#glow)"
        />
        {/* Route 2 */}
        <path
          d="M0,500 Q300,350 500,450 Q700,550 800,400"
          stroke="#10b981"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 8"
          className="animate-route-dash-2"
          filter="url(#glow)"
        />
        {/* Route 3 */}
        <path
          d="M0,150 Q150,250 350,150 Q550,50 800,180"
          stroke="#06b6d4"
          strokeWidth="2"
          fill="none"
          strokeDasharray="10 5"
          className="animate-route-dash-3"
          filter="url(#glow)"
        />
        {/* Route stops as dots */}
        {[
          [100, 250], [250, 260], [400, 300], [550, 320], [700, 270],
          [150, 450], [350, 400], [550, 480], [750, 420],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill="white" opacity="0.4" className="animate-pulse-slow" />
        ))}
      </svg>

      <style>{`
        @keyframes routeDash1 {
          to { stroke-dashoffset: -140; }
        }
        @keyframes routeDash2 {
          to { stroke-dashoffset: 140; }
        }
        @keyframes routeDash3 {
          to { stroke-dashoffset: -150; }
        }
        @keyframes busBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(-0.5deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-1px) rotate(0.5deg); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.2; r: 3; }
          50% { opacity: 0.6; r: 4; }
        }
        .animate-route-dash-1 { animation: routeDash1 8s linear infinite; }
        .animate-route-dash-2 { animation: routeDash2 10s linear infinite; }
        .animate-route-dash-3 { animation: routeDash3 12s linear infinite; }
        .animate-bus-bounce { animation: busBounce 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulseSlow 3s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <BusIcon className="w-12 h-12 text-white" animate={true} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">BusTrack Pro</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              v3.0
            </span>
          </div>
          <p className="text-slate-400 mt-2">Route &amp; Crew Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative w-4 h-4 rounded border transition-all flex-shrink-0 ${
                  rememberMe
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-500 hover:border-slate-400'
                }`}
                aria-label="Remember me"
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-slate-400 select-none cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                Remember me
              </span>
            </div>

            {/* Error with icon */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick Login */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm text-slate-400 mb-3 text-center">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {quickLogins.map(login => (
                <button
                  key={login.label}
                  onClick={() => handleQuickLogin(login.email)}
                  disabled={loading}
                  className={`px-4 py-2.5 ${login.color} text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 shadow-sm`}
                >
                  {login.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">Password: password123</p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          &copy; 2025 BusTrack Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Notification Bell
// ============================================================
function NotificationBell({ userId, token }: { userId: string; token: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, [userId]);

  useEffect(() => {
    const load = () => { fetchNotifications(); };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id }),
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead', userId }),
    });
    fetchNotifications();
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-amber-100 text-amber-800',
    success: 'bg-emerald-100 text-emerald-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 20).map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[n.type] || typeColors.info}`}>
                      {n.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Hamburger Menu Button (animated to X)
// ============================================================
function HamburgerButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative w-8 h-8 flex items-center justify-center"
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      <span className="sr-only">Toggle sidebar</span>
      <div className="flex flex-col gap-[5px]">
        <span
          className={`block h-[2px] w-5 bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-300 origin-center ${
            isOpen ? 'rotate-45 translate-y-[7px]' : ''
          }`}
        />
        <span
          className={`block h-[2px] w-5 bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-300 ${
            isOpen ? 'opacity-0 scale-x-0' : ''
          }`}
        />
        <span
          className={`block h-[2px] w-5 bg-gray-600 dark:bg-gray-400 rounded-full transition-all duration-300 origin-center ${
            isOpen ? '-rotate-45 -translate-y-[7px]' : ''
          }`}
        />
      </div>
    </button>
  );
}

// ============================================================
// Breadcrumb Component
// ============================================================
function Breadcrumbs({ currentPageLabel, roleName }: { currentPageLabel: string; roleName: string }) {
  return (
    <nav className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
      <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Home
      </span>
      <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="capitalize text-gray-400 dark:text-gray-500">{roleName}</span>
      <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="text-gray-700 dark:text-gray-200 font-medium">{currentPageLabel}</span>
    </nav>
  );
}

// ============================================================
// Footer Date (IST timezone)
// ============================================================
function FooterDate() {
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
      setDate(ist.toLocaleDateString('en-IN', options));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return <span>{date}</span>;
}

// ============================================================
// Live Clock (IST timezone)
// ============================================================
function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const h = ist.getHours().toString().padStart(2, '0');
      const m = ist.getMinutes().toString().padStart(2, '0');
      const s = ist.getSeconds().toString().padStart(2, '0');
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-1.5 text-gray-500 dark:text-gray-400 select-none">
      <Clock className="w-3.5 h-3.5" />
      <span className="font-mono text-xs tracking-wide tabular-nums">{time}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">IST</span>
    </div>
  );
}

// ============================================================
// Command Palette (Ctrl+K)
// ============================================================
function CommandPalette({
  isOpen,
  onClose,
  pages,
  currentPortal,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  pages: { id: string; label: string; icon: string }[];
  currentPortal: string;
  onNavigate: (pageId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount (parent forces remount via key when reopening)
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const filtered = query
    ? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : pages;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal - glass-morphism */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none"
          />\n          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No pages found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map(page => (
                <button
                  key={page.id}
                  onClick={() => { onNavigate(page.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    currentPortal === page.id
                      ? 'bg-gray-900/5 dark:bg-gray-100/5 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-900/5 dark:hover:bg-gray-100/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    currentPortal === page.id
                      ? 'bg-gray-900/10 dark:bg-gray-100/10'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={page.icon} />
                    </svg>
                  </div>
                  <span className="font-medium flex-1 text-left">{page.label}</span>
                  {currentPortal === page.id && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Current</span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono text-[10px]">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono text-[10px]">↵</kbd>
            Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-mono text-[10px]">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar Section with Divider
// ============================================================
function SidebarSection({ title, pages, portal, setPortal, configColor }: {
  title: string;
  pages: { id: string; label: string; icon: string }[];
  portal: string;
  setPortal: (p: string) => void;
  configColor: string;
}) {
  return (
    <div>
      <div className="px-3 pt-4 pb-1.5">
        <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setPortal(page.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              portal === page.id
                ? `bg-gradient-to-r ${configColor}/10 text-gray-900 dark:text-white shadow-sm`
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <svg className={`w-4 h-4 flex-shrink-0 ${portal === page.id ? 'text-gray-900 dark:text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={page.icon} />
            </svg>
            {page.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Main App Component
// ============================================================
export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [portal, setPortal] = useState<string>('dashboard');

  useEffect(() => {
    const init = () => {
      const savedToken = localStorage.getItem('busToken');
      const savedUser = localStorage.getItem('busUser');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogin = (loggedInUser: UserProfile, loginToken: string) => {
    setUser(loggedInUser);
    setToken(loginToken);
    localStorage.setItem('busToken', loginToken);
    localStorage.setItem('busUser', JSON.stringify(loggedInUser));
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', token }),
      });
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('busToken');
    localStorage.removeItem('busUser');
    setPortal('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading BusTrack Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <AppShell
        user={user}
        token={token || ''}
        portal={portal}
        setPortal={setPortal}
        onLogout={handleLogout}
      />
      {/* Enhanced Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>&copy; 2025 BusTrack Pro</span>
            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
            <span>v3.0.0</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" />
              <FooterDate />
            </span>
            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">System Online</span>
            </span>
            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Route className="w-3 h-3" />
              <span>115 Routes</span>
            </span>
            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>104 Crew</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Theme Toggle Button
// ============================================================
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"
      aria-label="Toggle theme"
      suppressHydrationWarning
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 transition-transform duration-300 group-hover:-rotate-12" />
      )}
    </button>
  );
}

// ============================================================
// App Shell - Navigation + Content Layout
// ============================================================
function AppShell({
  user,
  token,
  portal,
  setPortal,
  onLogout,
}: {
  user: UserProfile;
  token: string;
  portal: string;
  setPortal: (p: string) => void;
  onLogout: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [paletteKey, setPaletteKey] = useState(0);

  const openCommandPalette = useCallback(() => {
    setPaletteKey(k => k + 1);
    setCommandPaletteOpen(true);
  }, []);

  // Detect mobile with resize listener
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Command Palette keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
        if (!commandPaletteOpen) {
          setPaletteKey(k => k + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  // Wrap setPortal to also close mobile sidebar
  const handleSetPortal = useCallback((p: string) => {
    setPortal(p);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setPortal]);

  const roleConfig: Record<string, { label: string; color: string; sections: { title: string; pages: { id: string; label: string; icon: string }[] }[] }> = {
    admin: {
      label: 'Admin',
      color: 'from-red-500 to-orange-500',
      sections: [
        {
          title: 'Main',
          pages: [
            { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          ],
        },
        {
          title: 'Management',
          pages: [
            { id: 'routes', label: 'Routes', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'schedules', label: 'Schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'crew', label: 'Crew', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { id: 'traffic', label: 'Traffic', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
          ],
        },
        {
          title: 'Settings',
          pages: [
            { id: 'holidays', label: 'Holidays', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'maintenance', label: 'Maintenance', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          ],
        },
      ],
    },
    driver: {
      label: 'Driver',
      color: 'from-amber-500 to-orange-500',
      sections: [
        {
          title: 'Main',
          pages: [
            { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          ],
        },
        {
          title: 'Work',
          pages: [
            { id: 'assignments', label: 'My Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          ],
        },
        {
          title: 'Settings',
          pages: [
            { id: 'holidays', label: 'Leave Requests', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
            { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          ],
        },
      ],
    },
    conductor: {
      label: 'Conductor',
      color: 'from-teal-500 to-cyan-500',
      sections: [
        {
          title: 'Main',
          pages: [
            { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          ],
        },
        {
          title: 'Work',
          pages: [
            { id: 'assignments', label: 'My Assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
            { id: 'calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          ],
        },
        {
          title: 'Settings',
          pages: [
            { id: 'holidays', label: 'Leave Requests', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
            { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          ],
        },
      ],
    },
    customer: {
      label: 'Customer',
      color: 'from-emerald-500 to-teal-500',
      sections: [
        {
          title: 'Main',
          pages: [
            { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'search', label: 'Search Routes', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          ],
        },
        {
          title: 'My Travel',
          pages: [
            { id: 'map', label: 'Route Map', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
            { id: 'bookings', label: 'My Bookings', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
            { id: 'history', label: 'Journey History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ],
        },
      ],
    },
  };

  const config = roleConfig[user.role] || roleConfig.customer;
  const allPages = config.sections.flatMap(s => s.pages);
  const currentPageLabel = allPages.find(p => p.id === portal)?.label || 'Dashboard';

  // Sidebar content (reused for both mobile and desktop)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="12" width="48" height="32" rx="6" fill="currentColor" opacity="0.9" />
              <rect x="12" y="16" width="16" height="12" rx="2" fill="rgba(255,255,255,0.25)" />
              <rect x="32" y="16" width="8" height="12" rx="1.5" fill="rgba(255,255,255,0.2)" />
              <rect x="44" y="16" width="8" height="12" rx="1.5" fill="rgba(255,255,255,0.2)" />
              <circle cx="18" cy="46" r="5" fill="#1e293b" />
              <circle cx="18" cy="46" r="2.5" fill="#475569" />
              <circle cx="46" cy="46" r="5" fill="#1e293b" />
              <circle cx="46" cy="46" r="2.5" fill="#475569" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">BusTrack Pro</h2>
            <span className="text-xs text-gray-500">{config.label} Portal</span>
          </div>
        </div>
      </div>

      {/* Nav with sections */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {config.sections.map((section) => (
          <SidebarSection
            key={section.title}
            title={section.title}
            pages={section.pages}
            portal={portal}
            setPortal={handleSetPortal}
            configColor={config.color}
          />
        ))}

        {/* Keyboard shortcut hint - clickable */}
        <div className="mt-4 px-3">
          <button
            onClick={() => openCommandPalette()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs flex-1">Search pages...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-mono font-medium text-gray-400 dark:text-gray-500">⌘K</kbd>
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 p-2">
          <div className={`w-8 h-8 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          style={{ width: 'calc(100% - 1rem)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar (overlay) */}
      {isMobile && sidebarOpen && (
        <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 shadow-2xl animate-sidebar-slide">
          {sidebarContent}
        </aside>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden">
          {sidebarContent}
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <HamburgerButton
              isOpen={isMobile ? sidebarOpen : false}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            />
            <div className="hidden sm:block">
              <Breadcrumbs currentPageLabel={currentPageLabel} roleName={config.label} />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:hidden">
              {currentPageLabel}
            </h1>
            {/* Live Clock */}
            <LiveClock />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell userId={user.id} token={token} />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              {/* Online Status Indicator - pulsing green dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <div className={`w-6 h-6 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {user.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden sm:block">{user.role}</span>
            </div>
          </div>
        </header>

        {/* Command Palette */}
        <CommandPalette
          key={paletteKey}
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          pages={allPages}
          currentPortal={portal}
          onNavigate={handleSetPortal}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {user.role === 'admin' && <AdminPortal portal={portal} user={user} token={token} setPortal={setPortal} />}
          {(user.role === 'driver' || user.role === 'conductor') && <CrewPortal portal={portal} user={user} token={token} />}
          {user.role === 'customer' && <CustomerPortal portal={portal} user={user} token={token} setPortal={setPortal} />}
        </div>
      </main>

      <style>{`
        @keyframes sidebarSlide {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-sidebar-slide {
          animation: sidebarSlide 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Placeholder portal components - these will be replaced by subagents
// ============================================================
function AdminPortal({ portal, user, token, setPortal }: { portal: string; user: UserProfile; token: string; setPortal: (p: string) => void }) {
  return <AdminContent portal={portal} userId={user.id} token={token} setPortal={setPortal} />;
}

function CrewPortal({ portal, user, token }: { portal: string; user: UserProfile; token: string }) {
  return <CrewContent portal={portal} userId={user.id} token={token} />;
}

function CustomerPortal({ portal, user, token, setPortal }: { portal: string; user: UserProfile; token: string; setPortal: (p: string) => void }) {
  return <CustomerContent portal={portal} userId={user.id} token={token} setPortal={setPortal} />;
}

// ============================================================
// Dynamic import placeholder - will be filled by subagents
// ============================================================
import dynamic from 'next/dynamic';

const AdminContent = dynamic(() => import('@/components/admin/admin-content'), { ssr: false });
const CrewContent = dynamic(() => import('@/components/crew/crew-content'), { ssr: false });
const CustomerContent = dynamic(() => import('@/components/customer/customer-content'), { ssr: false });
