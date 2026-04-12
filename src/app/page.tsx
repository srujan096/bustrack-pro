'use client';

import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
import { UserProfile } from '@/types';
import { Clock, Search, ArrowRight, CalendarDays, Route, Users, Sun, Moon, Info, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ArrowUp, Navigation, Wifi, Shield, CreditCard, ChevronLeft, ChevronRight, History, Cloud, CloudRain, CloudSun, Download, MapPin, MessageSquare, LayoutDashboard, Settings2, BarChart3 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';

// ============================================================
// Helper: Relative time
// ============================================================
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

// ============================================================
// Error Boundary (catches rendering crashes) — ENHANCED
// ============================================================
interface ErrorBoundaryProps { children: React.ReactNode; fallback?: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; errorId: string; countdown: number; }
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorId: '', countdown: 5 };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorId: `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, countdown: 5 };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info);
    // Start auto-retry countdown
    this.startCountdown();
  }
  componentWillUnmount() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
  }
  startCountdown = () => {
    this.setState({ countdown: 5 });
    this.countdownTimer = setInterval(() => {
      this.setState(prev => {
        if (prev.countdown <= 1) {
          if (this.countdownTimer) clearInterval(this.countdownTimer);
          this.handleRetry();
          return { countdown: 0 };
        }
        return { countdown: prev.countdown - 1 };
      });
    }, 1000);
  };
  handleRetry = () => {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.setState({ hasError: false, error: null, errorId: '', countdown: 5 });
  };
  handleExportLog = () => {
    const logData = {
      errorId: this.state.errorId,
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack || '',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-${this.state.errorId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Error Log Exported', description: `${a.download} saved successfully.` });
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center animate-error-icon">
              <XCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-1">An unexpected error occurred. Please try refreshing the page.</p>
            <p className="text-xs text-muted-foreground/60 mb-3 font-mono">Error ID: {this.state.errorId}</p>
            {/* Auto-retry countdown */}
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-5 font-medium animate-pulse">
              Retrying in {this.state.countdown}s...
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <button
                onClick={this.handleExportLog}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Error Log
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// Live Notification Ticker (WebSocket-powered)
// ============================================================
function NotificationTicker() {
  const [events, setEvents] = useState<{ id: number; type: string; message: string; severity: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const idRef = useRef(0);
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

  useEffect(() => {
    if (!wsUrl) return;

    const connect = () => {
      try {
        const ws = new WebSocket(`${wsUrl}/?XTransformPort=3005`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'connected' || data.type === 'pong') return;
            if (data.type && data.message) {
              const id = ++idRef.current;
              setEvents((prev) => {
                const updated = [...prev, { id, type: data.type, message: data.message, severity: data.severity || 'info' }];
                return updated.slice(-20);
              });
            }
          } catch { /* ignore parse errors */ }
        };

        ws.onclose = () => {
          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // silent failure
      }
    };
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [wsUrl]);

  const severityColors: Record<string, string> = {
    warning: 'text-amber-500',
    success: 'text-emerald-500',
    info: 'text-sky-500',
  };

  const typeIcons: Record<string, string> = {
    delay: '⚠',
    arrival: '🚌',
    departure: '🚀',
    crew_status: '👷',
    system: '⚡',
    weather: '🌤',
  };

  if (!wsUrl || events.length === 0) return null;

  // Duplicate events for seamless marquee loop
  const displayEvents = [...events, ...events];

  return (
    <div className="border-t border-b border-border/50 bg-muted/30 px-0 overflow-hidden">
      <div className="marquee-track py-1.5 gap-6">
        {displayEvents.map((e, i) => (
          <div
            key={`${e.id}-${i}`}
            className={`flex items-center gap-1.5 px-4 text-xs whitespace-nowrap ${severityColors[e.severity] || 'text-muted-foreground'}`}
          >
            <span className="text-sm">{typeIcons[e.type] || '📡'}</span>
            <span className="font-medium text-foreground/80">{e.message}</span>
            <span className="text-muted-foreground/50">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
// Login Page Component — ENHANCED
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

  const featureHighlights = [
    { icon: <Navigation className="w-4 h-4" />, label: 'Real-time Tracking' },
    { icon: <Clock className="w-4 h-4" />, label: 'Smart Scheduling' },
    { icon: <Shield className="w-4 h-4" />, label: 'Secure Payments' },
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

  const handleForgotPassword = () => {
    toast({
      title: 'Password Reset',
      description: 'Password reset link sent to your email!',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden animate-gradient-mesh-bg">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-mesh-blob-1" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-mesh-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-mesh-blob-1" />
        <div className="absolute top-10 left-1/4 w-60 h-60 bg-violet-500/8 rounded-full blur-3xl animate-mesh-blob-2" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-teal-500/6 rounded-full blur-3xl animate-mesh-blob-1" />
      </div>

      {/* Floating particles (CSS only) — enhanced with more particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-2 h-2 bg-blue-400/30 rounded-full animate-float-particle" style={{ top: '15%', left: '10%', animationDelay: '0s', animationDuration: '6s' }} />
        <div className="absolute w-1.5 h-1.5 bg-emerald-400/30 rounded-full animate-float-particle" style={{ top: '25%', right: '15%', animationDelay: '1s', animationDuration: '8s' }} />
        <div className="absolute w-2.5 h-2.5 bg-cyan-400/20 rounded-full animate-float-particle" style={{ bottom: '30%', left: '20%', animationDelay: '2s', animationDuration: '7s' }} />
        <div className="absolute w-1 h-1 bg-blue-300/40 rounded-full animate-float-particle" style={{ top: '60%', right: '25%', animationDelay: '0.5s', animationDuration: '9s' }} />
        <div className="absolute w-2 h-2 bg-emerald-300/25 rounded-full animate-float-particle" style={{ bottom: '15%', right: '10%', animationDelay: '1.5s', animationDuration: '6.5s' }} />
        <div className="absolute w-1.5 h-1.5 bg-sky-400/30 rounded-full animate-float-particle" style={{ top: '40%', left: '80%', animationDelay: '3s', animationDuration: '7.5s' }} />
        <div className="absolute w-1 h-1 bg-violet-400/25 rounded-full animate-float-particle" style={{ top: '80%', left: '30%', animationDelay: '4s', animationDuration: '10s' }} />
        <div className="absolute w-2 h-2 bg-teal-400/20 rounded-full animate-float-particle" style={{ top: '5%', left: '60%', animationDelay: '2.5s', animationDuration: '8.5s' }} />
        <div className="absolute w-1.5 h-1.5 bg-amber-400/15 rounded-full animate-float-particle" style={{ top: '70%', left: '5%', animationDelay: '3.5s', animationDuration: '7.2s' }} />
        <div className="absolute w-2.5 h-2.5 bg-blue-400/15 rounded-full animate-float-particle" style={{ top: '50%', right: '5%', animationDelay: '5s', animationDuration: '11s' }} />
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
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          25% { transform: translate(15px, -20px); opacity: 0.6; }
          50% { transform: translate(-10px, -35px); opacity: 0.4; }
          75% { transform: translate(20px, -15px); opacity: 0.7; }
        }
        @keyframes errorIcon {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes versionPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
        }
        @keyframes meshBlobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes meshBlobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(0.9); }
          66% { transform: translate(20px, -50px) scale(1.1); }
        }
        @keyframes gradientMeshBg {
          0% { background-position: 0% 50%; }
          25% { background-position: 50% 100%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 0%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px 1px currentColor; opacity: 1; }
          50% { box-shadow: 0 0 12px 3px currentColor; opacity: 0.7; }
        }
        .animate-route-dash-1 { animation: routeDash1 8s linear infinite; }
        .animate-route-dash-2 { animation: routeDash2 10s linear infinite; }
        .animate-route-dash-3 { animation: routeDash3 12s linear infinite; }
        .animate-bus-bounce { animation: busBounce 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulseSlow 3s ease-in-out infinite; }
        .animate-float-particle { animation: floatParticle 7s ease-in-out infinite; }
        .animate-error-icon { animation: errorIcon 0.5s ease-out forwards; }
        .animate-version-pulse { animation: versionPulse 3s ease-in-out infinite; }
        .animate-mesh-blob-1 { animation: meshBlobFloat1 15s ease-in-out infinite; }
        .animate-mesh-blob-2 { animation: meshBlobFloat2 18s ease-in-out infinite; }
        .animate-gradient-mesh-bg {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #0c4a6e 50%, #134e4a 75%, #1e293b 100%);
          background-size: 400% 400%;
          animation: gradientMeshBg 20s ease infinite;
        }
        .animate-glow-pulse { animation: glowPulse 2s ease-in-out infinite; }
      `}</style>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <BusIcon className="w-12 h-12 text-white" animate={true} />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">BusTrack Pro</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-version-pulse">
              v6.0
            </span>
          </div>
          <p className="text-slate-400 mt-2">Route &amp; Crew Management System</p>
        </div>

        {/* Login Card — glass-morphism */}
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
          {/* Glass highlight on top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
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
              {/* Forgot Password link */}
              <div className="text-right mt-1.5">
                <button type="button" onClick={handleForgotPassword} className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
                  Forgot Password?
                </button>
              </div>
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

            {/* Feature Highlights */}
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="grid grid-cols-3 gap-2">
                {featureHighlights.map((feat) => (
                  <div key={feat.label} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      {feat.icon}
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>
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
// Notification Bell — ENHANCED (grouped by type, confirm mark-all, empty SVG)
// ============================================================
function NotificationBell({ userId, token }: { userId: string; token: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    setFadingIds(prev => new Set(prev).add(id));
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id }),
    });
    setTimeout(() => {
      setFadingIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      fetchNotifications();
    }, 400);
  };

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead', userId }),
    });
    fetchNotifications();
    setShowMarkAllConfirm(false);
    toast({ title: 'All caught up!', description: 'All notifications marked as read.' });
  };

  const typeIcons: Record<string, React.ReactNode> = {
    info: <Info className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    success: <CheckCircle2 className="w-3.5 h-3.5" />,
    error: <XCircle className="w-3.5 h-3.5" />,
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  const typeBorderColors: Record<string, string> = {
    info: 'border-blue-200 dark:border-blue-800/40',
    warning: 'border-amber-200 dark:border-amber-800/40',
    success: 'border-emerald-200 dark:border-emerald-800/40',
    error: 'border-red-200 dark:border-red-800/40',
  };

  const typeBadgeColors: Record<string, string> = {
    info: 'bg-blue-500 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
  };

  // Group notifications by type
  const groupNotifications = (notifs: any[]) => {
    const groups: Record<string, any[]> = { info: [], warning: [], success: [], error: [] };
    notifs.forEach(n => {
      const t = n.type || 'info';
      if (groups[t]) groups[t].push(n);
      else groups.info.push(n);
    });
    return groups;
  };

  const grouped = groupNotifications(notifications);

  // Empty state SVG illustration (rendered inline to avoid component-during-render)
  const emptyNotificationsEl = (
    <div className="p-6 text-center">
      <svg className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" viewBox="0 0 64 64" fill="none">
        <path d="M32 8C20.954 8 12 16.954 12 28v10l-4 8h40l-4-8V28c0-11.046-8.954-20-20-20z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M24 50a8 8 0 0016 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="28" r="3" fill="currentColor" opacity="0.3" />
        <path d="M32 18v-2M42 24l1.5-1.5M22 24l-1.5-1.5M44 32h2M18 32h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      </svg>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You&apos;re all caught up!</p>
    </div>
  );

  return (
    <div className="relative" ref={bellRef}>
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
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && !showMarkAllConfirm && (
              <button onClick={() => setShowMarkAllConfirm(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                Mark all read
              </button>
            )}
            {showMarkAllConfirm && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 dark:text-amber-400">Confirm?</span>
                <button onClick={markAllRead} className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold">
                  Yes
                </button>
                <button onClick={() => setShowMarkAllConfirm(false)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                  No
                </button>
              </div>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto scroll-area-fade">
            {notifications.length === 0 ? (
              emptyNotificationsEl
            ) : (
              (['error', 'warning', 'info', 'success'] as const).map(type => {
                const group = grouped[type];
                if (!group || group.length === 0) return null;
                const unreadInGroup = group.filter(n => !n.isRead).length;
                return (
                  <div key={type}>
                    {/* Section header */}
                    <div className={`px-3 py-1.5 flex items-center justify-between border-b ${typeBorderColors[type]} bg-gray-50/50 dark:bg-gray-800/30`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded flex items-center justify-center ${typeColors[type]}`}>
                          {typeIcons[type]}
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          {type}
                        </span>
                      </div>
                      {unreadInGroup > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeBadgeColors[type]}`}>
                          {unreadInGroup}
                        </span>
                      )}
                    </div>
                    {/* Notification items */}
                    {group.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''} ${fadingIds.has(n.id) ? 'opacity-50 scale-[0.98]' : ''}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${typeColors[n.type] || typeColors.info}`}>
                            {typeIcons[n.type] || typeIcons.info}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                            {n.createdAt && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{relativeTime(n.createdAt)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
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
// Command Palette (Ctrl+K) — ENHANCED (category headers)
// ============================================================
function CommandPalette({
  isOpen,
  onClose,
  pages,
  currentPortal,
  onNavigate,
  recentPages,
  sections,
}: {
  isOpen: boolean;
  onClose: () => void;
  pages: { id: string; label: string; icon: string }[];
  currentPortal: string;
  onNavigate: (pageId: string) => void;
  recentPages: { id: string; label: string; icon: string }[];
  sections: { title: string; pages: { id: string; label: string; icon: string }[] }[];
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Section header icon map
  const sectionIconMap: Record<string, React.ReactNode> = {
    MAIN: <LayoutDashboard className="w-3 h-3" />,
    MANAGEMENT: <Users className="w-3 h-3" />,
    WORK: <Clock className="w-3 h-3" />,
    SETTINGS: <Settings2 className="w-3 h-3" />,
    LOGS: <BarChart3 className="w-3 h-3" />,
    'MY TRAVEL': <Route className="w-3 h-3" />,
    SUPPORT: <MessageSquare className="w-3 h-3" />,
  };

  // Filter sections and their pages based on query
  const filteredSections = query
    ? sections.map(s => ({
        ...s,
        pages: s.pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase())),
      })).filter(s => s.pages.length > 0)
    : sections;

  // Build flat list for keyboard navigation
  const flatPages = filteredSections.flatMap(s => s.pages);
  // Account for recently viewed items
  const recentOffset = !query && recentPages.length > 0 ? recentPages.length + 1 : 0;

  const filtered = query
    ? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
    : pages;

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
      // Keyboard navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const totalItems = query ? flatPages.length : flatPages.length + recentOffset;
        setSelectedIndex(i => Math.min(i + 1, totalItems - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        // Determine which item to navigate to based on selectedIndex
        if (!query && selectedIndex < recentOffset) {
          // In recent section
          if (selectedIndex > 0 && recentPages[selectedIndex - 1]) {
            onNavigate(recentPages[selectedIndex - 1].id);
            onClose();
          }
        } else {
          const adjustedIndex = query ? selectedIndex : selectedIndex - recentOffset;
          if (flatPages[adjustedIndex]) {
            onNavigate(flatPages[adjustedIndex].id);
            onClose();
          }
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, filtered, selectedIndex, onNavigate, flatPages, recentPages, query, recentOffset]);

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
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search pages..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Matching count */}
        {query && (
          <div className="px-5 py-2 text-[11px] text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
            {filtered.length} of {pages.length} pages match
          </div>
        )}

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No pages found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Recently Viewed section (only when no query) */}
              {!query && recentPages.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1.5">
                    <History className="w-3 h-3" />
                    Recently Viewed
                  </div>
                  {recentPages.map((page, idx) => (
                    <button
                      key={`recent-${page.id}`}
                      onClick={() => { onNavigate(page.id); onClose(); }}
                      onMouseEnter={() => setSelectedIndex(idx + 1)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        selectedIndex === idx + 1
                          ? 'bg-gray-900/8 dark:bg-gray-100/8 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-900/5 dark:hover:bg-gray-100/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={page.icon} />
                        </svg>
                      </div>
                      <span className="font-medium flex-1 text-left">{page.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                    </button>
                  ))}
                </>
              )}
              {/* Grouped by section with category headers */}
              {filteredSections.map(section => (
                <div key={section.title}>
                  <div className="px-3 py-1.5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-400 dark:text-gray-500">
                      {sectionIconMap[section.title.toUpperCase()] || sectionIconMap[section.title] || <LayoutDashboard className="w-3 h-3" />}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase flex-1">
                      {section.title}
                    </span>
                    <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    <span className="text-[9px] text-gray-400 dark:text-gray-600">{section.pages.length}</span>
                  </div>
                  {section.pages.map(page => {
                    // Calculate global index for selection highlighting
                    const sectionStartIndex = filteredSections
                      .slice(0, filteredSections.indexOf(section))
                      .reduce((acc, s) => acc + s.pages.length, 0);
                    const globalIndex = query
                      ? sectionStartIndex + section.pages.indexOf(page)
                      : recentOffset + sectionStartIndex + section.pages.indexOf(page);
                    return (
                      <button
                        key={page.id}
                        onClick={() => { onNavigate(page.id); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          selectedIndex === globalIndex
                            ? 'bg-gray-900/8 dark:bg-gray-100/8 text-gray-900 dark:text-white'
                            : currentPortal === page.id
                              ? 'bg-gray-900/5 dark:bg-gray-100/5 text-gray-900 dark:text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-900/5 dark:hover:bg-gray-100/5'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selectedIndex === globalIndex || currentPortal === page.id
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
                    );
                  })}
                </div>
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
// Role-based gradient dot color map
// ============================================================
const roleDotColors: Record<string, string> = {
  admin: 'bg-gradient-to-r from-red-500 to-orange-500 text-red-500',
  driver: 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-500',
  conductor: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-teal-500',
  customer: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-500',
};

// ============================================================
// Sidebar Section with Divider — ENHANCED (tooltips, collapsed, glow dot)
// ============================================================
function SidebarSection({ title, pages, portal, setPortal, configColor, collapsed, userRole }: {
  title: string;
  pages: { id: string; label: string; icon: string }[];
  portal: string;
  setPortal: (p: string) => void;
  configColor: string;
  collapsed?: boolean;
  userRole?: string;
}) {
  const [tooltipTarget, setTooltipTarget] = useState<string | null>(null);
  const dotColorClass = roleDotColors[userRole || 'customer'] || roleDotColors.customer;

  return (
    <div>
      {!collapsed && (
        <div className="px-3 pt-4 pb-1.5">
          <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
            {title}
          </span>
        </div>
      )}
      <div className="space-y-0.5">
        {pages.map(page => (
          <div key={page.id} className="relative">
            <button
              onClick={() => setPortal(page.id)}
              onMouseEnter={() => setTooltipTarget(page.id)}
              onMouseLeave={() => setTooltipTarget(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                portal === page.id
                  ? `bg-gradient-to-r ${configColor}/10 text-gray-900 dark:text-white shadow-sm`
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? page.label : undefined}
            >
              <svg className={`w-4 h-4 flex-shrink-0 ${portal === page.id ? 'text-gray-900 dark:text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={page.icon} />
              </svg>
              {!collapsed && (
                <>
                  {page.label}
                  {portal === page.id && (
                    <span className="ml-auto w-2 h-2 rounded-full animate-glow-pulse flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--tw-gradient-stops))', color: userRole === 'admin' ? '#ef4444' : userRole === 'driver' ? '#f59e0b' : userRole === 'conductor' ? '#14b8a6' : '#10b981' }} />
                  )}
                </>
              )}
              {collapsed && portal === page.id && (
                <span className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-glow-pulse flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--tw-gradient-stops))', color: userRole === 'admin' ? '#ef4444' : userRole === 'driver' ? '#f59e0b' : userRole === 'conductor' ? '#14b8a6' : '#10b981' }} />
              )}
            </button>
            {/* Tooltip on hover (desktop only) */}
            {collapsed && tooltipTarget === page.id && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 tooltip-accent whitespace-nowrap pointer-events-none">
                {page.label}
              </div>
            )}
          </div>
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
  const [loading, setLoading] = useState(false);
  const [portal, setPortal] = useState<string>('dashboard');

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

  // Enhanced Loading Screen with typewriter steps and bus animation
  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const handleFooterLink = (label: string) => {
    toast({ title: label, description: `${label} page coming soon!` });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col mesh-gradient">
      <ErrorBoundary>
        <AppShell
          user={user}
          token={token || ''}
          portal={portal}
          setPortal={setPortal}
          onLogout={handleLogout}
        />
        {/* Live Notification Ticker */}
        <NotificationTicker />
      </ErrorBoundary>
      {/* Enhanced Footer */}
      <footer className="bg-card border-t border-border flex-shrink-0 shadow-[0_-1px_3px_rgba(0,0,0,0.03)] relative">
        {/* Quick Links Row */}
        <div className="border-b border-border/50 px-4 py-2">
          <div className="portal-container flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
            <button
              onClick={() => toast({ title: 'Route Map', description: 'Opening Route Map...' })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              <MapPin className="w-3 h-3" />
              Route Map
            </button>
            <button
              onClick={() => toast({ title: 'Schedule', description: 'Opening Schedule...' })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              <CalendarDays className="w-3 h-3" />
              Schedule
            </button>
            <button
              onClick={() => toast({ title: 'Support', description: 'Opening Support Center...' })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              <HelpCircle className="w-3 h-3" />
              Support
            </button>
            <button
              onClick={() => toast({ title: 'Feedback', description: 'Opening Feedback form...' })}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors animated-underline"
            >
              <MessageSquare className="w-3 h-3" />
              Feedback
            </button>
          </div>
        </div>
        <div className="px-4 py-1.5 sm:py-2">
          <div className="portal-container flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <span>&copy; 2025 BusTrack Pro</span>
            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
            <span>v6.0.0</span>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">&bull;</span>
            <button onClick={() => handleFooterLink('Privacy Policy')} className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Privacy Policy</button>
            <button onClick={() => handleFooterLink('Terms of Service')} className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Terms of Service</button>
            <button onClick={() => handleFooterLink('Contact Us')} className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Contact Us</button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3" />
              <FooterDate />
            </span>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1.5 hidden sm:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">System Online</span>
            </span>
          </div>
        </div>
        </div>
        {/* Back to top button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute right-2 -top-8 w-7 h-7 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-md transition-all"
          aria-label="Back to top"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
}

// ============================================================
// Enhanced Loading Screen with segmented progress bar
// ============================================================
function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const steps = [
    { label: 'Connecting...', icon: '🔌' },
    { label: 'Loading routes...', icon: '🗺️' },
    { label: 'Fetching data...', icon: '📊' },
    { label: 'Ready!', icon: '✅' },
  ];

  useEffect(() => {
    const currentStep = steps[activeStep];
    let charIndex = 0;
    setDisplayText('');
    const typeInterval = setInterval(() => {
      charIndex++;
      setDisplayText(currentStep.label.substring(0, charIndex));
      if (charIndex >= currentStep.label.length) {
        clearInterval(typeInterval);
        setTimeout(() => {
          setActiveStep(i => (i + 1) % steps.length);
        }, 600);
      }
    }, 40);
    return () => clearInterval(typeInterval);
  }, [activeStep]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background mesh-gradient relative overflow-hidden">
      {/* Bus animation driving across */}
      <div className="absolute top-[15%] left-0 right-0 animate-bus-drive pointer-events-none">
        <BusIcon className="w-10 h-10 text-emerald-500/60" />
      </div>
      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BusIcon className="w-10 h-10 text-white" animate={true} />
          </div>
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 animate-pulse-glow" />
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">Loading BusTrack Pro</p>
          <p className="text-xs text-muted-foreground typing-cursor h-4 flex items-center justify-center gap-1.5">
            <span>{steps[activeStep].icon}</span>
            <span>{displayText}</span>
          </p>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-64">
          <div className="flex items-center gap-1">
            {steps.map((step, index) => (
              <div key={step.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex gap-1">
                  {/* Segment */}
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      index < activeStep
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                        : index === activeStep
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse'
                          : 'bg-muted'
                    }`}
                  />
                </div>
                <span className={`text-[9px] font-medium transition-colors duration-300 ${
                  index < activeStep
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : index === activeStep
                      ? 'text-foreground'
                      : 'text-muted-foreground/40'
                }`}>
                  {index < activeStep ? '✓' : step.label.replace('...', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes busDrive {
          0% { transform: translateX(-60px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 60px)); opacity: 0; }
        }
        .animate-bus-drive { animation: busDrive 8s linear infinite; }
      `}</style>
    </div>
  );
}

// ============================================================
// Weather Widget (deterministic, lg+ only)
// ============================================================
function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string; city: string; humidity: number } | null>(null);

  useEffect(() => {
    // Deterministic weather based on city seed
    const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai'];
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const cityIndex = dayOfYear % cities.length;
    const city = cities[cityIndex];
    // Deterministic temp: 25-38 range based on day
    const baseTemp = 25 + ((dayOfYear * 7 + cityIndex * 3) % 14);
    const conditions = [
      { name: 'Sunny', icon: Sun },
      { name: 'Partly Cloudy', icon: CloudSun },
      { name: 'Cloudy', icon: Cloud },
      { name: 'Rainy', icon: CloudRain },
    ];
    const conditionIndex = (dayOfYear + cityIndex * 2) % conditions.length;
    const condition = conditions[conditionIndex];
    const humidity = 40 + ((dayOfYear * 5 + cityIndex * 7) % 45);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeatherData({
      temp: baseTemp,
      condition: condition.name,
      city,
      humidity,
    });
  }, []);

  if (!weatherData) return null;

  const WeatherIcon = weatherData.condition === 'Sunny' ? Sun
    : weatherData.condition === 'Rainy' ? CloudRain
    : weatherData.condition === 'Partly Cloudy' ? CloudSun
    : Cloud;

  const handleClick = () => {
    toast({
      title: `Weather in ${weatherData.city}`,
      description: `${weatherData.condition}, ${weatherData.temp}°C | Humidity: ${weatherData.humidity}%`,
    });
  };

  return (
    <button
      onClick={handleClick}
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
      title={`Weather: ${weatherData.city} - ${weatherData.condition} ${weatherData.temp}°C`}
    >
      <WeatherIcon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
      <span className="text-xs font-medium">{weatherData.temp}°C</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden xl:inline">{weatherData.city}</span>
    </button>
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
// App Shell - Navigation + Content Layout — ENHANCED
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('busSidebarCollapsed') === 'true';
    }
    return false;
  });
  const [errorNotifs, setErrorNotifs] = useState<any[]>([]);
  const [showNotifBar, setShowNotifBar] = useState(true);
  const [recentPages, setRecentPages] = useState<{ id: string; label: string; icon: string }[]>([]);

  const openCommandPalette = useCallback(() => {
    setPaletteKey(k => k + 1);
    setCommandPaletteOpen(true);
  }, []);

  // Persist sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('busSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Fetch unresolved error notifications for critical bar
  useEffect(() => {
    const fetchErrorNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        const data = await res.json();
        const errors = (data.notifications || []).filter(
          (n: any) => n.type === 'error' && !n.isRead
        );
        setErrorNotifs(errors);
      } catch {
        // silent
      }
    };
    fetchErrorNotifs();
  }, [user.id]);

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

  // Wrap setPortal to also close mobile sidebar & track recent pages
  const handleSetPortal = useCallback((p: string) => {
    setPortal(p);
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, setPortal]);

  const handleNavigate = useCallback((pageId: string) => {
    handleSetPortal(pageId);
  }, [handleSetPortal]);

  const roleConfigMap: Record<string, { label: string; color: string; sections: { title: string; pages: { id: string; label: string; icon: string }[] }[] }> = {
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
            { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
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
        {
          title: 'LOGS',
          pages: [
            { id: 'fuelLog', label: 'Fuel Log', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
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
        {
          title: 'LOGS',
          pages: [
            { id: 'fuelLog', label: 'Fuel Log', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
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
        {
          title: 'Support',
          pages: [
            { id: 'support', label: 'Support', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
          ],
        },
      ],
    },
  };

  const config = roleConfigMap[user.role] || roleConfigMap.customer;
  const allPages = config.sections.flatMap(s => s.pages);
  const currentPageLabel = allPages.find(p => p.id === portal)?.label || 'Dashboard';

  // Track recent pages when portal changes
  useEffect(() => {
    if (!portal) return;
    const page = allPages.find(pg => pg.id === portal);
    if (page) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentPages(prev => {
        const filtered = prev.filter(rp => rp.id !== portal);
        return [page, ...filtered].slice(0, 3);
      });
    }
  }, [portal]);

  // Sidebar content (reused for both mobile and desktop)
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-800 ${sidebarCollapsed ? 'flex items-center justify-center' : ''}`}>
        {sidebarCollapsed ? (
          <div className={`w-9 h-9 bg-gradient-to-br ${config.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <svg className="w-5 h-5 text-white" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="12" width="48" height="32" rx="6" fill="currentColor" opacity="0.9" />
              <rect x="12" y="16" width="16" height="12" rx="2" fill="rgba(255,255,255,0.25)" />
              <circle cx="18" cy="46" r="5" fill="#1e293b" />
              <circle cx="18" cy="46" r="2.5" fill="#475569" />
              <circle cx="46" cy="46" r="5" fill="#1e293b" />
              <circle cx="46" cy="46" r="2.5" fill="#475569" />
            </svg>
          </div>
        ) : (
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
        )}
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
            collapsed={sidebarCollapsed}
            userRole={user.role}
          />
        ))}

        {/* Keyboard shortcut hint - clickable */}
        <div className={`mt-4 ${sidebarCollapsed ? 'px-1' : 'px-3'}`}>
          <button
            onClick={() => openCommandPalette()}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!sidebarCollapsed && (
              <>
                <span className="text-xs flex-1">Search pages...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-mono font-medium text-gray-400 dark:text-gray-500">⌘K</kbd>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Help button */}
      <div className={`px-2 pb-1 ${sidebarCollapsed ? '' : 'px-3'}`}>
        <button
          onClick={() => toast({ title: 'Help Center', description: 'Help center coming soon!' })}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-lg transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Help</span>}
        </button>
      </div>

      {/* User */}
      <div className={`p-3 border-t border-gray-200 dark:border-gray-800 ${sidebarCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 p-2">
            <div className={`w-8 h-8 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        {sidebarCollapsed ? (
          <div className="relative">
            <div className={`w-8 h-8 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {user.name.charAt(0)}
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        )}
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
        <aside className="fixed left-0 top-0 bottom-0 w-72 glass-sidebar z-50 shadow-2xl animate-sidebar-slide border-r border-white/5">
          {sidebarContent}
        </aside>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={`glass-sidebar flex-shrink-0 overflow-hidden border-r border-white/5 transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          {sidebarContent}
          {/* Collapse/expand toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-[4.5rem] -right-3 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm z-10"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </aside>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Critical notification bar */}
        {showNotifBar && errorNotifs.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">⚠ {errorNotifs.length} unread critical notification{errorNotifs.length !== 1 ? 's' : ''} — {errorNotifs[0].message}</span>
            </div>
            <button onClick={() => setShowNotifBar(false)} className="ml-3 flex-shrink-0 hover:bg-white/20 rounded px-1.5 py-0.5 transition-colors" aria-label="Dismiss">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Header */}
        <header className="h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 flex-shrink-0">
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
            <WeatherWidget />
            <ThemeToggle />
            <NotificationBell userId={user.id} token={token} />
            {/* Sign Out Button — always visible in header */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-800/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            {/* User avatar with online status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              {/* Online Status Indicator - pulsing green dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <div className="relative">
                <div className={`w-7 h-7 bg-gradient-to-br ${config.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                  {user.name.charAt(0)}
                </div>
                {/* Online dot on avatar */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
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
          onNavigate={handleNavigate}
          recentPages={recentPages}
          sections={config.sections}
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
