'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bus,
  Route,
  Users,
  AlertTriangle,
  Play,
  UserCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  TrendingUp,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Star,
  BarChart3,
  DollarSign,
  Timer,
  Navigation,
  Mail,
  Shield,
  MapPin,
  Zap,
  Settings2,
  Activity,
  Map as MapIcon,
  Phone,
  Server,
  Database,
  Wifi,
  X,
  ArrowUpRight,
  Trophy,
  Search,
  Inbox,
  Fuel,
  LayoutList,
  Gauge,
  GitMerge,
  ArrowRightLeft,
  TrendingDown,
  Compass,
  Bell,
  BellRing,
  Send,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Globe,
  Smartphone,
  Monitor,
  MessageSquare,
  Cloud,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Loader2,
  Info,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  portal: string;
  userId: string;
  token: string;
  setPortal: (p: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Toast system (using shadcn @/hooks/use-toast)                       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Helper: fetch wrapper                                              */
/* ------------------------------------------------------------------ */
async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

/* ------------------------------------------------------------------ */
/*  Helper: today string                                               */
/* ------------------------------------------------------------------ */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ------------------------------------------------------------------ */
/*  Skeleton helpers                                                   */
/* ------------------------------------------------------------------ */
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini Sparkline Component                                           */
/* ------------------------------------------------------------------ */
function MiniSparkline({ data, color = 'bg-emerald-400' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-6 mt-2">
      {data.map((v, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-sm ${color} transition-all duration-300`}
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Star rating component                                              */
/* ------------------------------------------------------------------ */
function StarRating({ rating }: { rating: number }) {
  const stars: React.ReactNode[] = [];
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(
        <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
      );
    } else if (i === full && hasHalf) {
      stars.push(
        <Star key={i} className="size-4 fill-amber-400/50 text-amber-400" />
      );
    } else {
      stars.push(
        <Star key={i} className="size-4 text-muted-foreground/30" />
      );
    }
  }
  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
}

/* ------------------------------------------------------------------ */
/*  Enhanced Empty State Component                                     */
/* ------------------------------------------------------------------ */
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="py-12 text-center text-muted-foreground">
      <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-muted animate-bounce">
        <Icon className="size-8 opacity-30" />
      </div>
      <p className="font-medium text-foreground/70">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Weekly Bar Chart Component (Recharts)                                */
/* ------------------------------------------------------------------ */

interface WeeklyBarData {
  day: string;
  routes: number;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="text-sm text-emerald-600">{val} routes completed</p>
      <p className="text-xs text-muted-foreground">{val}% completion</p>
    </div>
  );
};

const WeeklyBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
      {value}
    </text>
  );
};

function WeeklyBarChart() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const seed = 42;
  const data: WeeklyBarData[] = days.map((day, i) => ({
    day,
    routes: Math.round(40 + ((seed + i * 37) % 60)),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="weeklyBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
        />
        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted-foreground) / 0.05)' }} />
        <Bar dataKey="routes" fill="url(#weeklyBarGrad)" radius={[6, 6, 0, 0]} label={<WeeklyBarLabel />} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Stats Ribbon                                                 */
/* ------------------------------------------------------------------ */
function QuickStatsRibbon() {
  const [stats, setStats] = useState<Record<string, string>>({});
  useEffect(() => {
    apiFetch('/api/analytics').then((d: any) => {
      const dash = d?.dashboard as Record<string, number> | undefined;
      const summary = d?.summary as Record<string, number> | undefined;
      const avgCompletion = summary?.avgCompletionRate;
      setStats({
        totalRoutes: String(dash?.totalRoutes ?? '—'),
        activeSchedules: String(dash?.activeSchedules ?? '—'),
        crewAvailable: String(dash?.totalCrew ?? '—'),
        onTimeRate: avgCompletion ? `${(avgCompletion * 100).toFixed(1)}%` : '—',
      });
    }).catch(() => {});
  }, []);
  const pills = [
    { label: 'Total Routes', value: stats.totalRoutes ?? '…', icon: Route, color: 'text-emerald-600' },
    { label: 'Active Schedules', value: stats.activeSchedules ?? '…', icon: Calendar, color: 'text-amber-600' },
    { label: 'Crew Available', value: stats.crewAvailable ?? '…', icon: Users, color: 'text-violet-600' },
    { label: 'On-Time Rate', value: stats.onTimeRate ?? '…', icon: TrendingUp, color: 'text-sky-600' },
  ];
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {pills.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs">
            <p.icon className={`size-3.5 ${p.color}`} />
            <span className="text-muted-foreground">{p.label}:</span>
            <span className="font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
      <div className="h-0.5 mt-2 rounded-full overflow-hidden">
        <div className="h-full w-[30%] bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 bg-[length:200%_100%] animate-[gradientSlide_3s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Fleet Tracker — SVG animated concentric routes                 */
/* ------------------------------------------------------------------ */
function LiveFleetTracker() {
  const cx = 250, cy = 200;
  const routes = [
    { id: 'R-101', r: 50, color: '#10b981', status: 'on', buses: [{ dur: 25, off: 0 }, { dur: 32, off: 10 }] },
    { id: 'R-215', r: 80, color: '#3b82f6', status: 'on', buses: [{ dur: 22, off: 0 }, { dur: 28, off: 6 }, { dur: 35, off: 14 }] },
    { id: 'R-342', r: 110, color: '#f59e0b', status: 'delayed', buses: [{ dur: 30, off: 0 }] },
    { id: 'R-418', r: 140, color: '#8b5cf6', status: 'on', buses: [{ dur: 20, off: 0 }, { dur: 27, off: 4 }] },
    { id: 'R-523', r: 165, color: '#ef4444', status: 'delayed', buses: [{ dur: 28, off: 0 }] },
    { id: 'R-607', r: 185, color: '#06b6d4', status: 'done', buses: [] },
    { id: 'R-712', r: 205, color: '#ec4899', status: 'on', buses: [{ dur: 34, off: 0 }] },
  ];
  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bus className="size-5" /> Live Fleet Tracker
        </CardTitle>
        <CardDescription>Real-time bus positions across active routes</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 500 420" className="w-full h-auto">
          <defs>
            <radialGradient id="hubGlow"><stop offset="0%" stopColor="#10b981" stopOpacity="0.25" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></radialGradient>
            {routes.map((r) => (
              <linearGradient key={`g${r.id}`} id={`g${r.id}`}><stop offset="0%" stopColor={r.color} /><stop offset="100%" stopColor={r.color} stopOpacity="0.15" /></linearGradient>
            ))}
          </defs>
          <circle cx={cx} cy={cy} r="230" fill="url(#hubGlow)" />
          {routes.map((r) => (
            <circle key={r.id} cx={cx} cy={cy} r={r.r} fill="none" stroke={`url(#g${r.id})`} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.5" />
          ))}
          <circle cx={cx} cy={cy} r="16" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="6" fill="#10b981" opacity="0.9">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontWeight="bold">HUB</text>
          {routes.map((r) => r.buses.map((b, bi) => (
            <g key={`${r.id}-${bi}`}>
              <animateTransform attributeName="transform" type="rotate" from={`${b.off} ${cx} ${cy}`} to={`${360 + b.off} ${cx} ${cy}`} dur={`${b.dur}s`} repeatCount="indefinite" />
              <circle cx={cx + r.r} cy={cy} r="5" fill={r.color} />
              <circle cx={cx + r.r} cy={cy} r="10" fill={r.color} opacity="0.15">
                <animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          )))}
          {routes.map((r, i) => {
            const a = (i * 47) * Math.PI / 180;
            return <text key={`l${r.id}`} x={cx + (r.r + 12) * Math.cos(a)} y={cy + (r.r + 12) * Math.sin(a)} fill="#94a3b8" fontSize="7" fontWeight="600">{r.id}</text>;
          })}
        </svg>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-center text-xs">
          {[{ s: 'On Time', c: 'bg-emerald-500' }, { s: 'Delayed', c: 'bg-amber-500' }, { s: 'Completed', c: 'bg-sky-500' }].map((l) => (
            <div key={l.s} className="flex items-center gap-1"><div className={`size-2 rounded-full ${l.c}`} /><span className="text-muted-foreground">{l.s}</span></div>
          ))}
          <span className="text-muted-foreground/30">|</span>
          {routes.map((r) => (
            <div key={r.id} className="flex items-center gap-1"><div className="size-2 rounded-full" style={{ backgroundColor: r.color }} /><span className="text-muted-foreground">{r.id}</span></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Bus Map — SVG city grid with animated bus routes               */
/* ------------------------------------------------------------------ */
function LiveBusMap() {
  const busRoutes = [
    { route: 'R-101', path: 'M40,60 L120,60 L120,180 L280,180 L280,60 L360,60', color: '#10b981', status: 'moving', dur: '12s' },
    { route: 'R-215', path: 'M60,100 L160,100 L160,220 L320,220 L320,100 L400,100', color: '#10b981', status: 'moving', dur: '15s' },
    { route: 'R-342', path: 'M80,140 L240,140 L240,260 L160,260', color: '#f59e0b', status: 'delayed', dur: '18s' },
    { route: 'R-418', path: 'M100,40 L100,120 L300,120 L300,200 L420,200', color: '#10b981', status: 'moving', dur: '14s' },
    { route: 'R-523', path: 'M20,200 L140,200 L140,280 L340,280', color: '#ef4444', status: 'stopped', dur: '20s' },
    { route: 'R-607', path: 'M200,40 L200,100 L380,100 L380,240', color: '#10b981', status: 'moving', dur: '16s' },
    { route: 'R-712', path: 'M50,240 L180,240 L180,160 L350,160 L350,280 L420,280', color: '#f59e0b', status: 'delayed', dur: '13s' },
    { route: 'R-830', path: 'M140,40 L140,100 L260,100 L260,200 L420,200', color: '#ef4444', status: 'stopped', dur: '17s' },
  ];

  const statusColor = (s: string) => s === 'moving' ? '#10b981' : s === 'delayed' ? '#f59e0b' : '#ef4444';

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapIcon className="size-5" /> Live Bus Map
        </CardTitle>
        <CardDescription>City grid with real-time bus positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <svg viewBox="0 0 460 310" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <rect x="0" y="0" width="460" height="310" rx="8" fill="#0f172a" />

            {/* Grid streets */}
            {[60, 120, 180, 240, 300].map((y) => (
              <line key={`h${y}`} x1="20" y1={y} x2="440" y2={y} stroke="#1e293b" strokeWidth="1" />
            ))}
            {[80, 160, 240, 320, 400].map((x) => (
              <line key={`v${x}`} x1={x} y1="20" x2={x} y2="290" stroke="#1e293b" strokeWidth="1" />
            ))}

            {/* Main roads (wider) */}
            <line x1="20" y1="140" x2="440" y2="140" stroke="#334155" strokeWidth="3" />
            <line x1="20" y1="220" x2="440" y2="220" stroke="#334155" strokeWidth="3" />
            <line x1="160" y1="20" x2="160" y2="290" stroke="#334155" strokeWidth="3" />
            <line x1="300" y1="20" x2="300" y2="290" stroke="#334155" strokeWidth="3" />

            {/* Route paths */}
            {busRoutes.map((br) => (
              <path key={br.route} d={br.path} fill="none" stroke={br.color} strokeWidth="1.5" opacity="0.2" strokeDasharray="4 3" />
            ))}

            {/* Animated buses */}
            {busRoutes.map((br) => (
              <g key={`bus-${br.route}`}>
                <circle r="6" fill={statusColor(br.status)}>
                  <animateMotion dur={br.dur} repeatCount="indefinite" path={br.path} />
                </circle>
                <circle r="12" fill={statusColor(br.status)} opacity="0.15">
                  <animate attributeName="r" values="10;15;10" dur="1.5s" repeatCount="indefinite" />
                  <animateMotion dur={br.dur} repeatCount="indefinite" path={br.path} />
                </circle>
                <text fontSize="7" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">
                  <animateMotion dur={br.dur} repeatCount="indefinite" path={br.path} />
                  {br.route.replace('R-', '')}
                </text>
              </g>
            ))}

            {/* Intersection dots */}
            {[60, 120, 180, 240, 300].flatMap((y) =>
              [80, 160, 240, 320, 400].map((x) => ({ x, y }))
            ).map((pt, i) => (
              <circle key={`ix${i}`} cx={pt.x} cy={pt.y} r="2" fill="#334155" />
            ))}

            {/* Compass */}
            <g transform="translate(425, 30)">
              <circle r="14" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <text y="-3" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">N</text>
              <polygon points="0,2 -3,8 3,8" fill="#94a3b8" />
            </g>
          </svg>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center text-xs">
          {[{ s: 'Moving', c: '#10b981' }, { s: 'Stopped', c: '#ef4444' }, { s: 'Delayed', c: '#f59e0b' }].map((l) => (
            <div key={l.s} className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: l.c }} />
              <span className="text-muted-foreground">{l.s}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Route Performance Comparison Chart (horizontal bar)                */
/* ------------------------------------------------------------------ */
function RoutePerformanceChart() {
  const routes = ['BLR-001', 'MUM-012', 'DEL-005', 'BLR-025', 'CHN-008', 'HYD-003'];
  const metrics = [
    { label: 'On-Time %', key: 'onTime', color: '#10b981' },
    { label: 'Satisfaction', key: 'satisfaction', color: '#38bdf8' },
    { label: 'Revenue', key: 'revenue', color: '#f59e0b' },
  ];

  const seed = 42;
  const data = routes.map((route, ri) => ({
    route,
    onTime: 65 + ((seed + ri * 17) % 30),
    satisfaction: 60 + ((seed + ri * 23) % 35),
    revenue: 55 + ((seed + ri * 31) % 40),
  }));

  const W = 520;
  const rowH = 44;
  const padL = 72;
  const padR = 80;
  const padT = 8;
  const padB = 8;
  const H = padT + routes.length * rowH + padB;
  const barH = 10;
  const barGap = 3;
  const maxW = W - padL - padR;

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="size-5" /> Route Performance
        </CardTitle>
        <CardDescription>Comparing On-Time %, Customer Satisfaction, and Revenue across routes</CardDescription>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {data.map((d, ri) => {
            const groupY = padT + ri * rowH;
            return (
              <g key={d.route}>
                {/* Route label */}
                <text x={padL - 8} y={groupY + rowH / 2 + 4} textAnchor="end" className="fill-foreground text-[11px] font-semibold">
                  {d.route}
                </text>
                {/* Metric bars */}
                {metrics.map((m, mi) => {
                  const val = d[m.key as keyof typeof d] as number;
                  const barY = groupY + 4 + mi * (barH + barGap);
                  const barW = Math.max((val / 100) * maxW, 4);
                  const labelX = padL + barW + 6;
                  return (
                    <g key={m.key}>
                      <rect
                        x={padL}
                        y={barY}
                        width={barW}
                        height={barH}
                        rx="3"
                        fill={m.color}
                        opacity="0.85"
                        className="transition-all duration-500"
                      />
                      <text
                        x={labelX}
                        y={barY + barH / 2 + 3.5}
                        className="fill-muted-foreground text-[9px] font-medium"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}
                {/* Separator line */}
                {ri < routes.length - 1 && (
                  <line
                    x1={padL}
                    y1={padT + (ri + 1) * rowH - 2}
                    x2={W - padR}
                    y2={padT + (ri + 1) * rowH - 2}
                    stroke="currentColor"
                    className="text-muted/20"
                    strokeWidth="0.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex flex-wrap gap-4 mt-4 justify-center text-xs">
          {metrics.map((m) => (
            <div key={m.key} className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
              <span className="text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Maintenance Calendar View                                           */
/* ------------------------------------------------------------------ */
function MaintenanceCalendarView({ records }: { records: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Build map of dates with records
  const recordsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    records.forEach((r) => {
      let dateStr = '';
      if (r.serviceDate) dateStr = r.serviceDate.slice(0, 10);
      else if (r.nextServiceDate) dateStr = r.nextServiceDate.slice(0, 10);
      else if (r.date) dateStr = r.date.slice(0, 10);
      else if (r.createdAt) dateStr = r.createdAt.slice(0, 10);
      if (dateStr) {
        const existing = map.get(dateStr) ?? [];
        existing.push(r);
        map.set(dateStr, existing);
      }
    });
    return map;
  }, [records]);

  // Upcoming services count
  const upcomingCount = useMemo(() => {
    const now = new Date();
    let count = 0;
    records.forEach((r) => {
      const dateStr = r.nextServiceDate ?? r.serviceDate ?? r.date;
      if (dateStr) {
        const d = new Date(dateStr);
        if (d >= now) count++;
      }
    });
    return count;
  }, [records]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const getRecordsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return recordsByDate.get(dateStr) ?? [];
  };

  const selectedDayRecords = selectedDate ? getRecordsForDay(selectedDate.getDate()) : [];

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
  };

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="size-5" /> Maintenance Calendar
            </CardTitle>
            <CardDescription>Visual schedule of upcoming maintenance services</CardDescription>
          </div>
          {upcomingCount > 0 && (
            <Badge className="bg-rose-600 text-white">
              {upcomingCount} upcoming service{upcomingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="size-4 mr-1" /> Prev
          </Button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            Next <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map((dn) => (
            <div key={dn} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {dn}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} />;
            }
            const dayRecords = getRecordsForDay(day);
            const hasRecords = dayRecords.length > 0;
            const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month;
            const today = isToday(day);
            return (
              <button
                key={day}
                onClick={() => {
                  if (hasRecords) setSelectedDate(new Date(year, month, day));
                }}
                className={`relative flex flex-col items-center justify-center rounded-lg py-1.5 text-sm transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                    : today
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted'
                } ${!hasRecords ? 'opacity-60' : 'cursor-pointer'}`}
              >
                {day}
                {hasRecords && (
                  <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-red-500">
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Details */}
        {selectedDayRecords.length > 0 && selectedDate && (
          <div className="mt-4 space-y-2 animate-fade-in-up">
            <p className="text-xs font-semibold text-muted-foreground">
              Records for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {selectedDayRecords.map((r: any, i: number) => {
              const reg = r.busRegistration ?? r.registration ?? 'Unknown Bus';
              const type = r.serviceType ?? r.type ?? 'Service';
              const desc = r.description ?? r.notes ?? 'Scheduled maintenance';
              return (
                <div key={i} className="rounded-lg border p-3 flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 rounded-md bg-rose-100 dark:bg-rose-950/40 p-1.5">
                    <Wrench className="size-3.5 text-rose-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{reg}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                      {type}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Quick Actions Dashboard Widget                                */
/* ------------------------------------------------------------------ */
function AdminQuickActions() {
  const actions = [
    { title: 'Generate Schedules', icon: Calendar, description: 'Auto-create daily bus timetables', color: 'bg-emerald-500' },
    { title: 'Auto Assign Crew', icon: Users, description: 'Smart crew-to-route assignment', color: 'bg-sky-500' },
    { title: 'Create Alert', icon: AlertTriangle, description: 'Broadcast alerts to passengers', color: 'bg-amber-500' },
    { title: 'View Reports', icon: BarChart3, description: 'Analytics and performance insights', color: 'bg-violet-500' },
    { title: 'System Settings', icon: Settings2, description: 'Configure platform preferences', color: 'bg-gray-500' },
    { title: 'Export Data', icon: Download, description: 'Download reports and datasets', color: 'bg-teal-500' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="size-5" /> Quick Actions
        </CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action, i) => {
            const IconComp = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => toast({ title: 'Opening...', description: `Opening ${action.title}...` })}
                className="card-lift neon-card stagger-entry group rounded-xl border p-4 text-left transition-all hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`mb-3 inline-flex rounded-lg ${action.color} p-2.5 text-white shadow-sm`}>
                  <IconComp className="size-5" />
                </div>
                <p className="text-sm font-semibold">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Passenger Analytics — SVG area chart (24h timeline)                 */
/* ------------------------------------------------------------------ */
function PassengerAnalytics() {
  const seed = 42;
  const hourly = Array.from({ length: 24 }, (_, h) => {
    let v = 12 + ((seed + h * 17) % 18);
    if (h >= 7 && h <= 9) v += 50 - Math.abs(h - 8) * 18;
    if (h >= 17 && h <= 19) v += 45 - Math.abs(h - 18) * 18;
    if (h >= 22 || h <= 5) v = Math.max(3, v - 15);
    return Math.round(Math.min(v, 100));
  });
  const maxV = Math.max(...hourly, 1);
  const peakH = hourly.indexOf(Math.max(...hourly));
  const avgL = Math.round(hourly.reduce((a, b) => a + b, 0) / 24);
  const total = hourly.reduce((a, b) => a + b, 0);
  const W = 600, H = 170, pL = 32, pR = 8, pT = 8, pB = 22;
  const iW = W - pL - pR, iH = H - pT - pB, sX = iW / 23;
  const pts = hourly.map((v, i) => ({ x: pL + i * sX, y: pT + iH - (v / maxV) * iH }));
  const area = `M${pts[0].x},${pT + iH} ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${pT + iH} Z`;
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5" /> Passenger Analytics
        </CardTitle>
        <CardDescription>Hourly passenger flow — 24h timeline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ l: 'Peak Hour', v: `${peakH}:00`, c: 'text-amber-600' }, { l: 'Average Load', v: `${avgL}%`, c: 'text-sky-600' }, { l: 'Total Today', v: total.toLocaleString(), c: 'text-emerald-600' }].map((s) => (
            <div key={s.l} className="rounded-lg border p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
              <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.35" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.03" /></linearGradient></defs>
          {[0, 25, 50, 75, 100].map((v) => { const y = pT + iH - (v / maxV) * iH; return <g key={v}><line x1={pL} y1={y} x2={W - pR} y2={y} stroke="currentColor" className="text-muted/20" strokeWidth="0.5" /><text x={pL - 4} y={y + 3} textAnchor="end" className="fill-muted-foreground/50 text-[7px]">{v}</text></g>; })}
          <path d={area} fill="url(#areaFill)" />
          <path d={line} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={pts[peakH].x} cy={pts[peakH].y} r="4" fill="#f59e0b" />
          <circle cx={pts[peakH].x} cy={pts[peakH].y} r="8" fill="#f59e0b" opacity="0.15" />
          {hourly.map((_, i) => i % 3 === 0 && <text key={i} x={pL + i * sX} y={H - 5} textAnchor="middle" className="fill-muted-foreground/50 text-[7px]">{i}:00</text>)}
        </svg>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Route Performance Heatmap                                          */
/* ------------------------------------------------------------------ */
function RoutePerformanceHeatmap() {
  const routes = ['BLR-001', 'BLR-025', 'DEL-005', 'MUM-012', 'CHN-008', 'HYD-003', 'BLR-042', 'DEL-018'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const seed = 42;
  const val = (ri: number, di: number) => Math.round(50 + ((seed + ri * 13 + di * 7 + ri * di * 3) % 50));
  const clr = (v: number) => v >= 85 ? 'bg-emerald-500 text-white' : v >= 70 ? 'bg-amber-400 text-white' : 'bg-rose-500 text-white';
  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="size-5" /> Route Performance Heatmap
        </CardTitle>
        <CardDescription>Performance scores by route and day of week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1 mb-1"><div className="w-20 shrink-0" />{days.map((d) => <div key={d} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>)}</div>
            {routes.map((route, ri) => (
              <div key={route} className="flex gap-1 mb-1">
                <div className="w-20 shrink-0 flex items-center text-[11px] font-medium truncate">{route}</div>
                {days.map((_, di) => { const v = val(ri, di); return <div key={di} className={`flex-1 flex items-center justify-center rounded text-[11px] font-semibold min-h-[30px] ${clr(v)}`} title={`${route} ${days[di]}: ${v}%`}>{v}</div>; })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4 mt-4 justify-center text-xs">
          {[{ l: 'Good (≥85)', c: 'bg-emerald-500' }, { l: 'Moderate (70-84)', c: 'bg-amber-400' }, { l: 'Poor (<70)', c: 'bg-rose-500' }].map((i) => (
            <div key={i.l} className="flex items-center gap-1.5"><div className={`size-2.5 rounded ${i.c}`} /><span className="text-muted-foreground">{i.l}</span></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Fuel Cost Calculator                                               */
/* ------------------------------------------------------------------ */
function FuelCostCalculator() {
  const [distance, setDistance] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [mileage, setMileage] = useState('4.5');
  const d = parseFloat(distance) || 0;
  const p = parseFloat(fuelPrice) || 0;
  const m = parseFloat(mileage) || 1;
  const cost = d > 0 && p > 0 ? (d / m) * p : null;
  const fuelL = d > 0 && m > 0 ? d / m : null;
  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Fuel className="size-5" /> Fuel Cost Calculator
        </CardTitle>
        <CardDescription>Estimate fuel expenses for any route</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1"><Label className="text-xs">Distance (km)</Label><Input type="number" placeholder="e.g. 250" value={distance} onChange={(e) => setDistance(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Fuel Price (₹/L)</Label><Input type="number" placeholder="e.g. 105" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Mileage (km/L)</Label><Input type="number" placeholder="e.g. 4.5" value={mileage} onChange={(e) => setMileage(e.target.value)} /></div>
        </div>
        {cost !== null && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
              <p className="text-[10px] text-muted-foreground">Estimated Cost</p>
              <p className="text-xl font-bold text-emerald-600">₹{cost.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-l-4 border-l-sky-500 bg-sky-50/50 dark:bg-sky-950/20 p-3">
              <p className="text-[10px] text-muted-foreground">Fuel Required</p>
              <p className="text-xl font-bold text-sky-600">{fuelL?.toFixed(1)} L</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Today's Schedule Compact Table                                      */
/* ------------------------------------------------------------------ */
function TodayScheduleCompactTable() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/schedules?date=' + todayStr()).then((d: any) => {
      const list = Array.isArray(d) ? d : (d?.schedules ?? d?.data ?? []);
      setSchedules(list.slice(0, 8));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toAMPM = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case 'completed': return 'Done';
      case 'in_progress': return 'Active';
      case 'cancelled': return 'Cancelled';
      default: return 'Scheduled';
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50">
      <CardHeader className="pb-3 relative card-header-gradient">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="size-5" /> Today&apos;s Schedule
            </CardTitle>
            <CardDescription>Compact view of {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">{schedules.length} trips</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : schedules.length === 0 ? (
          <EmptyState icon={Calendar} title="No schedules today" description="Generate schedules to see today's trips here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Route</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Departure</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground hidden sm:table-cell">From → To</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Bus</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s: any, i: number) => (
                  <tr key={s.id || i} className="border-b border-border/30 even:bg-muted/30 hover:bg-muted/50 hover:-translate-y-px hover:shadow-sm transition-all table-row-lift">
                    <td className="py-2.5 px-2">
                      <span className="font-semibold text-foreground">{s.route?.routeNumber || '—'}</span>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground font-mono text-xs">
                      {toAMPM(s.departureTime)}
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground hidden sm:table-cell">
                      <span className="text-xs">{s.route?.startLocation || '—'} → {s.route?.endLocation || '—'}</span>
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground text-xs">
                      {s.route?.busRegistration || '—'}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Departure Board                                               */
/* ------------------------------------------------------------------ */
function DepartureBoard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setRefreshKey((k) => k + 1);
        setAnimating(false);
        setLastRefresh(Date.now());
      }, 500);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update "Xs ago" counter every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefresh) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefresh]);

  const now = new Date();
  const baseHour = now.getHours();
  const baseMin = now.getMinutes();

  const statusList = ['On Time', 'On Time', 'On Time', 'On Time', 'Departed', 'Departed', 'Delayed', 'Delayed', 'Cancelled'];
  const statusColors: Record<string, string> = {
    'On Time': 'text-emerald-400',
    'Departed': 'text-sky-400',
    'Delayed': 'text-amber-400',
    'Cancelled': 'text-rose-400',
  };
  const statusDotColors: Record<string, string> = {
    'On Time': 'bg-emerald-500',
    'Departed': 'bg-sky-500',
    'Delayed': 'bg-amber-500',
    'Cancelled': 'bg-rose-500',
  };

  const destinations = ['Majestic Bus Stand', 'Whitefield ITPL', 'Electronic City', 'Koramangala 4th Block', 'HSR Layout', 'Indiranagar 100ft Rd', 'Marathahalli Bridge', 'JP Nagar Phase 6', 'Hebbal Flyover', 'MG Road Metro'];
  const routeNums = ['BLR-101', 'BLR-215', 'BLR-342', 'BLR-418', 'MUM-012', 'DEL-005', 'CHN-008', 'BLR-523', 'HYD-003', 'BLR-712'];
  const gateNums = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2'];

  const departures = Array.from({ length: 10 }, (_, i) => {
    const seed = baseHour * 100 + baseMin + i * 7 + refreshKey;
    const timeOffset = (seed * 3) % 55;
    const hour = (baseHour + Math.floor((i + 1) * 0.8)) % 24;
    const minute = (baseMin + timeOffset) % 60;
    const statusIdx = (seed * 3 + i * 5) % statusList.length;
    return {
      route: routeNums[i % routeNums.length],
      destination: destinations[i % destinations.length],
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      platform: gateNums[i % gateNums.length],
      status: statusList[statusIdx],
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <div className="flex items-center justify-between">
          <CardTitle className="led-text text-lg tracking-wider">DEPARTURES</CardTitle>
          <div className="flex items-center gap-2">
            {/* LIVE pulsing red dot */}
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`rounded-lg bg-slate-900 dark:bg-slate-950 p-3 transition-opacity duration-500 ${animating ? 'opacity-50' : 'opacity-100'}`}>
          <div className="grid grid-cols-[1fr_1.3fr_auto_auto_auto] gap-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
            <span>Route</span>
            <span>Destination</span>
            <span className="text-center">Time</span>
            <span className="text-center">Gate</span>
            <span className="text-right">Status</span>
          </div>
          <div className="space-y-0.5">
            {departures.map((d, i) => (
              <div
                key={`${i}-${refreshKey}`}
                className={`grid grid-cols-[1fr_1.3fr_auto_auto_auto] gap-3 text-sm px-2 py-1.5 rounded transition-colors hover:bg-slate-800/70 ${
                  d.status === 'Delayed' ? 'animate-delayed-blink' : ''
                }`}
              >
                <span className="font-bold text-amber-400 font-mono text-xs">{d.route}</span>
                <span className="text-slate-300 truncate text-xs">{d.destination}</span>
                <span className="text-emerald-400 font-mono font-bold text-xs text-center tabular-nums">{d.time}</span>
                <span className="text-slate-400 font-mono text-xs text-center">{d.platform}</span>
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`size-2 rounded-full ${statusDotColors[d.status]} ${d.status === 'Delayed' ? 'animate-pulse' : ''}`} />
                  <span className={`text-[11px] font-semibold ${statusColors[d.status]}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-600">
              Updated {secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`} · Auto-refreshes every 30s
            </span>
            <span className="text-[10px] text-slate-600 font-mono tabular-nums">
              {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}:{String(now.getSeconds()).padStart(2, '0')} IST
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Crew Fatigue Monitor                                               */
/* ------------------------------------------------------------------ */
function CrewFatigueMonitor() {
  const crewData = [
    { name: 'Rajesh Kumar', role: 'Driver', seed: 1 },
    { name: 'Suresh Babu', role: 'Driver', seed: 2 },
    { name: 'Anitha Sharma', role: 'Conductor', seed: 3 },
    { name: 'Mohammed Irfan', role: 'Driver', seed: 4 },
    { name: 'Priya Nair', role: 'Conductor', seed: 5 },
    { name: 'Venkat Rao', role: 'Driver', seed: 6 },
  ];

  const getCrewHours = (seed: number) => {
    const hoursToday = 3 + ((seed * 7 + 3) % 9);
    const hoursWeek = 18 + ((seed * 11 + 5) % 32);
    const fatigueLevel = hoursToday < 6 ? 'Low' : hoursToday <= 8 ? 'Medium' : 'High';
    const weekAvg = hoursWeek / 5;
    const highRisk = weekAvg > 10;
    return { hoursToday, hoursWeek, fatigueLevel, weekAvg: Math.round(weekAvg * 10) / 10, highRisk };
  };

  const fatigueColors: Record<string, { bar: string; text: string; bg: string }> = {
    Low: { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/50' },
    Medium: { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/50' },
    High: { bar: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/50' },
  };

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="size-5" /> Crew Fatigue Monitor
        </CardTitle>
        <CardDescription>Real-time crew hours tracking and fatigue risk assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crewData.map((c) => {
            const data = getCrewHours(c.seed);
            const colors = fatigueColors[data.fatigueLevel];
            const progressPercent = Math.min((data.hoursToday / 12) * 100, 100);
            return (
              <div key={c.seed} className={`rounded-xl border p-4 transition-all hover:shadow-md ${colors.bg}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <Badge variant="outline" className={`text-[10px] mt-1 ${
                      c.role.toLowerCase() === 'driver'
                        ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300'
                    }`}>{c.role}</Badge>
                  </div>
                  {data.highRisk && (
                    <Badge className="bg-rose-600 text-white text-[10px] shrink-0">
                      <AlertTriangle className="size-3 mr-1" />
                      High Risk
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2">
                    <p className="text-[10px] text-muted-foreground">Today</p>
                    <p className={`text-lg font-bold ${colors.text}`}>{data.hoursToday}h</p>
                  </div>
                  <div className="rounded-lg bg-white/60 dark:bg-black/20 p-2">
                    <p className="text-[10px] text-muted-foreground">This Week</p>
                    <p className="text-lg font-bold text-foreground">{data.hoursWeek}h</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Hours / 12h limit</span>
                    <span className={`font-semibold ${colors.text}`}>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/40 dark:bg-black/20 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold ${colors.text}`}>Fatigue: {data.fatigueLevel}</span>
                    <span className="text-[10px] text-muted-foreground">Avg: {data.weekAvg}h/day</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Route Optimization Insights                                        */
/* ------------------------------------------------------------------ */
function OptimizationInsights() {
  const suggestions = [
    {
      id: 1,
      title: 'Merge Overlapping Routes 101 & 103',
      icon: GitMerge,
      impact: 'Save 12%',
      impactColor: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60',
      priority: 'High',
      priorityColor: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
      description: 'Routes BLR-101 and BLR-103 share 8 of 12 stops between Majestic and Koramangala. Merging could reduce fleet requirement by 3 buses during off-peak hours.',
    },
    {
      id: 2,
      title: 'Reduce Headway on Route 215 Peak Hours',
      icon: TrendingDown,
      impact: 'Reduce 3 buses',
      impactColor: 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60',
      priority: 'Medium',
      priorityColor: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
      description: 'Current 20-min frequency during 8-10 AM causes overcrowding. Reducing to 12-min headway would decrease average wait time by 40%.',
    },
    {
      id: 3,
      title: 'Add Express Variant on Route 342',
      icon: ArrowRightLeft,
      impact: 'Save 18 min',
      impactColor: 'text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/60',
      priority: 'Medium',
      priorityColor: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
      description: 'Long-distance commuters from Electronic City to Whitefield could benefit from a limited-stop express service, saving 18 minutes per trip.',
    },
    {
      id: 4,
      title: 'Redistribute Buses from Low-Demand Route 712',
      icon: Compass,
      impact: '+15% efficiency',
      impactColor: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60',
      priority: 'Low',
      priorityColor: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
      description: 'Route BLR-712 operates at 32% occupancy during non-peak. Reallocating 2 buses to Route 418 would improve overall fleet utilization.',
    },
    {
      id: 5,
      title: 'Implement Dynamic Scheduling for DEL Routes',
      icon: Zap,
      impact: 'Save 8%',
      impactColor: 'text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-950/60',
      priority: 'High',
      priorityColor: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
      description: 'Delhi routes experience high variance in demand. AI-driven dynamic scheduling could reduce idle time by 8% and improve on-time performance.',
    },
  ];

  const handleApply = (title: string) => {
    toast({ title: 'Success', description: `Optimization applied: ${title}` });
  };

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Compass className="size-5" /> Optimization Insights
        </CardTitle>
        <CardDescription>AI-powered route optimization suggestions based on ridership data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((s) => {
            const IconComp = s.icon;
            return (
              <div
                key={s.id}
                className="transit-card rounded-xl border p-4 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-lg bg-muted p-2">
                    <IconComp className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold truncate">{s.title}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className={s.priorityColor}>{s.priority}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${s.impactColor}`}>{s.impact}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{s.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleApply(s.title)}
                    >
                      <CheckCircle2 className="size-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Route Details Dialog                                               */
/* ================================================================== */
function RouteDetailsDialog({ route, open, onOpenChange }: { route: any; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!route) return null;
  const id = route.id ?? route._id;

  let stops: any[] = [];
  try {
    if (route.stopsJson) {
      stops = typeof route.stopsJson === 'string' ? JSON.parse(route.stopsJson) : route.stopsJson;
    } else if (route.stops) {
      stops = typeof route.stops === 'string' ? JSON.parse(route.stops) : route.stops;
    }
  } catch { /* ignore parse errors */ }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="size-5" />
            Route {route.routeNumber ?? id}
          </DialogTitle>
          <DialogDescription>Full route details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Route Number</p>
              <p className="font-semibold">{route.routeNumber ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">City</p>
              <p className="font-semibold">{route.city ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Start Location</p>
              <p className="font-semibold">{route.startLocation ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">End Location</p>
              <p className="font-semibold">{route.endLocation ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Distance</p>
              <p className="font-semibold">{route.distanceKm != null ? `${route.distanceKm} km` : '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-semibold">{route.durationMin != null ? `${route.durationMin} min` : '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Fare</p>
              <p className="font-semibold">{route.fare != null ? `₹${route.fare}` : '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Bus</p>
              <p className="font-semibold">{route.busRegistration ?? '—'}</p>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-2">Traffic Level</p>
            <TrafficLevelBadge level={route.trafficLevel} />
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-2">Auto-Schedule</p>
            <Badge variant={route.autoScheduleEnabled ? 'default' : 'outline'}>
              {route.autoScheduleEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {stops.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-2">Stops ({stops.length})</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {stops.map((stop: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="size-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span>{typeof stop === 'string' ? stop : stop.name ?? stop.stopName ?? JSON.stringify(stop)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(route.scheduleStartTime || route.scheduleEndTime || route.scheduleFrequency) && (
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-2">Schedule Configuration</p>
              <div className="space-y-1 text-sm">
                {route.scheduleStartTime && (
                  <p>Start Time: <span className="font-medium">{route.scheduleStartTime}</span></p>
                )}
                {route.scheduleEndTime && (
                  <p>End Time: <span className="font-medium">{route.scheduleEndTime}</span></p>
                )}
                {route.scheduleFrequency && (
                  <p>Frequency: <span className="font-medium">{route.scheduleFrequency} min</span></p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  Crew Details Dialog                                                */
/* ================================================================== */
function CrewDetailsDialog({ crew, open, onOpenChange }: { crew: any; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!crew) return null;
  const id = crew.id ?? crew._id;
  const profile = crew.profile ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            {profile.name ?? crew.name ?? 'Crew Member'}
          </DialogTitle>
          <DialogDescription>Full crew profile</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className="size-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {(profile.name ?? crew.name ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.name ?? crew.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="size-3.5" />
                {profile.email ?? '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Specialization</p>
              <Badge variant="outline" className={
                (crew.specialization ?? '').toLowerCase() === 'driver'
                  ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300'
                  : 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300'
              }>
                {crew.specialization ?? '—'}
              </Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Performance Rating</p>
              <div className="flex items-center gap-1.5">
                <StarRating rating={crew.performanceRating ?? 0} />
                <span className="text-sm font-medium ml-1">{crew.performanceRating?.toFixed(1) ?? '0.0'}</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">License Number</p>
              <p className="font-semibold text-sm">{profile.licenseNumber ?? crew.licenseNumber ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Experience</p>
              <p className="font-semibold text-sm">{crew.experienceYears != null ? `${crew.experienceYears} years` : (profile.experienceYears != null ? `${profile.experienceYears} years` : '—')}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Bus Number</p>
              <p className="font-semibold text-sm">{crew.busNumber ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Availability</p>
              <Badge variant="outline" className={
                (crew.availability ?? '').toLowerCase() === 'available'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
              }>
                {crew.availability ?? 'unknown'}
              </Badge>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Phone</p>
            <p className="font-semibold text-sm flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              {profile.phone ?? crew.phone ?? '—'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  Severity Badge helper                                              */
/* ================================================================== */
function SeverityBadge({ severity }: { severity?: string }) {
  const s = (severity ?? '').toLowerCase();
  const map: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    high: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
    critical: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200',
  };
  return (
    <Badge variant="outline" className={map[s] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}>
      {severity ?? 'unknown'}
    </Badge>
  );
}

function TrafficLevelBadge({ level }: { level?: string }) {
  const l = (level ?? '').toLowerCase();
  const map: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    high: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
  };
  return (
    <Badge variant="outline" className={map[l] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}>
      {level ?? 'unknown'}
    </Badge>
  );
}

function ScheduleStatusBadge({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase();
  const isActive = s === 'in_progress' || s === 'active';
  const map: Record<string, string> = {
    scheduled: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
  };
  return (
    <Badge variant="outline" className={`${map[s] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'} ${isActive ? 'animate-badge-pulse' : ''}`}>
      {status ?? 'unknown'}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  useCountUp hook — animates a number from 0 to target              */
/* ------------------------------------------------------------------ */
function useCountUp(target: number, duration = 1500, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || target === 0) {
      return;
    }
    const startTime = performance.now();
    const animate = (now: number) => {
      if (!mountedRef.current) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, enabled]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  AnimatedStatNumber — displays a number with count-up animation    */
/* ------------------------------------------------------------------ */
function AnimatedStatNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const animatedValue = useCountUp(value, duration, value > 0);
  return <>{animatedValue.toLocaleString()}</>;
}

/* ------------------------------------------------------------------ */
/*  Skeleton Table Rows with Shimmer                                   */
/* ------------------------------------------------------------------ */
function TableSkeletonShimmer({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  const colWidths = ['w-28', 'flex-1', 'w-20', 'w-16', 'w-24', 'w-20', 'w-20'];
  return (
    <div className="space-y-0 rounded-md border overflow-hidden">
      {/* Header shimmer */}
      <div className="flex gap-2 bg-muted/40 p-3">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={`h-${j}`} className={`${colWidths[j % colWidths.length]} skeleton-shimmer h-4 rounded`}>
            <span className="invisible">placeholder</span>
          </div>
        ))}
      </div>
      {/* Body shimmer rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-2 p-3 border-t ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`${colWidths[j % colWidths.length]} skeleton-shimmer h-4 rounded`}>
              <span className="invisible">placeholder</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table Footer: Row Count + View All                                 */
/* ------------------------------------------------------------------ */
function TableFooter({
  showing,
  total,
  viewAllAction,
}: {
  showing: number;
  total: number;
  viewAllAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{showing}</span> of{' '}
        <span className="font-semibold text-foreground">{total}</span> results
      </p>
      {viewAllAction && total > showing && (
        <button
          onClick={viewAllAction}
          className="animated-underline text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All →
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Timeline Component                                        */
/* ------------------------------------------------------------------ */
interface TimelineEvent {
  icon: React.ElementType;
  text: string;
  time: string;
  color: string;
  dotColor: 'green' | 'amber' | 'red' | 'blue';
  timestamp: Date;
}

function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups = useMemo(() => {
    const grouped: { label: string; items: TimelineEvent[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier', items: [] },
    ];
    events.forEach((event) => {
      if (event.timestamp >= today) {
        grouped[0].items.push(event);
      } else if (event.timestamp >= yesterday) {
        grouped[1].items.push(event);
      } else {
        grouped[2].items.push(event);
      }
    });
    return grouped.filter((g) => g.items.length > 0);
  }, [events]);

  const dotColorMap: Record<string, string> = {
    green: 'bg-emerald-500 shadow-emerald-500/40',
    amber: 'bg-amber-500 shadow-amber-500/40',
    red: 'bg-rose-500 shadow-rose-500/40',
    blue: 'bg-sky-500 shadow-sky-500/40',
  };

  let globalIndex = 0;

  return (
    <div className="relative">
      {/* Vertical gradient line */}
      {groups.length > 0 && (
        <div
          className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/40 via-amber-500/30 to-muted-foreground/20"
        />
      )}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 ml-10">
              {group.label}
            </p>
            <div className="space-y-3 stagger-entry">
              {group.items.map((event) => {
                globalIndex++;
                const idx = globalIndex;
                const IconComp = event.icon;
                return (
                  <div
                    key={idx}
                    className="animate-fade-in-up relative flex items-start gap-3 opacity-0"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    {/* Colored dot with glow */}
                    <div className="relative z-10 mt-1.5 shrink-0">
                      <div
                        className={`size-[9px] rounded-full ${dotColorMap[event.dotColor]} shadow-[0_0_8px] transition-all`}
                      />
                    </div>
                    {/* Icon + content */}
                    <div className="flex items-start gap-3 flex-1 min-w-0 bg-background rounded-lg p-2.5 transition-colors hover:bg-muted/40">
                      <div className={`mt-0.5 rounded-lg p-1.5 bg-muted ${event.color}`}>
                        <IconComp className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{event.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Live Activity Feed Component                                      */
/* ================================================================== */

interface FeedItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  action: string;
  description: string;
  timeAgo: string;
}

function LiveActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [fadeOut, setFadeOut] = useState(false);

  const generateFeedItems = useCallback((): FeedItem[] => {
    const now = Date.now();
    const daySeed = Math.floor(now / (24 * 60 * 60 * 1000));
    const seed = (daySeed * 17) % 100;
    const pseudo = (i: number) => ((seed * 31 + i * 47) % 100);

    const actions: Array<{ type: FeedItem['type']; action: string; description: string; timeAgo: string }> = [
      { type: 'success', action: 'Trip', description: 'Driver Rajesh completed Route BLR-101', timeAgo: '2 min ago' },
      { type: 'info', action: 'User', description: 'New registration: customer@bus.com', timeAgo: '5 min ago' },
      { type: 'warning', action: 'Schedule', description: 'Schedule updated for Route MUM-205', timeAgo: '8 min ago' },
      { type: 'success', action: 'Payment', description: '₹350 fare collected on Route DEL-112', timeAgo: '12 min ago' },
      { type: 'info', action: 'Crew', description: 'Conductor Priya assigned to Route CHN-302', timeAgo: '15 min ago' },
      { type: 'error', action: 'Alert', description: 'Traffic congestion reported on BLR-455', timeAgo: '22 min ago' },
      { type: 'success', action: 'Maint.', description: 'Bus KA-01-1234 servicing completed', timeAgo: '30 min ago' },
      { type: 'info', action: 'Route', description: 'Route InterCity-701 departed on time', timeAgo: '35 min ago' },
      { type: 'warning', action: 'System', description: 'GPS signal lost for Bus MH-02-5678', timeAgo: '42 min ago' },
      { type: 'success', action: 'Review', description: '4.8★ rating received from passenger', timeAgo: '50 min ago' },
    ];

    const seeded = actions.map((a, i) => ({ ...a, id: `feed-${pseudo(i)}` }));
    return seeded;
  }, []);

  useEffect(() => {
    setItems(generateFeedItems());
  }, [generateFeedItems]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        setItems((prev) => {
          const shuffled = [...prev];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          // Rotate one item to simulate new activity
          const rotated = [...shuffled.slice(1), shuffled[0]];
          return rotated;
        });
        setFadeOut(false);
      }, 500);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const colorMap: Record<FeedItem['type'], { border: string; bg: string; text: string }> = {
    success: { border: 'border-l-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
    warning: { border: 'border-l-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
    info: { border: 'border-l-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' },
    error: { border: 'border-l-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  };

  return (
    <Card>
      <CardHeader className="pb-3 relative card-header-gradient">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5" /> Live Activity Feed
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
        <CardDescription>Real-time system events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`max-h-96 overflow-y-auto space-y-1 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent' }}
        >
          {items.map((item) => {
            const colors = colorMap[item.type];
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 border-l-4 ${colors.border} rounded-r-md px-3 py-2.5 transition-colors hover:bg-muted/40`}
              >
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}>
                  {item.action.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  System Health Panel Component                                      */
/* ================================================================== */
function SystemHealthPanel({ lastSync }: { lastSync: string }) {
  const healthItems = [
    { icon: Wifi, label: 'API Status', value: 'Operational', status: 'healthy' },
    { icon: Database, label: 'Database', value: 'Connected', status: 'healthy' },
    { icon: Clock, label: 'Last Sync', value: lastSync || '—', status: 'neutral' },
    { icon: Users, label: 'Active Users', value: '23', status: 'healthy' },
    { icon: Server, label: 'Server Uptime', value: '99.7%', status: 'healthy' },
  ];

  return (
    <Card className="animate-fade-in-up backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50">
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="size-5 text-emerald-500" /> System Health
        </CardTitle>
        <CardDescription>Real-time service status monitoring</CardDescription>
        <div className="section-accent-line" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {healthItems.map((item, i) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-full border bg-muted/30 dark:bg-gray-800/60 px-4 py-2.5 transition-colors hover:bg-muted/50 dark:hover:bg-gray-700/50 animate-fade-in-up"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted dark:bg-gray-700 p-2 text-muted-foreground">
                  <item.icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                {item.status === 'healthy' && (
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  IST Clock Widget                                                   */
/* ================================================================== */
function ISTClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const istDateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const istTimeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });

  return (
    <Card className="animate-fade-in-up backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50" style={{ animationDelay: '100ms' }}>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="size-5 text-sky-500" /> IST Clock
        </CardTitle>
        <CardDescription>Indian Standard Time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground font-medium">{istDateString}</p>
          <p className="mt-3 text-5xl font-bold tracking-widest font-mono tabular-nums text-foreground dark:text-white">
            {istTimeString}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-medium">
              IST (UTC+5:30)
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Recent Activity Feed Widget                                        */
/* ================================================================== */
function RecentActivityFeedWidget() {
  const now = new Date();
  const daySeed = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const seed = (daySeed * 17) % 100;

  const activities = [
    {
      label: 'Login',
      description: 'Admin session started from 192.168.1.100',
      timeAgo: '2 min ago',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      dotColor: 'bg-emerald-500',
      icon: UserCheck,
    },
    {
      label: 'Schedule',
      description: `New schedule created for Route BLR-${100 + (seed % 20)}`,
      timeAgo: '15 min ago',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      dotColor: 'bg-blue-500',
      icon: Calendar,
    },
    {
      label: 'Alert',
      description: `Traffic alert posted on Route MUM-${200 + ((seed + 3) % 30)}`,
      timeAgo: '28 min ago',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      dotColor: 'bg-amber-500',
      icon: AlertTriangle,
    },
    {
      label: 'Crew',
      description: `Crew auto-assignment completed for ${10 + (seed % 8)} routes`,
      timeAgo: '45 min ago',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      dotColor: 'bg-emerald-500',
      icon: Users,
    },
    {
      label: 'Error',
      description: `GPS sync failed for Bus KA-01-${5000 + (seed % 999)}`,
      timeAgo: '1 hour ago',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      dotColor: 'bg-rose-500',
      icon: XCircle,
    },
    {
      label: 'System',
      description: 'Daily analytics report generated successfully',
      timeAgo: '2 hours ago',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      dotColor: 'bg-blue-500',
      icon: BarChart3,
    },
  ];

  return (
    <Card className="animate-fade-in-up backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50" style={{ animationDelay: '200ms' }}>
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="size-5 text-violet-500" /> Recent Activity
        </CardTitle>
        <CardDescription>Latest system events and actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent' }}>
          {activities.map((item, i) => {
            const IconComp = item.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-muted/40 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${250 + i * 60}ms` }}
              >
                <div className="shrink-0 rounded-lg bg-muted dark:bg-gray-800 p-2 text-muted-foreground">
                  <IconComp className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.badgeColor}`}>
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{item.timeAgo}</span>
                  </div>
                  <p className="text-sm mt-0.5 truncate">{item.description}</p>
                </div>
                <div className={`size-2.5 rounded-full shrink-0 ${item.dotColor}`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Passenger Feedback Widget                                          */
/* ================================================================== */
function PassengerFeedbackWidget() {
  const now = new Date();
  const daySeed = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const seed = (daySeed * 23) % 100;

  const names = ['Priya S.', 'Rajesh K.', 'Anita M.', 'Vikram P.', 'Sneha R.'];
  const routePrefixes = ['BLR', 'MUM', 'DEL', 'CHN', 'HYD'];
  const comments = [
    'Very clean bus and punctual service. AC worked perfectly throughout the journey.',
    'Bus was delayed by 15 minutes. No announcement was made at the stop.',
    'Comfortable seats and smooth ride. Driver was very professional.',
    'Ticket counter was crowded. Took 20 minutes just to buy a ticket.',
    'Great WiFi on board! Could work during my commute. Will use again.',
  ];
  const times = ['10 min ago', '25 min ago', '1 hour ago', '2 hours ago', '3 hours ago'];

  const feedbackItems = names.map((name, i) => {
    const route = `${routePrefixes[(seed + i * 3) % 5]}-${100 + ((seed + i * 7) % 20)}`;
    const rating = 3 + ((seed + i * 11) % 3); // 3-5
    const comment = comments[(seed + i) % comments.length];
    const time = times[i];
    return { name, route, rating, comment, time };
  });

  const avgRating = (feedbackItems.reduce((sum, f) => sum + f.rating, 0) / feedbackItems.length).toFixed(1);

  const getSentimentColor = (rating: number) => {
    if (rating >= 4) return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
    if (rating >= 3) return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
    return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
  };

  return (
    <Card className="animate-fade-in-up backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50" style={{ animationDelay: '400ms' }}>
      <CardHeader className="pb-3 relative card-header-gradient">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="size-5 text-sky-500" /> Passenger Feedback
            </CardTitle>
            <CardDescription>Recent passenger reviews and ratings</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="text-lg font-bold">{avgRating}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent' }}>
          {feedbackItems.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border border-l-4 px-3 py-2.5 hover:bg-muted/30 transition-colors animate-fade-in-up ${getSentimentColor(item.rating)}`}
              style={{ animationDelay: `${450 + i * 60}ms` }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate">{item.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{item.route}</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
              </div>
              <StarRating rating={item.rating} />
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.comment}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Active Routes Preview                                              */
/* ================================================================== */
function ActiveRoutesPreview({ onNavigate }: { onNavigate?: () => void }) {
  const now = new Date();
  const daySeed = Math.floor(now.getTime() / (24 * 60 * 60 * 1000));
  const seed = (daySeed * 13) % 100;

  const routes = [
    { number: `BLR-${101 + (seed % 10)}`, from: 'Majestic Bus Stand', to: 'Whitefield', status: 'On Time', dotColor: 'bg-emerald-500' },
    { number: `MUM-${200 + ((seed + 5) % 15)}`, from: 'Bandra Terminus', to: 'Andheri East', status: 'Delayed', dotColor: 'bg-amber-500' },
    { number: `DEL-${100 + ((seed + 2) % 20)}`, from: 'Kashmere Gate', to: 'Connaught Place', status: 'On Time', dotColor: 'bg-emerald-500' },
    { number: `CHN-${300 + ((seed + 7) % 12)}`, from: 'Chennai Central', to: 'T. Nagar', status: 'Completed', dotColor: 'bg-sky-500' },
    { number: `HYD-${400 + ((seed + 3) % 18)}`, from: 'Secunderabad', to: 'HITEC City', status: 'On Time', dotColor: 'bg-emerald-500' },
    { number: `BLR-${500 + ((seed + 9) % 25)}`, from: 'Koramangala', to: 'Electronic City', status: 'Delayed', dotColor: 'bg-amber-500' },
  ];

  const statusBadge = (status: string) => {
    if (status === 'On Time') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'Delayed') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
  };

  return (
    <Card className="animate-fade-in-up backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50" style={{ animationDelay: '300ms' }}>
      <CardHeader className="pb-3 relative card-header-gradient">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="size-5 text-emerald-500" /> Active Routes
            </CardTitle>
            <CardDescription>Current route status overview</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onNavigate}>
            View All <ArrowUpRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent' }}>
          {routes.map((route, i) => (
            <div
              key={route.number}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 hover:bg-muted/40 transition-colors animate-fade-in-up"
              style={{ animationDelay: `${350 + i * 60}ms` }}
            >
              <div className={`size-2.5 rounded-full shrink-0 ${route.dotColor}`}>
                {route.status === 'On Time' && (
                  <span className="absolute inline-flex size-2.5 animate-ping rounded-full opacity-50" style={{ backgroundColor: 'inherit' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tabular-nums">{route.number}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(route.status)}`}>
                    {route.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  <span>{route.from}</span>
                  <span className="text-muted-foreground/60">→</span>
                  <span>{route.to}</span>
                </p>
              </div>
              <Bus className="size-4 text-muted-foreground/60 shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Route Comparison Panel                                             */
/* ------------------------------------------------------------------ */
function RouteComparisonPanel() {
  const comparisonRoutes = [
    { route: 'BLR-101', completion: 92, revenue: '₹4.2L', onTime: 96 },
    { route: 'BLR-115', completion: 87, revenue: '₹3.8L', onTime: 91 },
    { route: 'MUM-201', completion: 95, revenue: '₹5.1L', onTime: 98 },
    { route: 'DEL-301', completion: 78, revenue: '₹2.9L', onTime: 82 },
    { route: 'CHN-401', completion: 89, revenue: '₹3.5L', onTime: 93 },
    { route: 'HYD-501', completion: 83, revenue: '₹3.1L', onTime: 87 },
  ];

  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(['BLR-101', 'MUM-201', 'CHN-401']);

  const selectedData = selectedRoutes
    .map((routeId) => comparisonRoutes.find((cr) => cr.route === routeId))
    .filter(Boolean) as typeof comparisonRoutes;

  const maxCompletion = selectedData.length > 0 ? Math.max(...selectedData.map((r) => r.completion)) : 0;
  const maxOnTime = selectedData.length > 0 ? Math.max(...selectedData.map((r) => r.onTime)) : 0;
  const getRevenueNum = (rev: string) => parseFloat(rev.replace('₹', '').replace('L', ''));
  const maxRevenue = selectedData.length > 0 ? Math.max(...selectedData.map((r) => getRevenueNum(r.revenue))) : 0;

  const toggleRoute = (route: string) => {
    setSelectedRoutes((prev) => {
      if (prev.includes(route)) return prev.filter((r) => r !== route);
      if (prev.length >= 3) return prev;
      return [...prev, route];
    });
  };

  const handleCompare = () => {
    toast({ title: 'Route comparison updated!' });
  };

  const completionColor = (val: number) =>
    val >= 85 ? 'text-emerald-600' : val >= 75 ? 'text-amber-600' : 'text-rose-600';

  const onTimeColor = (val: number) =>
    val >= 90 ? 'text-emerald-600' : val >= 80 ? 'text-amber-600' : 'text-rose-600';

  const BestBadge = () => (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 text-[10px] px-1.5 py-0">
      Best
    </Badge>
  );

  return (
    <Card className="neon-card card-enter page-content-transition">
      <CardHeader className="pb-3 relative card-header-gradient">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="size-5" /> Route Comparison
        </CardTitle>
        <CardDescription>Compare performance metrics across up to 3 routes</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Route selector with popover */}
        <div className="flex items-center gap-3 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Route className="size-4" />
                Select Routes ({selectedRoutes.length}/3)
                <ChevronDown className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1">
                {comparisonRoutes.map((cr) => {
                  const isSelected = selectedRoutes.includes(cr.route);
                  const isDisabled = !isSelected && selectedRoutes.length >= 3;
                  return (
                    <label
                      key={cr.route}
                      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-muted cursor-pointer'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => toggleRoute(cr.route)}
                      />
                      <span className="font-medium">{cr.route}</span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" onClick={handleCompare} disabled={selectedRoutes.length === 0}>
            <BarChart3 className="size-4 mr-1.5" />
            Compare
          </Button>
        </div>

        {/* Selected route badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedRoutes.map((r) => (
            <Badge key={r} variant="secondary" className="gap-1.5">
              {r}
              <button
                onClick={() => toggleRoute(r)}
                className="ml-0.5 hover:text-foreground/70 transition-colors"
                aria-label={`Remove ${r}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {selectedRoutes.length === 0 && (
            <p className="text-sm text-muted-foreground">Select routes above to compare</p>
          )}
        </div>

        {/* Comparison table */}
        {selectedData.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Route #</TableHead>
                  <TableHead>Avg Completion %</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>On-Time Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedData.map((data) => {
                  const revNum = getRevenueNum(data.revenue);
                  const showBest = selectedData.length > 1;
                  return (
                    <TableRow key={data.route}>
                      <TableCell className="font-semibold">{data.route}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${completionColor(data.completion)}`}>
                            {data.completion}%
                          </span>
                          {showBest && data.completion === maxCompletion && <BestBadge />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{data.revenue}</span>
                          {showBest && revNum === maxRevenue && <BestBadge />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${onTimeColor(data.onTime)}`}>
                            {data.onTime}%
                          </span>
                          {showBest && data.onTime === maxOnTime && <BestBadge />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Data Export Panel                                                  */
/* ------------------------------------------------------------------ */
function DataExportPanel() {
  const exportOptions = [
    { title: 'Routes Data', icon: Bus, description: 'Export all routes with schedules', format: 'CSV' },
    { title: 'Crew Data', icon: Users, description: 'Export crew roster and assignments', format: 'CSV' },
    { title: 'Analytics', icon: BarChart3, description: 'Export performance analytics', format: 'CSV' },
    { title: 'Financial Report', icon: DollarSign, description: 'Export revenue and fare data', format: 'PDF' },
  ];

  const totalRecords = [
    { label: '115 Routes', color: 'text-emerald-600' },
    { label: '104 Crew', color: 'text-sky-600' },
    { label: '2,128 Schedules', color: 'text-amber-600' },
    { label: '₹12.4L Revenue', color: 'text-violet-600' },
  ];

  return (
    <Card className="neon-card page-content-transition">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="size-5" /> Data Export Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exportOptions.map((opt) => {
            const IconComp = opt.icon;
            return (
              <div key={opt.title} className="card-hover-border rounded-xl border p-4 flex items-start gap-3 transition-all hover:shadow-md">
                <div className="shrink-0 flex size-10 items-center justify-center rounded-full bg-muted">
                  <IconComp className="size-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{opt.title}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {opt.format}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() =>
                      toast({
                        title: 'Export Started',
                        description: `${opt.title} data is being prepared...`,
                      })
                    }
                  >
                    <Download className="size-3.5 mr-1" /> Download
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Records Preview */}
        <div className="flex flex-wrap gap-3">
          {totalRecords.map((rec) => (
            <div key={rec.label} className="rounded-lg border bg-muted/40 px-3 py-1.5 text-center">
              <p className={`text-sm font-bold ${rec.color}`}>{rec.label}</p>
            </div>
          ))}
        </div>

        {/* Last Export */}
        <p className="text-xs text-muted-foreground">Last export: Never</p>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Page: Dashboard                                                    */
/* ================================================================== */
function DashboardPage({
  token,
  setPortal,
}: {
  token: string;
  setPortal: (p: string) => void;
}) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [lastSync, setLastSync] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [analyticsData, alertsData] = await Promise.all([
          apiFetch('/api/analytics'),
          apiFetch('/api/traffic?unresolved=true'),
        ]);
        // Extract dashboard stats from the new nested structure
        const dash = (analyticsData as Record<string, unknown>)?.dashboard as Record<string, number> | undefined;
        setAnalytics({
          totalRoutes: dash?.totalRoutes ?? 0,
          totalCrew: dash?.totalCrew ?? 0,
          activeSchedules: dash?.activeSchedules ?? 0,
          activeAlerts: dash?.activeAlerts ?? 0,
          // Keep full analytics for charts
          summary: (analyticsData as Record<string, unknown>)?.summary,
          dailyTrend: (analyticsData as Record<string, unknown>)?.dailyTrend,
          cityStats: (analyticsData as Record<string, unknown>)?.cityStats,
          analyticsList: (analyticsData as Record<string, unknown>)?.analytics,
        });
        // FIX #2: Traffic alerts come wrapped in { alerts: [...] }
        const alertArr: any[] = Array.isArray(alertsData) ? alertsData : ((alertsData as Record<string, unknown>)?.alerts ?? (alertsData as Record<string, unknown>)?.data ?? []) as any[];
        setAlerts(alertArr);
        setLastSync(new Date().toLocaleTimeString());
      } catch {
        // Fallback demo data — FIX #1: use activeSchedules
        setAnalytics({
          totalRoutes: 115,
          totalCrew: 104,
          activeSchedules: 64,
          activeAlerts: 12,
        });
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      if (action === 'generate') {
        await apiFetch('/api/schedules', {
          method: 'POST',
          body: JSON.stringify({ action: 'generate', date: todayStr() }),
        });
        toast({ title: 'Success', description: 'Schedules generated successfully!' });
      } else if (action === 'autoAssign') {
        await apiFetch('/api/crew', {
          method: 'POST',
          body: JSON.stringify({ action: 'autoAssign', date: todayStr() }),
        });
        toast({ title: 'Success', description: 'Crew auto-assigned successfully!' });
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setActionLoading('');
    }
  };

  // Generate deterministic fake sparkline data based on stat value
  const fakeSparkline = (val: number): number[] => {
    const seed = val * 7;
    return Array.from({ length: 7 }, (_, i) =>
      Math.max(10, val * (0.6 + ((seed + i * 31) % 50) / 100))
    );
  };

  const stats = analytics
    ? [
        {
          label: 'Total Routes',
          value: analytics.totalRoutes ?? 0,
          icon: Route,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
          sparkColor: 'bg-emerald-400',
          trend: (analytics.totalRoutes ?? 0) % 7 > 3 ? 'up' as const : 'down' as const,
          trendPct: 2 + ((analytics.totalRoutes ?? 0) % 12),
        },
        {
          label: 'Total Crew',
          value: analytics.totalCrew ?? 0,
          icon: Users,
          color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50',
          sparkColor: 'bg-violet-400',
          trend: (analytics.totalCrew ?? 0) % 7 > 3 ? 'up' as const : 'down' as const,
          trendPct: 1 + ((analytics.totalCrew ?? 0) % 8),
        },
        {
          // FIX #1: use activeSchedules
          label: "Today's Schedules",
          value: analytics.activeSchedules ?? 0,
          icon: Calendar,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
          sparkColor: 'bg-amber-400',
          trend: (analytics.activeSchedules ?? 0) % 7 > 3 ? 'up' as const : 'down' as const,
          trendPct: 3 + ((analytics.activeSchedules ?? 0) % 15),
        },
        {
          label: 'Active Alerts',
          value: analytics.activeAlerts ?? 0,
          icon: AlertTriangle,
          color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
          sparkColor: 'bg-rose-400',
          trend: (analytics.activeAlerts ?? 0) % 7 > 3 ? 'up' as const : 'down' as const,
          trendPct: 1 + ((analytics.activeAlerts ?? 0) % 10),
        },
      ]
    : [];

  const quickActions = [
    { id: 'generate', label: 'Generate Schedules', desc: 'Auto-create daily bus schedules', icon: Calendar, gradient: 'from-amber-500 to-orange-500' },
    { id: 'autoAssign', label: 'Auto Assign Crew', desc: 'Smart crew-to-route assignment', icon: UserCheck, gradient: 'from-violet-500 to-purple-600' },
    { id: 'viewRoutes', label: 'Manage Routes', desc: 'View and edit bus routes', icon: Route, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'viewTraffic', label: 'Traffic Alerts', desc: 'Monitor live traffic incidents', icon: AlertTriangle, gradient: 'from-rose-500 to-red-600' },
  ];

  const now = new Date();
  const timelineEvents: TimelineEvent[] = [
    { icon: Calendar, text: 'Schedule generation completed', time: '2 min ago', color: 'text-amber-500', dotColor: 'amber', timestamp: new Date(now.getTime() - 2 * 60000) },
    { icon: UserCheck, text: 'Crew auto-assigned for 12 routes', time: '15 min ago', color: 'text-violet-500', dotColor: 'blue', timestamp: new Date(now.getTime() - 15 * 60000) },
    { icon: CheckCircle2, text: '3 holiday requests approved', time: '2 hours ago', color: 'text-emerald-500', dotColor: 'green', timestamp: new Date(now.getTime() - 2 * 3600000) },
    { icon: AlertTriangle, text: 'Traffic alert on Route 42 resolved', time: 'Yesterday, 4:30 PM', color: 'text-rose-500', dotColor: 'red', timestamp: new Date(now.getTime() - 22 * 3600000) },
    { icon: Wrench, text: 'Maintenance record updated for KA-01-1234', time: 'Yesterday, 11:00 AM', color: 'text-sky-500', dotColor: 'blue', timestamp: new Date(now.getTime() - 26 * 3600000) },
  ];

  return (
    <div className="space-y-6">
      {/* STYLE: Welcome Banner */}
      <div className="page-section">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 p-6 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="size-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">Administrator</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{getGreeting()}, Admin!</h2>
          <p className="mt-1 text-sm text-gray-400">
            Here&apos;s an overview of your transit operations for today.
          </p>
        </div>
      </div>
      </div>

      {/* Stats with Sparklines */}
      <div className="page-section">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          stats.map((s) => (
            <Card key={s.label} className="glass-card stat-card-premium hover-glow transition-shadow hover:shadow-md group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                      {typeof s.value === 'number'
                        ? <AnimatedStatNumber value={s.value as number} />
                        : s.value}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MiniSparkline data={fakeSparkline(s.value as number)} color={s.sparkColor} />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {s.trend === 'up' ? (
                        <>
                          <ArrowUp className="size-3.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{s.trendPct}%</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="size-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400">+{s.trendPct}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 transition-shadow group-hover:animate-pulse-glow ${s.color}`}>
                    <s.icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>

      {/* System Health + IST Clock */}
      <div className="page-section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealthPanel lastSync={lastSync} />
        <ISTClockWidget />
      </div>
      </div>

      {/* Recent Activity Feed + Active Routes + Passenger Feedback */}
      <div className="page-section">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivityFeedWidget />
        <ActiveRoutesPreview onNavigate={() => setPortal('routes')} />
        <PassengerFeedbackWidget />
      </div>
      </div>

      {/* Today's Schedule Compact Table */}
      <div className="page-section">
      <TodayScheduleCompactTable />
      </div>

      {/* Weekly Schedule Completion Bar Chart */}
      <div className="page-section">
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-white/20 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="size-5" /> Weekly Schedule Completion
            </CardTitle>
            <CardDescription>Operations overview for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyBarChart />
          </CardContent>
        </Card>
      </div>

      {/* Live Fleet Tracker + Passenger Analytics */}
      <div className="page-section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveFleetTracker />
        <PassengerAnalytics />
      </div>
      </div>

      {/* Live Bus Map */}
      <div className="page-section">
      <LiveBusMap />
      </div>

      {/* Live Departure Board */}
      <div className="page-section">
      <DepartureBoard />
      </div>

      {/* Admin Quick Actions */}
      <div className="page-section">
      <AdminQuickActions />
      </div>

      {/* Route Comparison */}
      <div className="page-section">
      <RouteComparisonPanel />
      </div>

      {/* Broadcast Messaging */}
      <div className="page-section">
      <BroadcastMessaging />
      </div>

      {/* Data Export Center */}
      <div className="page-section">
      <DataExportPanel />
      </div>

      {/* Live Activity Feed */}
      <div className="page-section">
      <LiveActivityFeed />
      </div>

      {/* Recent Activity + Traffic Alerts side by side on desktop */}
      <div className="page-section">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="size-5" /> Activity Timeline
            </CardTitle>
            <CardDescription>Recent system events</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline events={timelineEvents} />
          </CardContent>
        </Card>

        {/* Recent Traffic Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="size-5 text-amber-500" /> Recent Traffic Alerts
                </CardTitle>
                <CardDescription>
                  Latest unresolved traffic incidents
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPortal('traffic')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeletonShimmer rows={4} cols={4} />
            ) : alerts.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="All Clear!"
                description="No active traffic alerts — all routes are running smoothly."
              />
            ) : (
              <div className="sticky-table-header max-h-72 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Delay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.slice(0, 5).map((alert: any) => (
                      <TableRow key={alert.id ?? alert._id} className="even:bg-muted/30 hover:bg-muted/50 hover:shadow-[inset_3px_0_0_#10b981] transition-all table-row-lift">
                        <TableCell className="font-medium">
                          {/* FIX #2: access nested route.routeNumber */}
                          {alert.route?.routeNumber ?? alert.routeNumber ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.type ?? '—'}</Badge>
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={alert.severity} />
                        </TableCell>
                        <TableCell>
                          {alert.delayMinutes != null
                            ? `${alert.delayMinutes} min`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Broadcast Messaging Component                                      */
/* ================================================================== */
function BroadcastMessaging() {
  const [broadcasts, setBroadcasts] = useState<Array<{
    id: number;
    title: string;
    message: string;
    priority: string;
    audience: string;
    timestamp: string;
    status: string;
  }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [audience, setAudience] = useState('All Users');
  const idRef = useRef(0);

  const priorityColors: Record<string, string> = {
    Low: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    Normal: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    High: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    Urgent: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  };

  const audienceColors: Record<string, string> = {
    'All Users': 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    Drivers: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    Conductors: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    Customers: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Please fill in both title and message.', variant: 'destructive' });
      return;
    }
    if (sending) return;
    setSending(true);
    const newBroadcast = {
      id: ++idRef.current,
      title: title.trim(),
      message: message.trim(),
      priority,
      audience,
      timestamp: new Date().toLocaleString(),
      status: 'Sent',
    };
    setBroadcasts((prev) => [newBroadcast, ...prev]);
    toast({ title: 'Success', description: `Broadcast sent to ${audience}: "${title}"` });
    setTitle('');
    setMessage('');
    setPriority('Normal');
    setAudience('All Users');
    setDialogOpen(false);
    // Simulate delivery after 2s
    setTimeout(() => {
      setBroadcasts((prev) =>
        prev.map((b) => b.id === newBroadcast.id ? { ...b, status: 'Delivered' } : b)
      );
    }, 2000);
  };

  return (
    <Card className="card-shine-sweep">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="size-5" /> Broadcast Messaging
            </CardTitle>
            <CardDescription>Send notifications to users, crew, or all</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) setSending(false); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Send className="size-4 mr-1.5" />
                Broadcast Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Broadcast Message</DialogTitle>
                <DialogDescription>Send a notification to selected audience</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="Broadcast title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea placeholder="Type your message here..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                          <SelectItem key={p} value={p}>
                            <span className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityColors[p]}`}>{p}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Audience</Label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['All Users', 'Drivers', 'Conductors', 'Customers'].map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSend} disabled={sending}>
                  {sending ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="size-4 mr-1.5" />
                  )}
                  Send Broadcast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {broadcasts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No broadcasts sent yet</p>
            <p className="text-xs mt-1">Click &quot;Broadcast Message&quot; to send your first notification</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {broadcasts.map((b) => (
              <div key={b.id} className="card-lift flex items-center gap-3 rounded-lg border p-3 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold truncate">{b.title}</p>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityColors[b.priority]}`}>{b.priority}</Badge>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${audienceColors[b.audience]}`}>{b.audience}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{b.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{b.timestamp}</p>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${b.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                  {b.status === 'Delivered' ? <><CheckCircle2 className="size-3 mr-1" />Delivered</> : <><Clock className="size-3 mr-1" />Sent</>}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Route City Badge Component                                         */
/* ================================================================== */

function RouteCityBadge({ city, routeNumber }: { city?: string; routeNumber?: string }) {
  const detectCity = (c?: string, rn?: string): { label: string; color: string } => {
    const upper = (c ?? '').toUpperCase();
    const prefix = (rn ?? '').toUpperCase();
    if (upper === 'BLR' || prefix.startsWith('BLR')) return { label: 'Bangalore', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (upper === 'MUM' || prefix.startsWith('MUM')) return { label: 'Mumbai', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    if (upper === 'DEL' || prefix.startsWith('DEL')) return { label: 'Delhi', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
    if (upper === 'CHN' || prefix.startsWith('CHN')) return { label: 'Chennai', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
    if (upper === 'INTERCITY' || upper === 'INTER-CITY' || prefix.startsWith('INTERCITY') || prefix.startsWith('INT')) return { label: 'Inter-City', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800' };
    return { label: upper || '—', color: 'bg-muted text-muted-foreground border-muted' };
  };

  const { label, color } = detectCity(city, routeNumber);

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

/* ================================================================== */
/*  Page: Routes                                                       */
/* ================================================================== */
function RoutesPage({ token }: { token: string }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingRoute, setDeletingRoute] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase();
    return routes.filter((r: any) =>
      (r.routeNumber ?? '').toLowerCase().includes(q) ||
      (r.startLocation ?? '').toLowerCase().includes(q) ||
      (r.endLocation ?? '').toLowerCase().includes(q) ||
      (r.city ?? '').toLowerCase().includes(q)
    );
  }, [routes, searchQuery]);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (city) params.set('city', city);
      const data = await apiFetch<any>(`/api/routes?${params.toString()}`);
      setRoutes(Array.isArray(data) ? data : data.routes ?? data.data ?? []);
      setTotalPages(data.totalPages ?? (Math.ceil((data.total ?? 0) / 10) || 1));
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, [city, page]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  const toggleSchedule = async (id: string, enabled: boolean) => {
    setToggling(id);
    try {
      await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify({ action: 'toggleSchedule', id, autoScheduleEnabled: enabled }),
      });
      setRoutes((prev) =>
        prev.map((r) =>
          (r.id ?? r._id) === id
            ? { ...r, autoScheduleEnabled: enabled }
            : r
        )
      );
      toast({ title: 'Success', description: `Auto-schedule ${enabled ? 'enabled' : 'disabled'} successfully` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setToggling(null);
    }
  };

  const handleSaveRoute = async (data: Record<string, unknown>) => {
    setDialogLoading(true);
    try {
      const action = editingRoute ? 'update' : 'create';
      const payload = editingRoute ? { action, id: editingRoute.id ?? editingRoute._id, ...data } : { action, ...data };
      await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast({ title: 'Success', description: `Route ${action === 'update' ? 'updated' : 'created'} successfully` });
      setShowRouteDialog(false);
      setEditingRoute(null);
      fetchRoutes();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed to ${editingRoute ? 'update' : 'create'} route: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!deletingRoute) return;
    setDeleteLoading(true);
    try {
      await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id: deletingRoute.id ?? deletingRoute._id }),
      });
      toast({ title: 'Success', description: `Route ${deletingRoute.routeNumber ?? ''} deleted successfully` });
      setDeleteConfirmOpen(false);
      setDeletingRoute(null);
      fetchRoutes();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed to delete route: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const cities = ['BLR', 'MUM', 'DEL', 'CHN', 'intercity'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Route className="size-5" /> Routes Management
              </CardTitle>
              <CardDescription>
                View and manage bus routes across cities
              </CardDescription>
            </div>
            <Button
              onClick={() => { setEditingRoute(null); setShowRouteDialog(true); }}
              className="btn-press bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5"
            >
              <Plus className="size-4" /> Add Route
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Filter Bar — pill style */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by route number, location, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {['all', ...cities].map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCity(c === 'all' ? '' : c); setPage(1); }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      (c === 'all' && city === '') || city === c
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-muted bg-muted/30 text-muted-foreground hover:border-emerald-300 hover:text-foreground'
                    }`}
                  >
                    {c === 'all' ? 'All' : c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Route className="size-3" />
              Showing <span className="font-semibold text-foreground">{filteredRoutes.length}</span> of <span className="font-semibold text-foreground">{routes.length}</span> routes
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <TableSkeletonShimmer rows={5} cols={7} />
          ) : filteredRoutes.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No Routes Found"
              description={searchQuery ? `No routes match "${searchQuery}". Try a different search term.` : 'Try adjusting your search or city filter to find bus routes.'}
            />
          ) : (
            <>
              <div className="sticky-table-header max-h-[500px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route #</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Start → End</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Fare</TableHead>
                      <TableHead>Traffic</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Auto-Schedule</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.map((r: any, idx: number) => {
                      const id = r.id ?? r._id;
                      return (
                        /* STYLE: alternating row colors + hover */
                        <TableRow
                          key={id}
                          className={`${idx % 2 === 0 ? '' : 'bg-muted/30'} hover:bg-muted/50 hover:shadow-[inset_3px_0_0_#10b981] transition-all cursor-pointer table-row-lift`}
                          onClick={() => { setSelectedRoute(r); setDetailOpen(true); }}
                        >
                          <TableCell className="font-medium">
                            {r.routeNumber ?? '—'}
                          </TableCell>
                          <TableCell>
                            <RouteCityBadge city={r.city} routeNumber={r.routeNumber} />
                          </TableCell>
                          <TableCell>
                            {/* FIX #3: startLocation / endLocation */}
                            <span className="inline-flex items-center gap-1 text-sm">
                              {r.startLocation ?? '—'}
                              <Navigation className="size-3 text-muted-foreground" />
                              {r.endLocation ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {/* FIX #3: distanceKm */}
                            {r.distanceKm != null ? `${r.distanceKm} km` : '—'}
                          </TableCell>
                          <TableCell>
                            {r.fare != null ? `₹${r.fare}` : '—'}
                          </TableCell>
                          <TableCell>
                            <TrafficLevelBadge level={r.trafficLevel} />
                          </TableCell>
                          <TableCell>
                            {/* FIX #3: busRegistration */}
                            <span className="text-sm">{r.busRegistration ?? '—'}</span>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={!!r.autoScheduleEnabled}
                              disabled={toggling === id}
                              onCheckedChange={(checked) => toggleSchedule(id, checked)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                onClick={(e) => { e.stopPropagation(); setEditingRoute(r); setShowRouteDialog(true); }}
                                aria-label="Edit route"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-muted-foreground hover:text-red-600"
                                onClick={(e) => { e.stopPropagation(); setDeletingRoute(r); setDeleteConfirmOpen(true); }}
                                aria-label="Delete route"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Row Count + Pagination */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{filteredRoutes.length}</span> of{' '}
                    <span className="font-semibold text-foreground">{routes.length}</span> routes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Route Optimization Insights */}
      <OptimizationInsights />

      {/* Route Comparison Tool */}
      <RouteComparisonTool routes={routes} />

      {/* NEW: Route Details Dialog */}
      <RouteDetailsDialog route={selectedRoute} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* NEW: Route Form Dialog (Add/Edit) */}
      <RouteFormDialog
        key={editingRoute ? (editingRoute.id ?? editingRoute._id) : 'new'}
        open={showRouteDialog}
        onOpenChange={(open) => { if (!open) { setShowRouteDialog(false); setEditingRoute(null); } else { setShowRouteDialog(true); } }}
        editingRoute={editingRoute}
        onSave={handleSaveRoute}
        loading={dialogLoading}
      />

      {/* NEW: Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Route</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete route <span className="font-semibold">{deletingRoute?.routeNumber ?? ''}</span>?
              This action cannot be undone. All associated schedules and crew assignments may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteConfirmOpen(false); setDeletingRoute(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoute}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ================================================================== */
/*  Route Form Dialog (Add/Edit)                                       */
/* ================================================================== */
function RouteFormDialog({
  open,
  onOpenChange,
  editingRoute,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoute: any;
  onSave: (data: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const isEdit = !!editingRoute;

  // Initialize form from editingRoute (re-mounts via key prop, so lazy init works)
  const [routeNumber, setRouteNumber] = useState(() => {
    if (editingRoute?.routeNumber) return editingRoute.routeNumber;
    const prefix = 'KIA';
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${num}`;
  });
  const [startLocation, setStartLocation] = useState(() => editingRoute?.startLocation ?? '');
  const [endLocation, setEndLocation] = useState(() => editingRoute?.endLocation ?? '');
  const [city, setCity] = useState(() => editingRoute?.city ?? 'Bangalore');
  const [distanceKm, setDistanceKm] = useState(() => String(editingRoute?.distanceKm ?? ''));
  const [durationMin, setDurationMin] = useState(() => String(editingRoute?.durationMin ?? ''));
  const [fare, setFare] = useState(() => String(editingRoute?.fare ?? ''));
  const [startTime, setStartTime] = useState(() => editingRoute?.startTime ?? '05:00');
  const [endTime, setEndTime] = useState(() => editingRoute?.endTime ?? '22:00');
  const [frequencyMinutes, setFrequencyMinutes] = useState(() => String(editingRoute?.frequencyMinutes ?? '60'));
  const [trafficLevel, setTrafficLevel] = useState(() => editingRoute?.trafficLevel ?? 'Medium');
  const [busRegistration, setBusRegistration] = useState(() => editingRoute?.busRegistration ?? '');
  const [autoSchedule, setAutoSchedule] = useState(() => !!editingRoute?.autoScheduleEnabled);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeNumber.trim() || !startLocation.trim() || !endLocation.trim()) {
      toast({ title: 'Validation Error', description: 'Route number, start location, and end location are required', variant: 'destructive' });
      return;
    }
    onSave({
      routeNumber: routeNumber.trim(),
      startLocation: startLocation.trim(),
      endLocation: endLocation.trim(),
      city,
      distanceKm: distanceKm ? parseFloat(distanceKm) : null,
      durationMin: durationMin ? parseInt(durationMin, 10) : null,
      fare: fare ? parseFloat(fare) : null,
      startTime,
      endTime,
      frequencyMinutes: parseInt(frequencyMinutes, 10),
      trafficLevel,
      busRegistration: busRegistration.trim(),
      autoScheduleEnabled: autoSchedule,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="size-5" /> : <Plus className="size-5" />}
            {isEdit ? 'Edit Route' : 'Add New Route'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modify route details below.' : 'Fill in the route information to create a new bus route.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Route Number + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rf-routeNumber">Route Number *</Label>
              <Input
                id="rf-routeNumber"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                placeholder="e.g., BLR-101"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-city">City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="rf-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Start + End Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rf-startLocation">Start Location *</Label>
              <Input
                id="rf-startLocation"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="e.g., Majestic Bus Stand"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-endLocation">End Location *</Label>
              <Input
                id="rf-endLocation"
                value={endLocation}
                onChange={(e) => setEndLocation(e.target.value)}
                placeholder="e.g., Whitefield ITPL"
                required
              />
            </div>
          </div>

          {/* Row 3: Distance, Duration, Fare */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rf-distance">Distance (km)</Label>
              <Input
                id="rf-distance"
                type="number"
                min="0"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="e.g., 25.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-duration">Duration (min)</Label>
              <Input
                id="rf-duration"
                type="number"
                min="0"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-fare">Fare (₹)</Label>
              <Input
                id="rf-fare"
                type="number"
                min="0"
                step="0.5"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="e.g., 35"
              />
            </div>
          </div>

          {/* Row 4: Start Time, End Time, Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="rf-startTime">Start Time</Label>
              <Input
                id="rf-startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-endTime">End Time</Label>
              <Input
                id="rf-endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequencyMinutes} onValueChange={setFrequencyMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Traffic Level, Bus Registration, Auto-Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Traffic Level</Label>
              <Select value={trafficLevel} onValueChange={setTrafficLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-busReg">Bus Registration</Label>
              <Input
                id="rf-busReg"
                value={busRegistration}
                onChange={(e) => setBusRegistration(e.target.value)}
                placeholder="e.g., KA-01-AB-1234"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-6">
              <Label htmlFor="rf-autoSchedule" className="text-sm">Auto-Schedule</Label>
              <Switch
                id="rf-autoSchedule"
                checked={autoSchedule}
                onCheckedChange={setAutoSchedule}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {isEdit ? 'Update Route' : 'Create Route'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================== */
/*  Route Comparison Tool                                              */
/* ================================================================== */
function RouteComparisonTool({ routes }: { routes: any[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectValue, setSelectValue] = useState('');

  const availableRoutes = routes.filter(r => !selectedIds.includes(r.id ?? r._id));

  const addRoute = () => {
    if (!selectValue || selectedIds.length >= 3) return;
    setSelectedIds(prev => [...prev, selectValue]);
    setSelectValue('');
  };

  const removeRoute = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const selectedRoutes = routes.filter(r => selectedIds.includes(r.id ?? r._id));

  // Deterministic helper
  function seedHash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  const metrics = [
    {
      label: 'Distance (km)',
      getValue: (r: any) => r.distanceKm ?? 0,
      format: (v: number) => `${v} km`,
      best: 'lowest' as const,
    },
    {
      label: 'Duration (min)',
      getValue: (r: any) => r.durationMin ?? (seedHash(r.id ?? '') % 60 + 15),
      format: (v: number) => `${v} min`,
      best: 'lowest' as const,
    },
    {
      label: 'Fare (₹)',
      getValue: (r: any) => r.fare ?? 0,
      format: (v: number) => `₹${v}`,
      best: 'lowest' as const,
    },
    {
      label: 'Traffic Level',
      getValue: (r: any) => {
        const levels: Record<string, number> = { low: 1, moderate: 2, high: 3, severe: 4 };
        return levels[(r.trafficLevel ?? '').toLowerCase()] ?? 2;
      },
      format: (_v: number, r: any) => {
        const lvl = (r.trafficLevel ?? 'moderate').charAt(0).toUpperCase() + (r.trafficLevel ?? 'moderate').slice(1);
        return lvl;
      },
      best: 'lowest' as const,
    },
    {
      label: 'Stops Count',
      getValue: (r: any) => r.stopsCount ?? (seedHash((r.id ?? '') + 'stops') % 12 + 3),
      format: (v: number) => String(v),
      best: 'lowest' as const,
    },
    {
      label: 'On-Time Rate',
      getValue: (r: any) => 70 + (seedHash((r.id ?? '') + 'otr') % 28),
      format: (v: number) => `${v}%`,
      best: 'highest' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="size-5 text-violet-500" />
          Route Comparison Tool
        </CardTitle>
        <CardDescription>Select 2-3 routes to compare side by side</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route selector */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedRoutes.map((r: any, idx: number) => (
            <Badge
              key={r.id ?? r._id}
              variant="outline"
              className="flex items-center gap-1.5 py-1.5 px-3 text-sm"
            >
              <span className="font-mono text-xs">{r.routeNumber ?? `Route ${idx + 1}`}</span>
              <span className="text-muted-foreground text-xs">
                {r.startLocation} → {r.endLocation}
              </span>
              <button
                onClick={() => removeRoute(r.id ?? r._id)}
                className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                aria-label="Remove route"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {selectedIds.length < 3 && (
            <div className="flex items-center gap-1.5">
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Select a route..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoutes.map((r: any) => (
                    <SelectItem key={r.id ?? r._id} value={r.id ?? r._id}>
                      <span className="font-mono mr-1">{r.routeNumber ?? '—'}</span>
                      {r.startLocation} → {r.endLocation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                onClick={addRoute}
                disabled={!selectValue || selectedIds.length >= 3}
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedRoutes.length >= 2 && (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Metric</TableHead>
                  {selectedRoutes.map((r: any, idx: number) => (
                    <TableHead key={r.id ?? r._id} className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <Badge variant="outline" className="font-mono text-xs">R{idx + 1}</Badge>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {r.routeNumber ?? '—'}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => {
                  const values = selectedRoutes.map(r => metric.getValue(r));
                  let bestIdx = -1;
                  if (metric.best === 'lowest') {
                    bestIdx = values.indexOf(Math.min(...values));
                  } else {
                    bestIdx = values.indexOf(Math.max(...values));
                  }

                  return (
                    <TableRow key={metric.label}>
                      <TableCell className="font-medium text-sm">{metric.label}</TableCell>
                      {selectedRoutes.map((r: any, idx: number) => {
                        const val = metric.getValue(r);
                        const isBest = idx === bestIdx && selectedRoutes.length >= 2;
                        return (
                          <TableCell
                            key={r.id ?? r._id}
                            className={`text-center text-sm font-semibold ${isBest ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : ''}`}
                          >
                            {isBest && (
                              <span className="inline-block mr-1 text-emerald-500">✓</span>
                            )}
                            {typeof metric.format === 'function'
                              ? (metric.format as (v: number, r: any) => string)(val, r)
                              : String(val)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedRoutes.length < 2 && (
          <div className="text-center py-8 text-muted-foreground">
            <GitMerge className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select at least 2 routes to compare</p>
            <p className="text-xs mt-1">Choose routes from the dropdown above</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  Page: Schedules                                                    */
/* ================================================================== */
function ScheduleStatusDot({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase();
  const colorMap: Record<string, string> = {
    scheduled: 'bg-green-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-500',
  };
  return <span className={`inline-block size-2.5 rounded-full ${colorMap[s] ?? 'bg-gray-400'}`} />;
}

function SchedulesPage({ token }: { token: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [timelineView, setTimelineView] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [statusFilter, setStatusFilter] = useState('all');
  const [genStartTime, setGenStartTime] = useState('05:00');
  const [genEndTime, setGenEndTime] = useState('22:00');
  const [genFrequency, setGenFrequency] = useState('60');
  const [useCustomSettings, setUseCustomSettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const statusFilters = ['all', 'scheduled', 'in_progress', 'completed', 'cancelled'];

  const toAMPM = (t: string) => {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/api/schedules?date=${selectedDate}`);
      setSchedules(Array.isArray(data) ? data : data.schedules ?? data.data ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleResetSettings = () => {
    setGenStartTime('05:00');
    setGenEndTime('22:00');
    setGenFrequency('60');
    toast({ title: 'Settings Reset', description: 'Schedule generation settings reset to defaults (05:00–22:00, every 60 min)' });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const body: Record<string, string> = { action: 'generate', date: selectedDate };
      if (useCustomSettings) {
        body.globalStartTime = genStartTime;
        body.globalEndTime = genEndTime;
        body.globalFrequency = genFrequency;
      }
      await apiFetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Success', description: `Schedules generated for ${formatDate(selectedDate)}${useCustomSettings ? ' with custom settings' : ''}!` });
      fetchSchedules();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const filteredSchedules = useMemo(() => {
    if (statusFilter === 'all') return schedules;
    return schedules.filter((s: any) => (s.status ?? '').toLowerCase() === statusFilter);
  }, [schedules, statusFilter]);

  const statusLabel: Record<string, string> = {
    all: 'All', scheduled: 'Scheduled', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
  };

  const filterActiveClass = (f: string) =>
    statusFilter === f
      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
      : 'bg-muted/60 text-muted-foreground hover:bg-muted dark:hover:bg-muted/80';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="size-5" /> Schedules
              </CardTitle>
              <CardDescription className="mt-1">
                <span className="font-semibold text-foreground dark:text-foreground">{schedules.length}</span>{' '}
                schedules for{' '}
                <span className="font-medium text-foreground">
                  {formatDate(selectedDate)}
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40 text-sm"
                />
              </div>
              <Button variant={timelineView ? 'outline' : 'default'} size="sm" onClick={() => setTimelineView(false)}>
                <Calendar className="size-3.5 mr-1" /> Table
              </Button>
              <Button variant={timelineView ? 'default' : 'outline'} size="sm" onClick={() => setTimelineView(true)}>
                <LayoutList className="size-3.5 mr-1" /> Timeline
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                try {
                  const csvHeader = 'Route Number,Date,Departure Time,Status,Bus Registration\n';
                  const csvRows = schedules.map((s: any) =>
                    `${s.route?.routeNumber ?? s.routeNumber ?? ''},${s.date ?? selectedDate},${s.departureTime ?? s.time ?? ''},${s.status ?? ''},${s.route?.busRegistration ?? s.busNumber ?? ''}`
                  ).join('\n');
                  const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `schedules_${selectedDate}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: 'Export Successful', description: `Exported ${schedules.length} schedules as CSV` });
                } catch {
                  toast({ title: 'Export Failed', description: 'Could not generate CSV file', variant: 'destructive' });
                }
              }}>
                <Download className="size-3.5 mr-1" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                try {
                  const jsonData = schedules.map((s: any) => ({
                    routeNumber: s.route?.routeNumber ?? s.routeNumber ?? '',
                    date: s.date ?? selectedDate,
                    departureTime: s.departureTime ?? s.time ?? '',
                    status: s.status ?? '',
                    busRegistration: s.route?.busRegistration ?? s.busNumber ?? '',
                  }));
                  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `schedules_${selectedDate}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: 'Export Successful', description: `Exported ${schedules.length} schedules as JSON` });
                } catch {
                  toast({ title: 'Export Failed', description: 'Could not generate JSON file', variant: 'destructive' });
                }
              }}>
                <Download className="size-3.5 mr-1" /> Export JSON
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="btn-press bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                {generating ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Play className="size-4" />
                )}
                <span className="hidden sm:inline ml-1.5">Generate Schedules</span>
                <span className="sm:hidden ml-1.5">Generate</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Schedule Settings Panel */}
          <div className="mb-4 rounded-lg border bg-muted/30">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="flex w-full items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-lg"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground" />
                Schedule Settings
                {useCustomSettings && (
                  <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">Custom</Badge>
                )}
              </span>
              {showSettings ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {showSettings && (
              <div className="border-t px-4 pb-4 pt-3 space-y-4">
                {/* Toggle custom settings */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Custom Schedule Generation</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Override default route settings when generating schedules</p>
                  </div>
                  <Switch checked={useCustomSettings} onCheckedChange={setUseCustomSettings} />
                </div>
                {useCustomSettings && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="genStartTime" className="text-xs">Start Time</Label>
                        <Input
                          id="genStartTime"
                          type="time"
                          value={genStartTime}
                          onChange={(e) => setGenStartTime(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="genEndTime" className="text-xs">End Time</Label>
                        <Input
                          id="genEndTime"
                          type="time"
                          value={genEndTime}
                          onChange={(e) => setGenEndTime(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Frequency</Label>
                        <Select value={genFrequency} onValueChange={setGenFrequency}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">Every 15 min</SelectItem>
                            <SelectItem value="30">Every 30 min</SelectItem>
                            <SelectItem value="60">Every 1 hour</SelectItem>
                            <SelectItem value="120">Every 2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="size-4 mt-0.5 shrink-0" />
                        <span>Override default route settings when generating schedules</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleResetSettings} className="text-xs gap-1.5">
                        <RotateCcw className="size-3" />
                        Reset to Defaults
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${filterActiveClass(f)}`}
              >
                {f !== 'all' && <ScheduleStatusDot status={f} />}
                {statusLabel[f]}
                {f !== 'all' && (
                  <span className="ml-0.5 opacity-70">({schedules.filter((s: any) => (s.status ?? '').toLowerCase() === f).length})</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <TableSkeletonShimmer rows={5} cols={4} />
          ) : filteredSchedules.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={statusFilter === 'all' ? 'No Schedules Yet' : `No ${statusLabel[statusFilter]} Schedules`}
              description={statusFilter === 'all' ? 'Click &quot;Generate&quot; to auto-create bus schedules based on route configurations.' : `No ${statusLabel[statusFilter].toLowerCase()} schedules found for ${formatDate(selectedDate)}.`}
            />
          ) : (
            <>
            {timelineView ? (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Timeline header: hours */}
                <div className="flex mb-2 border-b pb-1">
                  <div className="w-24 shrink-0 text-xs text-muted-foreground font-medium">Route</div>
                  <div className="flex-1 flex">
                    {Array.from({ length: 19 }, (_, h) => h + 5).map((h) => (
                      <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground/60">{h}:00</div>
                    ))}
                  </div>
                </div>
                {/* Timeline rows */}
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {filteredSchedules.slice(0, 20).map((s: any) => {
                    const time = s.departureTime ?? s.time ?? '08:00';
                    const parts = time.split(':');
                    const hr = parseInt(parts[0] || '8', 10);
                    const mn = parseInt(parts[1] || '0', 10);
                    const startPct = Math.max(0, ((hr - 5) * 60 + mn) / (19 * 60)) * 100;
                    const blockW = Math.max(4, 100 / 19);
                    const routeNum = s.route?.routeNumber ?? s.routeNumber ?? '—';
                    const status = (s.status ?? '').toLowerCase();
                    const barColor = status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-amber-500' : 'bg-sky-500';
                    return (
                      <div key={s.id ?? s._id} className="flex items-center gap-2">
                        <div className="w-24 shrink-0 text-xs font-medium truncate">{routeNum}</div>
                        <div className="flex-1 relative h-6 bg-muted/30 rounded">
                          <div className={`absolute top-1 h-4 rounded ${barColor} opacity-80`} style={{ left: `${startPct}%`, width: `${blockW}%` }} />
                          <span className="absolute text-[8px] text-muted-foreground" style={{ left: `${startPct + 1}%`, top: '2px' }}>{time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
            <div className="sticky-table-header max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route #</TableHead>
                    <TableHead>Departure Time</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((s: any, idx: number) => (
                    <TableRow key={s.id ?? s._id} className={`${idx % 2 === 0 ? '' : 'bg-muted/30'} hover:bg-muted/50 hover:shadow-[inset_3px_0_0_#10b981] transition-all table-row-lift`}>
                      <TableCell className="font-medium">
                        {s.route?.routeNumber ?? s.routeNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {toAMPM(s.departureTime ?? s.time)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.route?.busRegistration ?? s.busNumber ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ScheduleStatusDot status={s.status} />
                          <ScheduleStatusBadge status={s.status} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TableFooter showing={filteredSchedules.length} total={schedules.length} />
            </>
          )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Page: Crew                                                         */
/* ================================================================== */
function CrewPage({ token }: { token: string }) {
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<any>(null);
  const [selectedCrew, setSelectedCrew] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const today = todayStr();

  const filteredCrew = useMemo(() => {
    let result = crew;
    if (roleFilter !== 'all') {
      result = result.filter((c: any) =>
        (c.specialization ?? '').toLowerCase() === roleFilter.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c: any) =>
        (c.profile?.name ?? c.name ?? '').toLowerCase().includes(q) ||
        (c.profile?.email ?? c.email ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [crew, searchQuery, roleFilter]);

  const fetchCrew = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/crew');
      setCrew(Array.isArray(data) ? data : data.crew ?? data.data ?? []);
    } catch {
      setCrew([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrew();
  }, [fetchCrew]);

  const handleAutoAssign = async () => {
    setAssigning(true);
    setAssignResult(null);
    try {
      const result = await apiFetch<any>('/api/crew', {
        method: 'POST',
        body: JSON.stringify({ action: 'autoAssign', date: today }),
      });
      setAssignResult(result);
      toast({ title: 'Success', description: 'Crew auto-assigned successfully!' });
      fetchCrew();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="size-5" /> Crew Management
              </CardTitle>
              <CardDescription>Manage drivers, conductors and assignments</CardDescription>
            </div>
            <Button onClick={handleAutoAssign} disabled={assigning} className="btn-press">
              {assigning ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <UserCheck className="size-4" />
              )}
              Auto Assign Crew
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search & Role Filter Bar — pill style */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ key: 'all', label: 'All', color: 'text-emerald-600' }, { key: 'driver', label: 'Driver', color: 'text-sky-600' }, { key: 'conductor', label: 'Conductor', color: 'text-violet-600' }].map((role) => (
                  <button
                    key={role.key}
                    onClick={() => setRoleFilter(role.key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      roleFilter === role.key
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-muted bg-muted/30 text-muted-foreground hover:border-emerald-300 hover:text-foreground'
                    }`}
                  >
                    <span className={`size-2 rounded-full ${roleFilter === role.key ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3" />
              Showing <span className="font-semibold text-foreground">{filteredCrew.length}</span> of <span className="font-semibold text-foreground">{crew.length}</span> crew members
            </div>
          </div>
          {/* Assignment results */}
          {assignResult && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <h4 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">
                Assignment Results
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* FIX #6: jainsIndex instead of fairnessIndex */}
                {assignResult.jainsIndex != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Jain&apos;s Fairness Index</p>
                    <p className="text-lg font-bold">{assignResult.jainsIndex}</p>
                  </div>
                )}
                {assignResult.assignmentsCreated != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments Created</p>
                    <p className="text-lg font-bold">{assignResult.assignmentsCreated}</p>
                  </div>
                )}
                {/* FIX #6: executionTimeMs instead of executionTime */}
                {assignResult.executionTimeMs != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Execution Time</p>
                    <p className="text-lg font-bold">{assignResult.executionTimeMs}ms</p>
                  </div>
                )}
                {assignResult.maxHoursViolations != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Max Hours Violations</p>
                    <p className="text-lg font-bold text-amber-600">{assignResult.maxHoursViolations}</p>
                  </div>
                )}
              </div>
              {assignResult.message && (
                <p className="mt-2 text-sm text-muted-foreground">{assignResult.message}</p>
              )}
            </div>
          )}

          {loading ? (
            <TableSkeletonShimmer rows={5} cols={5} />
          ) : filteredCrew.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery || roleFilter !== 'all' ? 'No Matching Crew' : 'No Crew Members'}
              description={searchQuery || roleFilter !== 'all'
                ? 'No crew members match your filters. Try adjusting your search or role selection.'
                : 'No crew members have been registered yet. Add drivers and conductors to get started.'}
            />
          ) : (
            <>
            <div className="sticky-table-header max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrew.map((c: any, idx: number) => (
                    /* STYLE: alternating row colors + hover + clickable */
                    <TableRow
                      key={c.id ?? c._id}
                      className={`${idx % 2 === 0 ? '' : 'bg-muted/30'} hover:bg-muted/50 hover:shadow-[inset_3px_0_0_#10b981] transition-all cursor-pointer table-row-lift`}
                      onClick={() => { setSelectedCrew(c); setDetailOpen(true); }}
                    >
                      <TableCell className="font-medium">
                        {/* FIX #5: c.profile?.name */}
                        {c.profile?.name ?? c.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            /* FIX #5: c.specialization (no fallback to role) */
                            (c.specialization ?? '').toLowerCase() === 'driver'
                              ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300'
                              : 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300'
                          }
                        >
                          {c.specialization ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {/* FIX #5: c.performanceRating */}
                        <StarRating rating={c.performanceRating ?? 0} />
                      </TableCell>
                      <TableCell>{c.busNumber ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            (c.availability ?? '').toLowerCase() === 'available'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                          }
                        >
                          {c.availability ?? 'unknown'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TableFooter showing={filteredCrew.length} total={crew.length} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Crew Fatigue Monitor */}
      <CrewFatigueMonitor />

      {/* NEW: Crew Details Dialog */}
      <CrewDetailsDialog crew={selectedCrew} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

/* ================================================================== */
/*  Page: Traffic                                                      */
/* ================================================================== */
function TrafficPage({ token }: { token: string }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    routeId: '',
    type: '',
    severity: '',
    delayMinutes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsData, routesData] = await Promise.all([
        apiFetch<any>('/api/traffic?unresolved=true'),
        apiFetch<any>('/api/routes?limit=100'),
      ]);
      setAlerts(Array.isArray(alertsData) ? alertsData : alertsData.alerts ?? alertsData.data ?? []);
      setRoutes(Array.isArray(routesData) ? routesData : routesData.routes ?? routesData.data ?? []);
    } catch {
      setAlerts([]);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!formData.routeId || !formData.type || !formData.severity) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      await apiFetch('/api/traffic', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create',
          routeId: formData.routeId,
          type: formData.type,
          severity: formData.severity,
          delayMinutes: Number(formData.delayMinutes) || 0,
        }),
      });
      toast({ title: 'Success', description: 'Alert created successfully!' });
      setDialogOpen(false);
      setFormData({ routeId: '', type: '', severity: '', delayMinutes: '' });
      fetchData();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await apiFetch('/api/traffic', {
        method: 'POST',
        body: JSON.stringify({ action: 'resolve', id }),
      });
      setAlerts((prev) =>
        prev.map((a) =>
          (a.id ?? a._id) === id ? { ...a, status: 'resolved' } : a
        )
      );
      toast({ title: 'Success', description: 'Alert resolved successfully!' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setResolving(null);
    }
  };

  const typeIcons: Record<string, React.ElementType> = {
    accident: AlertTriangle,
    congestion: Users,
    road_work: Wrench,
    weather: Cloud,
    other: MessageSquare,
  };
  const severityBorder: Record<string, string> = {
    critical: 'border-l-rose-500',
    high: 'border-l-amber-500',
    medium: 'border-l-sky-500',
    low: 'border-l-gray-400',
  };
  const severityBg: Record<string, string> = {
    critical: 'bg-rose-50 dark:bg-rose-950/20',
    high: 'bg-amber-50 dark:bg-amber-950/20',
    medium: 'bg-sky-50 dark:bg-sky-950/20',
    low: 'bg-gray-50 dark:bg-gray-950/20',
  };
  const formSteps = [
    { label: '1. Route', done: !!formData.routeId },
    { label: '2. Type', done: !!formData.type },
    { label: '3. Severity', done: !!formData.severity },
    { label: '4. Delay', done: !!formData.delayMinutes },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="size-5 text-amber-500" /> Traffic Alerts
              </CardTitle>
              <CardDescription>Monitor and manage traffic incidents</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-amber-500" /> Create Traffic Alert
                  </DialogTitle>
                  <DialogDescription>
                    Report a new traffic incident on a route
                  </DialogDescription>
                </DialogHeader>
                {/* Step Progress Indicator */}
                <div className="flex items-center gap-1 pt-2">
                  {formSteps.map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        step.done
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step.done ? <CheckCircle2 className="size-3" /> : <span className="size-3 rounded-full border-2 border-current opacity-30" />}
                        {step.label}
                      </div>
                      {i < formSteps.length - 1 && <div className="flex-1 h-px bg-muted mx-1" />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="space-y-4 py-2">
                  {/* Step 1: Route — Card Style */}
                  <div className={`rounded-xl border-2 p-4 transition-all ${formData.routeId ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20' : 'border-muted'}`}>
                    <Label className="flex items-center gap-1.5 mb-2">
                      <Route className="size-3.5 text-emerald-500" /> Route
                    </Label>
                    <Select
                      value={formData.routeId}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, routeId: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select route..." />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r: any) => {
                          const id = r.id ?? r._id;
                          return (
                            <SelectItem key={id} value={String(id)}>
                              {r.routeNumber ?? id} — {r.startLocation ?? ''} → {r.endLocation ?? ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Step 2: Type — Card Style */}
                  <div className={`rounded-xl border-2 p-4 transition-all ${formData.type ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20' : 'border-muted'}`}>
                    <Label className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="size-3.5 text-amber-500" /> Incident Type
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { value: 'accident', icon: AlertTriangle, label: 'Accident', color: 'text-rose-500' },
                        { value: 'congestion', icon: Users, label: 'Congestion', color: 'text-amber-500' },
                        { value: 'road_work', icon: Wrench, label: 'Road Work', color: 'text-orange-500' },
                        { value: 'weather', icon: Cloud, label: 'Weather', color: 'text-sky-500' },
                        { value: 'other', icon: MessageSquare, label: 'Other', color: 'text-gray-500' },
                      ].map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, type: t.value }))}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-all ${
                            formData.type === t.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-muted hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <t.icon className={`size-5 ${formData.type === t.value ? 'text-emerald-600 dark:text-emerald-400' : t.color}`} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Step 3: Severity — Pill Buttons */}
                  <div className={`rounded-xl border-2 p-4 transition-all ${formData.severity ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20' : 'border-muted'}`}>
                    <Label className="flex items-center gap-1.5 mb-2">
                      <Zap className="size-3.5 text-violet-500" /> Severity Level
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'low', label: 'Low', dot: 'bg-gray-400', active: 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300' },
                        { value: 'medium', label: 'Medium', dot: 'bg-sky-400', active: 'border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
                        { value: 'high', label: 'High', dot: 'bg-amber-400', active: 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
                        { value: 'critical', label: 'Critical', dot: 'bg-rose-500', active: 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
                      ].map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFormData((f) => ({ ...f, severity: s.value }))}
                          className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-semibold transition-all ${
                            formData.severity === s.value ? s.active : 'border-muted text-muted-foreground hover:border-muted-foreground/30'
                          }`}
                        >
                          <span className={`size-2.5 rounded-full ${formData.severity === s.value ? s.dot : 'bg-muted-foreground/30'}`} />
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Step 4: Delay */}
                  <div className={`rounded-xl border-2 p-4 transition-all ${formData.delayMinutes ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20' : 'border-muted'}`}>
                    <Label className="flex items-center gap-1.5 mb-2">
                      <Timer className="size-3.5 text-amber-500" /> Estimated Delay (minutes)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={formData.delayMinutes}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, delayMinutes: e.target.value }))
                      }
                      className="text-lg font-semibold"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={creating} className="gap-1.5">
                    {creating ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    Create Alert
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-28 rounded-lg" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Unresolved Alerts"
              description="All traffic incidents have been resolved. Create a new alert if needed."
            />
          ) : (
            <div className="grid gap-3 max-h-[600px] overflow-y-auto">
              {alerts.map((a: any) => {
                const id = a.id ?? a._id;
                const isResolved = (a.status ?? '').toLowerCase() === 'resolved';
                const severity = (a.severity ?? 'low').toLowerCase();
                const alertType = (a.type ?? 'other').toLowerCase();
                const TypeIcon = typeIcons[alertType] ?? MessageSquare;
                return (
                  <div
                    key={id}
                    className={`card-lift rounded-xl border-l-4 ${severityBorder[severity] ?? 'border-l-gray-400'} ${severityBg[severity] ?? ''} border border-muted p-4 transition-all ${isResolved ? 'opacity-50' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Left: Icon + Route Badge */}
                      <div className="flex items-center gap-3 sm:w-48 shrink-0">
                        <div className={`rounded-lg p-2 ${
                          severity === 'critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' :
                          severity === 'high' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' :
                          severity === 'medium' ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          <TypeIcon className="size-5" />
                        </div>
                        <div>
                          <Badge variant="outline" className="font-mono text-xs">
                            {a.route?.routeNumber ?? a.routeNumber ?? '—'}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{alertType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      {/* Center: Severity Badge + Reporter + Date */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <SeverityBadge severity={a.severity} />
                          <Badge variant="outline" className={
                            isResolved ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                          }>
                            {isResolved ? 'Resolved' : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reported by <span className="text-foreground font-medium">{a.reporter?.name ?? '—'}</span> · {a.createdAt ? formatDateTime(a.createdAt) : '—'}
                        </p>
                      </div>
                      {/* Right: Delay Minutes + Resolve Button */}
                      <div className="flex items-center gap-4 sm:justify-end shrink-0">
                        <div className="text-center sm:text-right">
                          <p className="text-2xl font-bold tabular-nums">
                            {a.delayMinutes != null ? a.delayMinutes : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground -mt-0.5">min delay</p>
                        </div>
                        {!isResolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={resolving === id}
                            onClick={() => handleResolve(id)}
                            className="shrink-0"
                          >
                            {resolving === id ? (
                              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Page: Holidays                                                     */
/* ================================================================== */
function HolidaysPage({ token, userId }: { token: string; userId: string }) {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const statusFilters = ['all', 'pending', 'approved', 'rejected'];

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/holidays');
      // Fetch all requests (not just pending) so we can filter
      const arr = Array.isArray(data) ? data : data.requests ?? data.holidays ?? data.data ?? [];
      setHolidays(arr);
    } catch {
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const filteredHolidays = useMemo(() => {
    if (statusFilter === 'all') return holidays;
    return holidays.filter((h: any) => (h.status ?? 'pending').toLowerCase() === statusFilter);
  }, [holidays, statusFilter]);

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setReviewing(id);
    try {
      await apiFetch('/api/holidays', {
        method: 'POST',
        body: JSON.stringify({ action: 'review', id, status, reviewedBy: userId }),
      });
      setHolidays((prev) =>
        prev.map((h) =>
          (h.id ?? h._id) === id ? { ...h, status } : h
        )
      );
      toast({ title: 'Success', description: `Holiday request ${status} successfully!` });
      // Remove from list after short delay
      setTimeout(() => {
        setHolidays((prev) => prev.filter((h) => (h.id ?? h._id) !== id));
      }, 500);
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setReviewing(null);
    }
  };

  const formatCompactDateRange = (startDate: string, endDate: string) => {
    try {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
      const sDay = s.getDate();
      const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
      const eDay = e.getDate();
      const year = s.getFullYear();
      if (sMonth === eMonth) return `${sMonth} ${sDay} - ${eDay}, ${year}`;
      return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${year}`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  const getDaysCount = (startDate: string, endDate: string) => {
    try {
      const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(1, Math.round(diff) + 1);
    } catch {
      return '—';
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status ?? 'pending').toLowerCase();
    if (s === 'approved') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
    if (s === 'rejected') return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
  };

  const filterActiveClass = (f: string) =>
    statusFilter === f
      ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
      : 'bg-muted/60 text-muted-foreground hover:bg-muted dark:hover:bg-muted/80';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="size-5" /> Holiday Requests
          </CardTitle>
          <CardDescription>
            Review and approve or reject crew holiday requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all ${filterActiveClass(f)}`}
              >
                {f}
                {f !== 'all' && (
                  <span className="ml-1 opacity-70">({holidays.filter((h: any) => (h.status ?? 'pending').toLowerCase() === f).length})</span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : filteredHolidays.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up!"
              description="No holiday requests matching this filter. Check back later."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {filteredHolidays.map((h: any) => {
                const id = h.id ?? h._id;
                const crewName = h.crew?.name ?? h.crewName ?? '—';
                const role = h.crew?.role ?? h.role ?? (crewName.includes('Driver') ? 'Driver' : 'Conductor');
                const status = (h.status ?? 'pending').toLowerCase();
                const isPending = status === 'pending';

                return (
                  <div
                    key={id}
                    className={`card-lift rounded-xl border bg-card p-4 transition-all dark:bg-card ${
                      status === 'approved' ? 'border-emerald-200 dark:border-emerald-800/60' :
                      status === 'rejected' ? 'border-rose-200 dark:border-rose-800/60' :
                      'border-amber-200 dark:border-amber-800/60'
                    }`}
                  >
                    {/* Header: Name + Role + Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                          <Users className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground dark:text-foreground truncate">{crewName}</h3>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize mt-0.5 ${
                              role.toLowerCase() === 'driver'
                                ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                                : 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800'
                            }`}
                          >
                            {role}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={`text-[10px] capitalize shrink-0 ${getStatusBadge(status)}`}>
                        {status}
                      </Badge>
                    </div>

                    {/* Date Range */}
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground dark:text-foreground">
                        {formatCompactDateRange(h.startDate, h.endDate)}
                      </span>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        ({getDaysCount(h.startDate, h.endDate)}d)
                      </span>
                    </div>

                    {/* Reason */}
                    {h.reason && (
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-3 line-clamp-2">{h.reason}</p>
                    )}

                    {/* Action Buttons (only for pending) */}
                    {isPending && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                          disabled={reviewing === id}
                          onClick={() => handleReview(id, 'approved')}
                        >
                          {reviewing === id ? (
                            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <CheckCircle2 className="size-3.5 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                          disabled={reviewing === id}
                          onClick={() => handleReview(id, 'rejected')}
                        >
                          {reviewing === id ? (
                            <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <XCircle className="size-3.5 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Page: Analytics                                                    */
/* ================================================================== */
function AnalyticsPage({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');

  const dateRangeLabel: Record<string, string> = {
    '7': 'Last 7 Days',
    '30': 'Last 30 Days',
    '90': 'Last 90 Days',
    '0': 'All Time',
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const days = dateRange === '0' ? '365' : dateRange;
        const result = await apiFetch<any>(`/api/analytics?days=${days}`);
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [dateRange]);

  // FIX #10: map from data.summary for summary fields
  const summary = data?.summary ?? data ?? {};
  const dailyTrends: { date: string; revenue: number; journeys: number }[] = data?.dailyTrend ?? data?.dailyTrends ?? [];
  const cityStats: { city: string; revenue: number; journeys: number; completionRate: number }[] =
    data?.cityStats ?? data?.cityBreakdown ?? [];

  // Top performing routes (deterministic demo data)
  const topRoutes = useMemo(() => {
    const routes = [
      { name: 'BLR-001', revenue: 48500, pct: 100 },
      { name: 'MUM-012', revenue: 42300, pct: 87 },
      { name: 'DEL-005', revenue: 38900, pct: 80 },
      { name: 'BLR-025', revenue: 35200, pct: 73 },
      { name: 'CHN-008', revenue: 31800, pct: 66 },
      { name: 'HYD-003', revenue: 28400, pct: 59 },
    ];
    return routes;
  }, []);

  // Route performance matrix (deterministic demo data)
  const perfMatrix = useMemo(() => {
    const cities = ['BLR', 'DEL', 'MUM', 'CHN', 'HYD'];
    const metrics = ['Revenue', 'On-Time %', 'Completion', 'Satisfaction'];
    const seed = 42;
    return cities.map((city, ci) => {
      const row: Record<string, number> = { city: ci };
      metrics.forEach((_, mi) => {
        row[metrics[mi]] = Math.round(60 + ((seed + ci * 13 + mi * 7) % 35));
      });
      return row;
    });
  }, []);

  const summaryCards = data
    ? [
        {
          label: 'Total Revenue',
          value: `₹${((summary.totalRevenue ?? 0) / 1000).toFixed(1)}K`,
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
        },
        {
          label: 'Avg Completion Rate',
          value: `${(summary.avgCompletionRate ?? 0).toFixed(1)}%`,
          icon: TrendingUp,
          color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50',
        },
        {
          label: 'Avg Delay',
          value: `${(summary.avgDelay ?? 0).toFixed(1)} min`,
          icon: Timer,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
        },
        {
          label: 'Total Journeys',
          value: (summary.totalJourneys ?? 0).toLocaleString(),
          icon: Navigation,
          color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50',
        },
      ]
    : [];

  // Revenue summary
  const totalRevenue = summary.totalRevenue ?? 0;
  const avgPerRoute = cityStats.length > 0 ? Math.round(totalRevenue / cityStats.length) : 0;
  const highestEarner = topRoutes.length > 0 ? topRoutes[0] : { name: '—', revenue: 0 };

  return (
    <div className="space-y-6">
      {/* Date Range Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[{ key: '7', label: 'Last 7 days' }, { key: '30', label: 'Last 30 days' }, { key: '90', label: 'Last 90 days' }, { key: '0', label: 'All Time' }].map((range) => (
            <button
              key={range.key}
              onClick={() => setDateRange(range.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                dateRange === range.key
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-muted bg-muted/30 text-muted-foreground hover:border-emerald-300 hover:text-foreground'
              }`}
            >
              <Calendar className="size-3" />
              {range.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BarChart3 className="size-3" />
          Showing data for <span className="font-semibold text-foreground">{dateRangeLabel[dateRange]}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          summaryCards.map((s) => (
            <Card key={s.label} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{s.value}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${s.color}`}>
                    <s.icon className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Revenue Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="size-4 text-emerald-500" />
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="size-4 text-sky-500" />
                <p className="text-sm text-muted-foreground">Avg per Route</p>
              </div>
              <p className="text-2xl font-bold">₹{avgPerRoute.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="size-4 text-amber-500" />
                <p className="text-sm text-muted-foreground">Highest Earner</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">₹{highestEarner.revenue.toLocaleString()}</p>
                <Badge variant="outline" className="text-xs">{highestEarner.name}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Revenue Trend — Recharts AreaChart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="size-5" /> Daily Revenue Trend ({dateRangeLabel[dateRange]})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[240px] w-full rounded-lg" />
          ) : dailyTrends.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Trend Data"
              description="Revenue trend data will appear once journeys are completed."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyTrends} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="currentColor" className="text-muted-foreground/20" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => formatDate(v)}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as { date: string; revenue: number; journeys: number };
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
                        <p className="text-xs font-semibold text-foreground">{formatDate(d.date)}</p>
                        <p className="text-sm text-emerald-600">₹{d.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{d.journeys} journeys</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueAreaGrad)" dot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Routes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="size-5 text-amber-500" /> Top Performing Routes
          </CardTitle>
          <CardDescription>Routes ranked by weekly revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRoutes.map((route, i) => (
              <div key={route.name} className="flex items-center gap-3">
                <div className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <span className="w-16 shrink-0 text-sm font-medium">{route.name}</span>
                <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-muted">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.max(route.pct, 2)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-sm font-medium">
                  ₹{route.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Route Performance Heatmap */}
      <RoutePerformanceHeatmap />

      {/* Route Performance Comparison Chart */}
      <RoutePerformanceChart />

      {/* Route Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5" /> Route Performance Matrix
          </CardTitle>
          <CardDescription>Cross-city performance comparison (color-coded)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Revenue Score</TableHead>
                  <TableHead>On-Time %</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Satisfaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perfMatrix.map((row, i) => {
                  const cityName = ['BLR', 'DEL', 'MUM', 'CHN', 'HYD'][i] ?? '—';
                  return (
                    <TableRow key={cityName} className={`${i % 2 === 0 ? '' : 'bg-muted/30'} table-row-lift`}>
                      <TableCell className="font-medium">{cityName}</TableCell>
                      {(['Revenue', 'On-Time %', 'Completion', 'Satisfaction'] as const).map((metric) => {
                        const val = row[metric];
                        const colorClass =
                          val >= 85 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          val >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
                        return (
                          <TableCell key={metric}>
                            <Badge variant="outline" className={colorClass}>
                              {metric === 'On-Time %' || metric === 'Completion' || metric === 'Satisfaction'
                                ? `${val}%`
                                : `${val}`}
                            </Badge>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* City Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="size-5" /> City-wise Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : cityStats.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No City Data"
              description="City-wise breakdown will appear once route analytics data is available."
            />
          ) : (
            <div className="sticky-table-header max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Journeys</TableHead>
                    <TableHead>Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cityStats.map((c: any, i: number) => (
                    /* STYLE: alternating row colors + hover */
                    <TableRow key={i} className={`${i % 2 === 0 ? '' : 'bg-muted/30'} hover:bg-muted/50 hover:shadow-[inset_3px_0_0_#10b981] transition-all table-row-lift`}>
                      <TableCell className="font-medium">{c.city}</TableCell>
                      <TableCell>₹{c.revenue.toLocaleString()}</TableCell>
                      <TableCell>{c.journeys.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${c.completionRate ?? 0}%` }}
                            />
                          </div>
                          <span className="text-sm">{(c.completionRate ?? 0).toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Page: Maintenance                                                  */
/* ================================================================== */
function MaintenancePage({ token }: { token: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<any>('/api/maintenance');
        setRecords(Array.isArray(data) ? data : data.records ?? data.data ?? []);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getBusStatus = (r: any) => {
    if (!r.nextServiceDate) return { status: 'active', border: 'border-l-green-500', label: 'Active' };
    try {
      const now = new Date();
      const next = new Date(r.nextServiceDate);
      const diffDays = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return { status: 'overdue', border: 'border-l-red-500', label: 'Overdue', days: diffDays };
      if (diffDays <= 7) return { status: 'due', border: 'border-l-amber-500', label: 'Due Soon', days: diffDays };
      return { status: 'active', border: 'border-l-green-500', label: 'Active', days: diffDays };
    } catch {
      return { status: 'active', border: 'border-l-green-500', label: 'Active' };
    }
  };

  const getServiceBadgeClass = (type: string) => {
    const t = (type ?? '').toLowerCase();
    if (t.includes('routine')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    if (t.includes('repair')) return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    if (t.includes('inspection')) return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/60 dark:text-gray-300 dark:border-gray-700';
  };

  const summaryCounts = useMemo(() => {
    let active = 0, due = 0, overdue = 0;
    records.forEach((r) => {
      const { status } = getBusStatus(r);
      if (status === 'active') active++;
      else if (status === 'due') due++;
      else if (status === 'overdue') overdue++;
    });
    return { active, due, overdue };
  }, [records]);

  const handleMarkComplete = (r: any) => {
    const reg = r.busRegistration ?? r.registration ?? 'Unknown';
    toast({ title: 'Success', description: `Maintenance marked as complete for ${reg}` });
    setRecords((prev) => prev.filter((rec) => (rec.id ?? rec._id) !== (r.id ?? r._id)));
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Calendar View */}
      <MaintenanceCalendarView records={records} />

      {/* Fuel Cost Calculator */}
      <FuelCostCalculator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="size-5" /> Maintenance Records
          </CardTitle>
          <CardDescription>Bus service and maintenance history</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : records.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No Maintenance Records"
              description="Maintenance records will appear here after bus service entries are created."
            />
          ) : (
            <>
              {/* Summary Row */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 rounded-lg border border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20 px-4 py-2.5">
                  <div className="size-2.5 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">{summaryCounts.active}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-2.5">
                  <div className="size-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">Need Service</span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{summaryCounts.due}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20 px-4 py-2.5">
                  <div className="size-2.5 rounded-full bg-red-500" />
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <span className="text-lg font-bold text-red-700 dark:text-red-400">{summaryCounts.overdue}</span>
                </div>
              </div>

              {/* Maintenance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {records.map((r: any) => {
                  const busInfo = getBusStatus(r);
                  const reg = r.busRegistration ?? r.registration ?? '—';
                  const serviceType = r.serviceType ?? r.type ?? '—';
                  const cost = r.cost;
                  const nextDate = r.nextServiceDate;
                  const daysText = busInfo.days != null
                    ? busInfo.days < 0
                      ? `${Math.abs(busInfo.days)}d overdue`
                      : busInfo.days === 0
                        ? 'Due today'
                        : `${busInfo.days}d remaining`
                    : null;

                  return (
                    <div
                      key={r.id ?? r._id}
                      className={`card-lift rounded-xl border border-l-4 ${busInfo.border} bg-card p-4 transition-all dark:bg-card`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bus className="size-4 text-muted-foreground shrink-0" />
                          <h3 className="text-base font-bold text-foreground dark:text-foreground">{reg}</h3>
                        </div>
                        <Badge variant="outline" className={`text-[10px] capitalize shrink-0 ${getServiceBadgeClass(serviceType)}`}>
                          {serviceType}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground dark:text-muted-foreground">Service Date</span>
                          <span className="font-medium text-foreground dark:text-foreground">{formatDate(r.date ?? r.serviceDate)}</span>
                        </div>
                        {nextDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground dark:text-muted-foreground">Next Service</span>
                            <span className="font-medium text-foreground dark:text-foreground">{formatDate(nextDate)}</span>
                          </div>
                        )}
                        {daysText && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground dark:text-muted-foreground">Status</span>
                            <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                              busInfo.status === 'overdue'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                : busInfo.status === 'due'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
                            }`}>
                              {daysText}
                            </span>
                          </div>
                        )}
                        {cost != null && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground dark:text-muted-foreground">Cost Estimate</span>
                            <span className="font-bold text-foreground dark:text-foreground">₹{cost.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {r.notes && (
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-3 line-clamp-2">{r.notes}</p>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                        onClick={() => handleMarkComplete(r)}
                      >
                        <CheckCircle2 className="size-3.5 mr-1.5" />
                        Mark Complete
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Page: System Settings                                              */
/* ================================================================== */
function SettingsPage() {
  const [appName, setAppName] = useState(() => localStorage.getItem('bt_appName') || 'BusTrack Pro');
  const [timezone, setTimezone] = useState(() => localStorage.getItem('bt_timezone') || 'IST');
  const [language, setLanguage] = useState(() => localStorage.getItem('bt_language') || 'English');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('bt_dateFormat') || 'DD/MM/YYYY');
  const [emailNotif, setEmailNotif] = useState(() => localStorage.getItem('bt_emailNotif') === 'true');
  const [smsAlerts, setSmsAlerts] = useState(() => localStorage.getItem('bt_smsAlerts') === 'true');
  const [pushNotif, setPushNotif] = useState(() => localStorage.getItem('bt_pushNotif') === 'true');
  const [inAppNotif, setInAppNotif] = useState(() => localStorage.getItem('bt_inAppNotif') !== 'false');
  const [defaultPage, setDefaultPage] = useState(() => localStorage.getItem('bt_defaultPage') || 'dashboard');
  const [itemsPerPage, setItemsPerPage] = useState(() => localStorage.getItem('bt_itemsPerPage') || '10');
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('bt_compactMode') === 'true');
  const [autoRefresh, setAutoRefresh] = useState(() => parseInt(localStorage.getItem('bt_autoRefresh') || '30', 10));
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('bt_webhookUrl') || '');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const saveSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const handleToggle = (key: string, setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    saveSetting(key, String(value));
  };

  const handleResetAll = () => {
    const keys = ['bt_appName', 'bt_timezone', 'bt_language', 'bt_dateFormat', 'bt_emailNotif', 'bt_smsAlerts', 'bt_pushNotif', 'bt_inAppNotif', 'bt_defaultPage', 'bt_itemsPerPage', 'bt_compactMode', 'bt_autoRefresh', 'bt_webhookUrl'];
    keys.forEach((k) => localStorage.removeItem(k));
    setAppName('BusTrack Pro');
    setTimezone('IST');
    setLanguage('English');
    setDateFormat('DD/MM/YYYY');
    setEmailNotif(false);
    setSmsAlerts(false);
    setPushNotif(false);
    setInAppNotif(true);
    setDefaultPage('dashboard');
    setItemsPerPage('10');
    setCompactMode(false);
    setAutoRefresh(30);
    setWebhookUrl('');
    setResetDialogOpen(false);
    toast({ title: 'Success', description: 'All settings reset to defaults.' });
  };

  const handleExportDb = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('bt_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bustrack-settings-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Settings exported successfully.' });
  };

  const [lastExport, setLastExport] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportData = async (type: string, label: string) => {
    if (exporting) return;
    setExporting(type);
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bustrack-${type}-${todayStr()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setLastExport((prev) => ({ ...prev, [type]: new Date().toLocaleString() }));
      toast({ title: 'Success', description: `${label} exported successfully!` });
    } catch {
      toast({ title: 'Error', description: `Failed to export ${label}.`, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="neon-card rounded-xl p-6 page-section">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Settings2 className="size-5 text-emerald-500" /> General Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Application Name</Label>
            <Input value={appName} onChange={(e) => { setAppName(e.target.value); saveSetting('bt_appName', e.target.value); }} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={(v) => { setTimezone(v); saveSetting('bt_timezone', v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="IST">IST (UTC+5:30)</SelectItem>
                <SelectItem value="UTC">UTC (UTC+0:00)</SelectItem>
                <SelectItem value="EST">EST (UTC-5:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={language} onValueChange={(v) => { setLanguage(v); saveSetting('bt_language', v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Hindi">Hindi</SelectItem>
                <SelectItem value="Kannada">Kannada</SelectItem>
                <SelectItem value="Tamil">Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date Format</Label>
            <Select value={dateFormat} onValueChange={(v) => { setDateFormat(v); saveSetting('bt_dateFormat', v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="neon-card rounded-xl p-6 page-section">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Bell className="size-5 text-amber-500" /> Notification Settings
        </h3>
        <div className="space-y-4">
          {[
            { label: 'Email Notifications', desc: 'Receive updates and alerts via email', key: 'bt_emailNotif', value: emailNotif, setter: setEmailNotif, icon: Mail },
            { label: 'SMS Alerts', desc: 'Get critical alerts as SMS messages', key: 'bt_smsAlerts', value: smsAlerts, setter: setSmsAlerts, icon: Smartphone },
            { label: 'Push Notifications', desc: 'Browser push notifications for real-time updates', key: 'bt_pushNotif', value: pushNotif, setter: setPushNotif, icon: Bell },
            { label: 'In-App Notifications', desc: 'Show notifications within the application', key: 'bt_inAppNotif', value: inAppNotif, setter: setInAppNotif, icon: Monitor },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch checked={item.value} onCheckedChange={(v) => handleToggle(item.key, item.setter, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Display Settings */}
      <div className="neon-card rounded-xl p-6 page-section">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Monitor className="size-5 text-sky-500" /> Display Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Default Page on Login</Label>
            <Select value={defaultPage} onValueChange={(v) => { setDefaultPage(v); saveSetting('bt_defaultPage', v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="routes">Routes</SelectItem>
                <SelectItem value="schedules">Schedules</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Items Per Page</Label>
            <Select value={itemsPerPage} onValueChange={(v) => { setItemsPerPage(v); saveSetting('bt_itemsPerPage', v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Compact Mode</p>
              <p className="text-xs text-muted-foreground">Reduce spacing for denser information display</p>
            </div>
            <Switch checked={compactMode} onCheckedChange={(v) => handleToggle('bt_compactMode', setCompactMode, v)} />
          </div>
          <div className="rounded-lg border p-4 sm:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">Auto-Refresh Interval</p>
                <p className="text-xs text-muted-foreground">How often data refreshes automatically</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{autoRefresh}s</span>
            </div>
            <Slider
              value={[autoRefresh]}
              onValueChange={(v) => { setAutoRefresh(v[0]); saveSetting('bt_autoRefresh', String(v[0])); }}
              min={5}
              max={120}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>5s</span>
              <span>60s</span>
              <span>120s</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <div className="neon-card rounded-xl p-6 page-section">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Wifi className="size-5 text-violet-500" /> API Settings
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value="bustrack_sk_a1b2c3d4e5f6g7h8i9j0"
                readOnly
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Webhook URL</Label>
            <Input
              placeholder="https://your-server.com/webhook"
              value={webhookUrl}
              onChange={(e) => { setWebhookUrl(e.target.value); saveSetting('bt_webhookUrl', e.target.value); }}
            />
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Rate Limit</p>
                <p className="text-xs text-muted-foreground">API requests allowed per minute</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">100</span>
                <span className="text-xs text-muted-foreground">req/min</span>
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 ml-2">
                  <CheckCircle2 className="size-3 mr-1" />
                  Normal
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-rose-200 dark:border-rose-800/50 p-6 page-section">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="size-5" /> Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Irreversible actions that affect your entire account.</p>
        <div className="flex flex-wrap gap-3">
          <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <RotateCcw className="size-4 mr-1.5" />
                Reset All Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset All Settings?</DialogTitle>
                <DialogDescription>
                  This will reset all settings to their default values. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleResetAll}>
                  <RotateCcw className="size-4 mr-1.5" />
                  Reset All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportDb}>
            <Download className="size-4 mr-1.5" />
            Export Settings
          </Button>
        </div>
      </div>

      {/* Data Management */}
      <div className="neon-card rounded-xl p-6 page-section">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <FileSpreadsheet className="size-5 text-emerald-500" /> Data Management
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Export data as CSV files for external analysis, reporting, or backup purposes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { type: 'routes', label: 'Export All Routes', icon: Route, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
            { type: 'crew', label: 'Export All Crew', icon: Users, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' },
            { type: 'analytics', label: 'Export Analytics', icon: BarChart3, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
            { type: 'journeys', label: 'Export Journeys', icon: Navigation, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50' },
          ].map((exp) => {
            const IconComp = exp.icon;
            return (
              <button
                key={exp.type}
                onClick={() => handleExportData(exp.type, exp.label)}
                disabled={!!exporting}
                className="card-lift flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all hover:border-emerald-300 dark:hover:border-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className={`rounded-lg p-2.5 ${exp.color}`}>
                  {exporting === exp.type ? (
                    <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <IconComp className="size-5" />
                  )}
                </div>
                <span className="text-xs font-medium">{exp.label}</span>
                {lastExport[exp.type] && (
                  <span className="text-[10px] text-muted-foreground">
                    Last: {lastExport[exp.type]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Footer                                                             */
/* ================================================================== */
function AdminFooter() {
  return (
    <footer className="mt-auto border-t bg-background/80 backdrop-blur-sm px-6 py-3">
      <p className="text-center text-xs text-muted-foreground">
        © 2025 BusTrack Pro • v2.0.0
      </p>
    </footer>
  );
}

/* ================================================================== */
/*  Users Management Page — with approve/reject, pagination, details   */
/* ================================================================== */
function UsersPage({ token }: { token: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pendingUsers', token }) }),
        fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'users', token }) }),
      ]);
      const pendingData = await pendingRes.json();
      const allData = await allRes.json();
      setPendingUsers(pendingData.users || []);
      setUsers(allData.users || []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, roleFilter]);

  const handleApprove = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approveUser', token, userId, status }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: `User ${status}`, description: `User has been ${status} successfully.` });
      fetchUsers();
      // Update selected user if dialog is open
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, approvalStatus: status });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  const handlePatchStatus = async (userId: string, approvalStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approvalStatus }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Status Updated', description: `User approval status changed to ${approvalStatus}.` });
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, approvalStatus });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteUser', token, userId }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'User Deleted', description: `${userName} has been removed.` });
      fetchUsers();
      if (selectedUser?.id === userId) {
        setDetailsOpen(false);
        setSelectedUser(null);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const filteredUsers = (activeTab === 'pending' ? pendingUsers : users).filter(u => {
    const matchSearch = !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleOpenDetails = (user: any) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    };
    return styles[status] || styles.pending;
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
      driver: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      conductor: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300',
      customer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    };
    return styles[role] || '';
  };

  const rolePills = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'admin', label: 'Admin', icon: Shield },
    { key: 'driver', label: 'Driver', icon: Bus },
    { key: 'conductor', label: 'Conductor', icon: UserCheck },
    { key: 'customer', label: 'Customer', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage accounts, approve registrations, and monitor user activity</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Pending
              {pendingUsers.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">{pendingUsers.length}</span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              All Users
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">{users.length}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{pendingUsers.length}</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{users.length}</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/10 border border-rose-200/50 dark:border-rose-800/30">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Admins</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950/30 dark:to-sky-900/10 border border-sky-200/50 dark:border-sky-800/30">
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">Customers</p>
          <p className="text-2xl font-bold text-sky-700 dark:text-sky-300 mt-1">{users.filter(u => u.role === 'customer').length}</p>
        </div>
      </div>

      {/* Search + Role Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {rolePills.map(pill => {
            const PillIcon = pill.icon;
            const isActive = roleFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setRoleFilter(pill.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                <PillIcon className="w-3 h-3" />
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <svg className="animate-spin h-6 w-6 mx-auto mb-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Loading users...
                </td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                  {activeTab === 'pending' ? 'No pending approvals' : 'No users found'}
                </td></tr>
              ) : (
                paginatedUsers.map(u => (
                  <tr
                    key={u.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(u)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadge(u.approvalStatus)}`}>
                        {u.approvalStatus || 'approved'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</p>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetails(u)}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        {u.approvalStatus === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(u.id, 'approved')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => handleApprove(u.id, 'rejected')} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  typeof item === 'string' ? (
                    <span key={`dots-${idx}`} className="px-1 text-xs text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                        currentPage === item
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                {(selectedUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p>{selectedUser?.name || 'Unknown'}</p>
                <p className="text-sm font-normal text-muted-foreground">{selectedUser?.email || ''}</p>
              </div>
            </DialogTitle>
            <DialogDescription>View and manage user details</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* Role & Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(selectedUser.approvalStatus)}`}>
                  {selectedUser.approvalStatus || 'approved'}
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Joined</p>
                  <p className="text-sm font-medium">{selectedUser.createdAt ? formatDateTime(selectedUser.createdAt) : '—'}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Phone</p>
                  <p className="text-sm font-medium">{selectedUser.phone || 'Not set'}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">User ID</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">{selectedUser.id}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Role</p>
                  <p className="text-sm font-medium capitalize">{selectedUser.role}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Change Approval Status</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePatchStatus(selectedUser.id, 'approved')}
                    disabled={updatingStatus || selectedUser.approvalStatus === 'approved'}
                    className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-200 dark:disabled:bg-emerald-900 disabled:text-emerald-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handlePatchStatus(selectedUser.id, 'pending')}
                    disabled={updatingStatus || selectedUser.approvalStatus === 'pending'}
                    className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 dark:disabled:bg-amber-900 disabled:text-amber-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" /> Reset to Pending
                  </button>
                  <button
                    onClick={() => handlePatchStatus(selectedUser.id, 'rejected')}
                    disabled={updatingStatus || selectedUser.approvalStatus === 'rejected'}
                    className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-200 dark:disabled:bg-red-900 disabled:text-red-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedUser?.role !== 'admin' && (
              <button
                onClick={() => { if (selectedUser) handleDelete(selectedUser.id, selectedUser.name); }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete User
              </button>
            )}
            <button
              onClick={() => setDetailsOpen(false)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================== */
/*  Page: Approve IDs                                                  */
/* ================================================================== */
function ApproveIDsPage({ token }: { token: string }) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'pendingUsers', token }),
      });
      setPendingUsers(Array.isArray(data.users) ? data.users : []);
    } catch {
      setPendingUsers([]);
      toast({ title: 'Error', description: 'Failed to fetch pending users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  const handleApprove = async (userId: string, userName: string) => {
    setProcessing(userId);
    try {
      await apiFetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'approveUser', token, userId, status: 'approved' }),
      });
      toast({ title: 'Approved', description: `${userName} has been approved successfully` });
      fetchPendingUsers();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed to approve: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    setProcessing(userId);
    try {
      await apiFetch('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'approveUser', token, userId, status: 'rejected' }),
      });
      toast({ title: 'Rejected', description: `${userName} has been rejected`, variant: 'destructive' });
      fetchPendingUsers();
    } catch (err: unknown) {
      toast({ title: 'Error', description: `Failed to reject: ${err instanceof Error ? err.message : 'Unknown error'}`, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'driver': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'conductor': return 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="size-5" /> Approve IDs
                {pendingUsers.length > 0 && (
                  <Badge className="bg-amber-500 text-white ml-1">{pendingUsers.length} pending</Badge>
                )}
              </CardTitle>
              <CardDescription>Review and approve or reject new user registrations</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPendingUsers} disabled={loading}>
              <RotateCcw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeletonShimmer rows={3} cols={5} />
          ) : pendingUsers.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All Caught Up!"
              description="No pending user approvals. New registrations will appear here."
            />
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((u: any, idx: number) => (
                    <TableRow key={u.id} className={`${idx % 2 === 0 ? '' : 'bg-muted/30'} hover:bg-muted/50 hover:shadow-[inset_3px_0_0_#10b981] transition-all`}>
                      <TableCell className="font-medium">{u.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${roleBadgeClass(u.role)}`}>
                          {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.createdAt ? formatDateTime(u.createdAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 h-7"
                            disabled={processing === u.id}
                            onClick={() => handleApprove(u.id, u.name ?? 'User')}
                          >
                            {processing === u.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs gap-1 h-7"
                            disabled={processing === u.id}
                            onClick={() => handleReject(u.id, u.name ?? 'User')}
                          >
                            {processing === u.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <XCircle className="size-3.5" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================== */
/*  Main Export                                                        */
/* ================================================================== */
export default function AdminContent({ portal, userId, token, setPortal }: Props) {
  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [portal]);

  // Keyboard shortcuts: 1-9 to switch pages
  const pageMap: Record<string, string> = {
    '1': 'dashboard',
    '2': 'routes',
    '3': 'schedules',
    '4': 'crew',
    '5': 'traffic',
    '6': 'holidays',
    '7': 'analytics',
    '8': 'maintenance',
    '9': 'settings',
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      // Don't trigger if user is in a dialog
      if ((e.target as HTMLElement)?.closest('[role="dialog"]')) return;

      const page = pageMap[e.key];
      if (page && page !== portal) {
        setPortal(page);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [portal, setPortal]);

  const pageContent = (() => {
    switch (portal) {
      case 'dashboard':
        return <DashboardPage token={token} setPortal={setPortal} />;
      case 'users':
        return <UsersPage token={token} />;
      case 'approve':
        return <ApproveIDsPage token={token} />;
      case 'routes':
        return <RoutesPage token={token} />;
      case 'schedules':
        return <SchedulesPage token={token} />;
      case 'crew':
        return <CrewPage token={token} />;
      case 'traffic':
        return <TrafficPage token={token} />;
      case 'holidays':
        return <HolidaysPage token={token} userId={userId} />;
      case 'analytics':
        return <AnalyticsPage token={token} />;
      case 'maintenance':
        return <MaintenancePage token={token} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage token={token} setPortal={setPortal} />;
    }
  })();

  /* Scroll progress state */
  const [scrollPercent, setScrollPercent] = useState(0);
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 1;
      const clientHeight = document.documentElement.clientHeight || document.body.clientHeight || 1;
      const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPercent(Math.min(Math.max(percent, 0), 100));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={portalRef} className="flex min-h-full flex-col">
      {/* Scroll Progress Indicator */}
      <div className="scroll-progress" style={{ width: `${scrollPercent}%` }} />
      {/* Keyboard Shortcut Hints Banner */}
      <div className="hidden lg:block px-4 pb-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider mr-1 opacity-50">Shortcuts:</span>
          {Object.entries(pageMap).map(([key, page]) => (
            <span key={key} className="flex items-center gap-1">
              <kbd className="inline-flex items-center justify-center size-4 rounded border bg-muted/50 font-mono text-[9px] font-bold text-foreground/70 dark:text-foreground/50">{key}</kbd>
              <span className="capitalize">{page}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <QuickStatsRibbon />
        {pageContent}
      </div>
      {/* STYLE: Footer */}
      <AdminFooter />
    </div>
  );
}
