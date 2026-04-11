'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { format, subDays } from 'date-fns';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import {
  Wallet,
  Bus,
  CalendarClock,
  CheckCircle2,
  Search,
  MapPin,
  Map,
  ArrowRight,
  Clock,
  IndianRupee,
  Route,
  Star,
  XCircle,
  Loader2,
  Navigation,
  TrendingUp,
  Heart,
  HeartOff,
  Users,
  Calculator,
  GitCompareArrows,
  Sparkles,
  Ticket,
  Timer,
  Download,
  Wifi,
  Snowflake,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Dynamic leaflet imports to avoid SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  portal: string;
  userId: string;
  token: string;
  setPortal: (p: string) => void;
}

// API returns: { totalSpent, totalTrips, avgRating }
interface SpendingStats {
  totalSpent: number;
  totalTrips: number;
  avgRating: number;
}

// API journey: { route: { routeNumber, startLocation, endLocation, fare, distanceKm }, schedule: { departureTime, date, status }, cost, status, bookingDate }
interface RouteNested {
  routeNumber?: string;
  startLocation?: string;
  endLocation?: string;
  fare?: number;
  distanceKm?: number;
}

interface ScheduleNested {
  departureTime?: string;
  date?: string;
  status?: string;
}

interface Journey {
  id: string;
  route?: RouteNested;
  schedule?: ScheduleNested;
  cost?: number;
  status?: string;
  bookingDate?: string;
  rating?: number;
  feedback?: string;
}

// API route: { routeNumber, startLocation, endLocation, distanceKm, durationMin, fare, trafficLevel, city, stopsJson? }
interface RouteResult {
  id: string;
  routeNumber: string;
  startLocation: string;
  endLocation: string;
  distanceKm?: number;
  durationMin?: number;
  fare?: number;
  trafficLevel?: string;
  city?: string;
  stopsJson?: string;
  stopsCount?: number;
}

interface Schedule {
  id: string;
  routeId: string;
  departureTime: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Safe accessors for nested journey fields
function jRouteNumber(j: Journey): string { return j.route?.routeNumber ?? '—'; }
function jStartLocation(j: Journey): string { return j.route?.startLocation ?? ''; }
function jEndLocation(j: Journey): string { return j.route?.endLocation ?? ''; }
function jDate(j: Journey): string { return j.schedule?.date ?? '—'; }
function jTime(j: Journey): string { return j.schedule?.departureTime ?? '—'; }
function jFare(j: Journey): number | undefined { return j.route?.fare; }
function jDistance(j: Journey): number | undefined { return j.route?.distanceKm; }

function getTodayString() {
  return format(new Date(), 'yyyy-MM-dd');
}

function formatCurrency(amount: number | undefined) {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function trafficBadge(level: string | undefined) {
  if (!level) return <Badge variant="secondary">Unknown</Badge>;
  const cls: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    severe: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <Badge variant="outline" className={cls[level.toLowerCase()] ?? cls.moderate}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function statusBadge(status: string | undefined) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const cls: Record<string, string> = {
    planned: 'bg-sky-100 text-sky-700 border-sky-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <Badge variant="outline" className={cls[status.toLowerCase()] ?? cls.planned}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Seat availability indicator
function seatAvailabilityIndicator(trafficLevel: string | undefined) {
  if (!trafficLevel) return { color: 'bg-gray-300', label: 'Unknown', pct: 50 };
  const map: Record<string, { color: string; label: string; pct: number }> = {
    low: { color: 'bg-emerald-500', label: 'Many seats', pct: 20 },
    moderate: { color: 'bg-amber-500', label: 'Filling up', pct: 55 },
    high: { color: 'bg-orange-500', label: 'Few seats', pct: 80 },
    severe: { color: 'bg-red-500', label: 'Almost full', pct: 95 },
  };
  return map[trafficLevel.toLowerCase()] ?? map.moderate;
}

// Favorites helpers (localStorage)
const FAVORITES_KEY = 'customer-favorite-routes';

function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
  } catch { return []; }
}

function setFavorites(ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function toggleFavorite(routeId: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(routeId);
  if (idx >= 0) {
    favs.splice(idx, 1);
    setFavorites(favs);
    return false;
  }
  favs.push(routeId);
  setFavorites(favs);
  return true;
}

function isFavorite(routeId: string): boolean {
  return getFavorites().includes(routeId);
}

// Fare estimator: ₹5 base + ₹2 per km
function estimateFare(distanceKm: number): number {
  return 5 + distanceKm * 2;
}

// Generate a deterministic "random" seat number from journey id
function seatFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const row = Math.abs(hash % 20) + 1;
  const seatLetters = ['A', 'B', 'C', 'D'];
  const col = Math.abs((hash >> 4) % 4);
  return `${row}${seatLetters[col]}`;
}

// ─── QR Code SVG Pattern ────────────────────────────────────────────────────

function QRPattern({ seed }: { seed: string }) {
  // Generate a deterministic QR-like pattern from seed string
  const cells: boolean[][] = [];
  for (let r = 0; r < 9; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < 9; c++) {
      // Corner finder patterns (3x3 squares)
      const isCorner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      if (isCorner) {
        // Finder pattern: outer border + inner dot
        const isBorder = r === 0 || r === 2 || c === 0 || c === 2 || r === 6 || r === 8 || c === 6 || c === 8;
        const isInner = (r === 1 && c === 1) || (r === 1 && c === 7) || (r === 7 && c === 1);
        row.push(isBorder || isInner);
      } else {
        // Data cells - deterministic from seed
        const idx = r * 9 + c;
        const ch = seed.charCodeAt(idx % seed.length);
        row.push((ch * (idx + 1)) % 3 !== 0);
      }
    }
    cells.push(row);
  }

  return (
    <svg width="64" height="64" viewBox="0 0 9 9" className="rounded">
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="currentColor" />
          ) : null
        )
      )}
    </svg>
  );
}

// ─── Tear Line Component ────────────────────────────────────────────────────

function TearLine() {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-background" />
      <div className="w-full border-t-2 border-dashed border-muted-foreground/25" />
    </div>
  );
}

// ─── Star Rating Component ───────────────────────────────────────────────────

function StarRating({
  rating,
  onChange,
}: {
  rating: number;
  onChange?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`size-5 transition-colors ${
            s <= (hovered || rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          } ${onChange ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => onChange && setHovered(s)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(s)}
        />
      ))}
    </div>
  );
}

// ─── Seat Availability Badge ─────────────────────────────────────────────────

function SeatBadge({ trafficLevel }: { trafficLevel: string | undefined }) {
  const info = seatAvailabilityIndicator(trafficLevel);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${info.color}`} />
      <span className="text-xs text-muted-foreground">{info.label}</span>
    </div>
  );
}

// ─── Spending Donut Chart ────────────────────────────────────────────────────

function SpendingDonut({ totalSpent }: { totalSpent: number }) {
  const segments = useMemo(() => {
    if (totalSpent <= 0) return [];
    const busFares = Math.round(totalSpent * 0.58);
    const seasonPass = Math.round(totalSpent * 0.28);
    const other = totalSpent - busFares - seasonPass;
    return [
      { label: 'Bus Fares', value: busFares, color: '#10b981', pct: 58 },
      { label: 'Season Pass', value: seasonPass, color: '#f59e0b', pct: 28 },
      { label: 'Other', value: other, color: '#8b5cf6', pct: 14 },
    ];
  }, [totalSpent]);

  if (segments.length === 0) return null;

  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted-foreground/10"
          />
          {/* Segments */}
          {segments.map((seg, i) => {
            const offset = (accumulated / 100) * circumference;
            const segLen = (seg.pct / 100) * circumference;
            accumulated += seg.pct;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rating Distribution Chart ───────────────────────────────────────────────

function RatingDistribution({ journeys }: { journeys: Journey[] }) {
  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // 1-5 stars
    for (const j of journeys) {
      const r = j.rating ?? 0;
      if (r >= 1 && r <= 5) counts[r - 1]++;
    }
    const maxCount = Math.max(...counts, 1);
    return counts.map((count, idx) => ({
      stars: idx + 1,
      count,
      pct: (count / maxCount) * 100,
    }));
  }, [journeys]);

  const totalRatings = distribution.reduce((s, d) => s + d.count, 0);
  const avgRating = totalRatings > 0
    ? distribution.reduce((s, d) => s + d.stars * d.count, 0) / totalRatings
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Overall Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
            {avgRating > 0 && (
              <div>
                <StarRating rating={Math.round(avgRating)} />
                <p className="text-xs text-muted-foreground mt-0.5">{totalRatings} rating{totalRatings !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Bar chart */}
      <div className="space-y-2">
        {[...distribution].reverse().map(d => (
          <div key={d.stars} className="flex items-center gap-3">
            <span className="w-12 text-sm text-right text-muted-foreground">{d.stars} ★</span>
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-muted-foreground/10">
                <div
                  className="h-3 rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-sm font-medium text-right">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Route Detail Panel ─────────────────────────────────────────────────────

function RouteDetailPanel({
  route,
  onBook,
  isBooking,
}: {
  route: RouteResult;
  onBook: () => void;
  isBooking: boolean;
}) {
  const stops = useMemo(() => {
    if (!route.stopsJson) return [];
    try {
      return JSON.parse(route.stopsJson) as { name: string; lat?: number; lng?: number }[];
    } catch {
      return [];
    }
  }, [route.stopsJson]);

  // If no stops from JSON, generate fake stops from start/end
  const displayStops = useMemo(() => {
    if (stops.length > 0) return stops.slice(0, 8);
    const fake = [route.startLocation];
    const midCount = Math.min(6, Math.max(2, Math.floor((route.distanceKm ?? 10) / 5)));
    for (let i = 1; i <= midCount; i++) {
      fake.push(`Stop ${i}`);
    }
    fake.push(route.endLocation);
    return fake;
  }, [stops, route]);

  const amenities = [
    { icon: Wifi, label: 'Free WiFi', available: true },
    { icon: Snowflake, label: 'Air Conditioning', available: route.city !== 'intercity' },
    { icon: Users, label: '40 Seats', available: true },
  ];

  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Route timeline */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">Route Timeline</p>
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-400 via-amber-400 to-red-400" />
          <div className="space-y-3">
            {displayStops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === displayStops.length - 1;
              const dotColor = isFirst
                ? 'bg-emerald-500 ring-emerald-200'
                : isLast
                  ? 'bg-red-500 ring-red-200'
                  : 'bg-amber-400 ring-amber-200';
              return (
                <div key={idx} className="flex items-center gap-3 pl-1">
                  <div className={`relative z-10 h-[10px] w-[10px] rounded-full shrink-0 ring-2 ${dotColor}`} />
                  <span className={`text-sm ${isFirst || isLast ? 'font-medium' : 'text-muted-foreground'}`}>
                    {stop.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Bus Amenities</p>
        <div className="flex flex-wrap gap-3">
          {amenities.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                a.available
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-muted bg-muted/50 text-muted-foreground'
              }`}
            >
              <a.icon className="size-3.5" />
              <span>{a.label}</span>
              {a.available && (
                <CheckCircle2 className="size-3 text-emerald-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Book Now button */}
      <Button
        className="w-full animate-in fade-in slide-in-from-bottom-1 duration-500"
        onClick={onBook}
        disabled={isBooking}
      >
        {isBooking ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Ticket className="size-4" />
        )}
        Book Now — {formatCurrency(route.fare)}
      </Button>
    </div>
  );
}

// ─── Dashboard Skeleton ──────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({
  userId,
  setPortal,
}: {
  userId: string;
  setPortal: (p: string) => void;
}) {
  const [stats, setStats] = useState<SpendingStats | null>(null);
  const [recentJourneys, setRecentJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/journeys?customerId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();

        // Fix: map spendingStats fields from API (totalSpent, totalTrips, avgRating)
        const rawStats = data.spendingStats ?? {};
        const allJourneys: Journey[] = data.journeys ?? [];
        const plannedCount = allJourneys.filter((j: Journey) => j.status === 'planned').length;
        const completedCount = allJourneys.filter((j: Journey) => j.status === 'completed').length;

        setStats({
          totalSpent: rawStats.totalSpent ?? 0,
          totalTrips: rawStats.totalTrips ?? 0,
          avgRating: rawStats.avgRating ?? 0,
        });
        setRecentJourneys(
          allJourneys.filter((j: Journey) => j.status === 'planned').slice(0, 5)
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setFavoriteRoutes(getFavorites());
  }, [userId]);

  const hourGreeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center text-red-600">
          <p className="font-medium">Failed to load dashboard</p>
          <p className="mt-1 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const plannedCount = stats ? recentJourneys.length : 0;
  const completedCount = stats?.totalTrips ? Math.max(0, stats.totalTrips - plannedCount) : 0;

  const statCards = [
    {
      title: 'Total Spent',
      value: formatCurrency(stats?.totalSpent),
      icon: Wallet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Trips',
      value: String(stats?.totalTrips ?? 0),
      icon: Bus,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      title: 'Planned Journeys',
      value: String(plannedCount),
      icon: CalendarClock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Avg Rating',
      value: stats?.avgRating ? `${stats.avgRating.toFixed(1)} / 5` : 'N/A',
      icon: Star,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Greeting Card with Gradient */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground">
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5" />
              <p className="text-sm font-medium opacity-90">{hourGreeting}!</p>
            </div>
            <h2 className="mt-1 text-2xl font-bold">Welcome to Your Dashboard</h2>
            <p className="mt-1 text-sm opacity-80">
              {stats?.totalTrips
                ? `You&apos;ve taken ${stats.totalTrips} trip${stats.totalTrips > 1 ? 's' : ''} and spent ${formatCurrency(stats.totalSpent)}. Keep exploring!`
                : 'Start exploring routes and plan your first trip today.'}
            </p>
          </div>
          {stats?.avgRating ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-5 py-3 backdrop-blur-sm">
              <Star className="size-6 fill-amber-400 text-amber-400" />
              <div>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                <p className="text-xs opacity-80">Avg Rating</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s => (
          <Card key={s.title} className="hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`size-6 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-xl font-bold tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Spending Overview Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-emerald-500" />
            Spending Overview
          </CardTitle>
          <CardDescription>Breakdown of your travel expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4">
            <SpendingDonut totalSpent={stats?.totalSpent ?? 0} />
          </div>
        </CardContent>
      </Card>

      {/* Favorite Routes */}
      {favoriteRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="size-5 text-rose-500" />
              Favorite Routes
              <Badge variant="secondary" className="ml-2">{favoriteRoutes.length}</Badge>
            </CardTitle>
            <CardDescription>Quick access to your saved routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteRoutes.map(favId => (
                <div key={favId} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <Heart className="size-4 fill-rose-500 text-rose-500" />
                  <span className="font-medium">{favId}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Planned Journeys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-amber-500" />
            Upcoming Journeys
          </CardTitle>
          <CardDescription>Your recently planned trips</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJourneys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bus className="mb-3 size-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">No planned journeys yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setPortal('search')}
              >
                <Search className="size-4" />
                Find Routes
              </Button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJourneys.map(j => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{jRouteNumber(j)}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{jStartLocation(j)}</span>
                        <ArrowRight className="mx-1 inline size-3 text-muted-foreground" />
                        <span>{jEndLocation(j)}</span>
                      </TableCell>
                      <TableCell>{jDate(j)}</TableCell>
                      <TableCell>{jTime(j)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(j.cost)}</TableCell>
                      <TableCell>{statusBadge(j.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          className="group cursor-pointer border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
          onClick={() => setPortal('search')}
        >
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Search className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Search Routes</p>
                <p className="text-sm text-muted-foreground">Find available bus routes</p>
              </div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer border-dashed border-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
          onClick={() => setPortal('map')}
        >
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Map className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">View Route Map</p>
                <p className="text-sm text-muted-foreground">Explore routes on an interactive map</p>
              </div>
            </div>
            <ArrowRight className="size-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Route Comparison Modal ──────────────────────────────────────────────────

function RouteComparison({
  routes,
  onClose,
}: {
  routes: RouteResult[];
  onClose: () => void;
}) {
  if (routes.length === 0) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitCompareArrows className="size-5 text-primary" />
            Route Comparison
            <Badge variant="secondary" className="ml-2">{routes.length} routes</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="size-4" />
          </Button>
        </div>
        <CardDescription>Compare selected routes side by side</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Attribute</TableHead>
                {routes.map(r => (
                  <TableHead key={r.id} className="min-w-[160px] text-center">
                    <span className="font-bold">{r.routeNumber}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Route</TableCell>
                {routes.map(r => (
                  <TableCell key={r.id} className="text-center text-sm">
                    {r.startLocation} → {r.endLocation}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Distance</TableCell>
                {routes.map(r => (
                  <TableCell key={r.id} className="text-center">
                    {r.distanceKm ? `${r.distanceKm} km` : '—'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Duration</TableCell>
                {routes.map(r => (
                  <TableCell key={r.id} className="text-center">
                    {formatDuration(r.durationMin)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Fare</TableCell>
                {routes.map(r => {
                  const fares = routes.map(rt => rt.fare ?? 0).filter(f => f > 0);
                  const isCheapest = fares.length > 1 && r.fare === Math.min(...fares);
                  return (
                    <TableCell key={r.id} className={`text-center font-semibold ${isCheapest ? 'text-emerald-600' : ''}`}>
                      {formatCurrency(r.fare)}
                      {isCheapest && <span className="ml-1 text-xs"> (Best)</span>}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Traffic</TableCell>
                {routes.map(r => (
                  <TableCell key={r.id} className="text-center">
                    {trafficBadge(r.trafficLevel)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Fare/km</TableCell>
                {routes.map(r => {
                  const perKm = r.distanceKm && r.fare ? (r.fare / r.distanceKm).toFixed(1) : '—';
                  return (
                    <TableCell key={r.id} className="text-center text-sm text-muted-foreground">
                      {perKm !== '—' ? `₹${perKm}/km` : '—'}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Seats</TableCell>
                {routes.map(r => (
                  <TableCell key={r.id} className="text-center">
                    <SeatBadge trafficLevel={r.trafficLevel} />
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Fare Calculator ─────────────────────────────────────────────────────────

function FareCalculator() {
  const [distance, setDistance] = useState('');

  const estimated = useMemo(() => {
    const km = parseFloat(distance);
    if (isNaN(km) || km <= 0) return null;
    return estimateFare(km);
  }, [distance]);

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="size-4 text-amber-600" />
          Fare Estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Distance (km)"
            value={distance}
            onChange={e => setDistance(e.target.value)}
            className="h-9 w-full"
            min="0"
          />
          <span className="shrink-0 text-sm text-muted-foreground">km</span>
        </div>
        {estimated !== null && (
          <div className="rounded-lg bg-white/70 px-3 py-2">
            <p className="text-xs text-muted-foreground">Estimated fare:</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(estimated)}</p>
            <p className="text-xs text-muted-foreground">₹5 base + ₹2/km</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Search Routes ───────────────────────────────────────────────────────────

function SearchRoutes({
  userId,
}: {
  userId: string;
}) {
  const [locations, setLocations] = useState<string[]>([]);
  const [allRoutes, setAllRoutes] = useState<RouteResult[]>([]);
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [city, setCity] = useState('all');
  const [results, setResults] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  // Load locations and all routes for popular section
  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        const res = await fetch('/api/routes');
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data.locations ?? []);
        setAllRoutes(data.routes ?? []);
        setFavs(new Set(getFavorites()));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load locations');
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  const popularRoutes = useMemo(() => {
    // Take top 5 routes sorted by fare (cheapest popular routes)
    return [...allRoutes].sort((a, b) => (a.fare ?? 0) - (b.fare ?? 0)).slice(0, 5);
  }, [allRoutes]);

  const handleSearch = useCallback(async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations');
      return;
    }
    try {
      setSearching(true);
      setError('');
      setHasSearched(true);
      const params = new URLSearchParams({ startLocation, endLocation, city });
      const res = await fetch(`/api/routes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search routes');
      const data = await res.json();
      setResults(data.routes ?? []);
      setSelectedForCompare(new Set());
      setShowComparison(false);
      setExpandedRouteId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [startLocation, endLocation, city]);

  const handleBook = useCallback(async (route: RouteResult) => {
    try {
      setBookingId(route.id);
      const scheduleRes = await fetch(`/api/schedules?routeId=${route.id}&date=${date}`);
      if (!scheduleRes.ok) throw new Error('Failed to find schedule');
      const scheduleData = await scheduleRes.json();
      const schedules: Schedule[] = scheduleData.schedules ?? [];
      if (schedules.length === 0) {
        setError(`No schedule available for route ${route.routeNumber} on ${date}`);
        setBookingId(null);
        return;
      }
      const schedule = schedules[0];

      const bookRes = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          customerId: userId,
          routeId: route.id,
          scheduleId: schedule.id,
        }),
      });
      if (!bookRes.ok) throw new Error('Booking failed');
      toast({
        title: 'Booking Confirmed!',
        description: `Successfully booked route ${route.routeNumber}. Happy journey!`,
      });
      setExpandedRouteId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBookingId(null);
    }
  }, [userId, date]);

  const toggleCompare = useCallback((routeId: string) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
      } else if (next.size < 3) {
        next.add(routeId);
      } else {
        setError('You can compare up to 3 routes at a time');
        return prev;
      }
      setShowComparison(next.size >= 2);
      return next;
    });
  }, []);

  const handleToggleFavorite = useCallback((routeId: string) => {
    const nowFav = toggleFavorite(routeId);
    setFavs(new Set(getFavorites()));
  }, []);

  const comparedRoutes = useMemo(() => {
    return results.filter(r => selectedForCompare.has(r.id));
  }, [results, selectedForCompare]);

  const cityOptions = [
    { value: 'all', label: 'All Cities' },
    { value: 'BLR', label: 'Bengaluru (BLR)' },
    { value: 'MUM', label: 'Mumbai (MUM)' },
    { value: 'DEL', label: 'Delhi (DEL)' },
    { value: 'CHN', label: 'Chennai (CHN)' },
    { value: 'intercity', label: 'Intercity' },
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-5 text-primary" />
            Search Bus Routes
          </CardTitle>
          <CardDescription>Find available routes between locations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-10 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">From</label>
                  <Select value={startLocation} onValueChange={setStartLocation}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Start location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">To</label>
                  <Select value={endLocation} onValueChange={setEndLocation}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="End location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">City</label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cityOptions.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    className="w-full"
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    {searching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    Search
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-red-600">
            <XCircle className="size-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              &times;
            </button>
          </CardContent>
        </Card>
      )}

      {/* Popular Routes (before search) */}
      {!hasSearched && !loading && popularRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-emerald-500" />
              Popular Routes
            </CardTitle>
            <CardDescription>Most affordable routes available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularRoutes.map(route => (
                <Card key={route.id} className="border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Badge variant="outline" className="font-mono">{route.routeNumber}</Badge>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="size-3 text-emerald-500" />
                          <span>{route.startLocation}</span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-medium">{route.endLocation}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {route.distanceKm && <span>{route.distanceKm} km</span>}
                          <span>{formatCurrency(route.fare)}</span>
                          {trafficBadge(route.trafficLevel)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleToggleFavorite(route.id)}
                      >
                        <Heart className={`size-4 ${favs.has(route.id) ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fare Calculator */}
      <FareCalculator />

      {/* Route Comparison */}
      {showComparison && (
        <RouteComparison
          routes={comparedRoutes}
          onClose={() => {
            setShowComparison(false);
            setSelectedForCompare(new Set());
          }}
        />
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2">
                <Route className="size-5 text-primary" />
                Search Results
                <Badge variant="secondary" className="ml-2">{results.length} routes</Badge>
              </CardTitle>
              {selectedForCompare.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {selectedForCompare.size} selected for compare
                  </span>
                  {selectedForCompare.size >= 2 && (
                    <Button size="sm" variant="outline" onClick={() => setShowComparison(true)}>
                      <GitCompareArrows className="size-3" />
                      Compare
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setSelectedForCompare(new Set())}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto space-y-3">
              {results.map(route => {
                const isSelected = selectedForCompare.has(route.id);
                const isFav = favs.has(route.id);
                const isExpanded = expandedRouteId === route.id;
                return (
                  <div key={route.id}>
                    <Card
                      className={`border transition-all hover:shadow-sm ${isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {route.routeNumber}
                              </Badge>
                              {trafficBadge(route.trafficLevel)}
                              <SeatBadge trafficLevel={route.trafficLevel} />
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="size-3.5 text-emerald-500" />
                              <span className="text-muted-foreground">{route.startLocation}</span>
                              <ArrowRight className="mx-1 size-3.5 text-muted-foreground" />
                              <span className="font-medium">{route.endLocation}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {route.distanceKm !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Navigation className="size-3" />
                                  {route.distanceKm} km
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Timer className="size-3" />
                                {formatDuration(route.durationMin)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {seatAvailabilityIndicator(route.trafficLevel).label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                            <p className="text-xl font-bold text-emerald-700">{formatCurrency(route.fare)}</p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 w-8 p-0 ${isSelected ? 'bg-primary text-primary-foreground' : ''}`}
                                onClick={() => toggleCompare(route.id)}
                                title="Select for comparison"
                              >
                                <GitCompareArrows className="size-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 w-8 p-0 ${isFav ? 'text-rose-500' : ''}`}
                                onClick={() => handleToggleFavorite(route.id)}
                                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Heart className={`size-3 ${isFav ? 'fill-rose-500' : ''}`} />
                              </Button>
                              <Button
                                size="sm"
                                disabled={bookingId === route.id}
                                onClick={() => handleBook(route)}
                              >
                                {bookingId === route.id ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Ticket className="size-3" />
                                )}
                                Book
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="size-4" />
                                ) : (
                                  <ChevronDown className="size-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Expanded Route Detail Panel */}
                    {isExpanded && (
                      <div className="mt-2">
                        <RouteDetailPanel
                          route={route}
                          onBook={() => handleBook(route)}
                          isBooking={bookingId === route.id}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No results */}
      {!searching && !loading && results.length === 0 && startLocation && endLocation && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-3 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No routes found for this search</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Try different locations or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Route Map ───────────────────────────────────────────────────────────────

function RouteMapView() {
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(false);
  const [error, setError] = useState('');
  const [polylineCoords, setPolylineCoords] = useState<[number, number][]>([]);
  const [fallbackCoords, setFallbackCoords] = useState<[number, number][]>([]);
  const [useFallback, setUseFallback] = useState(false);
  const [stops, setStops] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchRoutes() {
      try {
        setLoading(true);
        const res = await fetch('/api/routes?mapAvailable=true');
        if (!res.ok) throw new Error('Failed to fetch routes');
        const data = await res.json();
        const routeList: RouteResult[] = data.routes ?? [];
        setRoutes(routeList);
        if (routeList.length > 0) {
          setSelectedRoute(routeList[0]);
        }
        setFavs(new Set(getFavorites()));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load routes');
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  // Small delay for mapReady to let leaflet CSS initialize
  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch OSRM route and parse stops
  useEffect(() => {
    if (!selectedRoute) return;

    async function loadMapData() {
      setMapLoading(true);
      setPolylineCoords([]);
      setFallbackCoords([]);
      setUseFallback(false);

      try {
        // Parse stops from stopsJson field
        let parsedStops: { name: string; lat: number; lng: number }[] = [];
        if (selectedRoute && selectedRoute.stopsJson) {
          parsedStops = JSON.parse(selectedRoute.stopsJson);
        }
        setStops(parsedStops);

        if (parsedStops.length < 2) {
          setMapLoading(false);
          return;
        }

        // Build OSRM coordinates string
        const coordsStr = parsedStops
          .map(s => `${s.lng},${s.lat}`)
          .join(';');

        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;

        try {
          const osrmRes = await fetch(osrmUrl);
          if (!osrmRes.ok) throw new Error('OSRM fetch failed');
          const osrmData = await osrmRes.json();

          if (osrmData.routes && osrmData.routes.length > 0) {
            const geometry = osrmData.routes[0].geometry;
            if (geometry && geometry.coordinates) {
              // OSRM returns [lng, lat]; Leaflet needs [lat, lng]
              const routeCoords: [number, number][] = geometry.coordinates.map(
                (c: number[]) => [c[1], c[0]] as [number, number]
              );
              setPolylineCoords(routeCoords);
            }
          } else {
            throw new Error('No route from OSRM');
          }
        } catch {
          // Fallback to straight lines
          const fb: [number, number][] = parsedStops.map(
            s => [s.lat, s.lng] as [number, number]
          );
          setFallbackCoords(fb);
          setUseFallback(true);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load map data');
      } finally {
        setMapLoading(false);
      }
    }
    loadMapData();
  }, [selectedRoute]);

  // Compute center and bounds
  const getCenter = useCallback((): [number, number] => {
    if (stops.length === 0) return [12.9716, 77.5946]; // Default: Bangalore
    const avgLat = stops.reduce((a, s) => a + s.lat, 0) / stops.length;
    const avgLng = stops.reduce((a, s) => a + s.lng, 0) / stops.length;
    return [avgLat, avgLng];
  }, [stops]);

  const getBounds = useCallback((): [[number, number], [number, number]] | null => {
    if (stops.length === 0) return null;
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;
    for (const s of stops) {
      minLat = Math.min(minLat, s.lat);
      minLng = Math.min(minLng, s.lng);
      maxLat = Math.max(maxLat, s.lat);
      maxLng = Math.max(maxLng, s.lng);
    }
    return [[minLat, minLng], [maxLat, maxLng]];
  }, [stops]);

  const greenIcon = L.divIcon({
    className: '',
    html: `<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const redIcon = L.divIcon({
    className: '',
    html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  const blueIcon = L.divIcon({
    className: '',
    html: `<div style="background:#3b82f6;width:10px;height:10px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.2)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="space-y-4 py-6">
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-96 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (error && routes.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-8 text-center text-red-600">
          <p className="font-medium">Failed to load route map</p>
          <p className="mt-1 text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route selector */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Navigation className="size-5 text-primary" />
            <span className="text-sm font-medium">Select Route:</span>
          </div>
          <Select
            value={selectedRoute?.id ?? ''}
            onValueChange={v => {
              const r = routes.find(r => r.id === v);
              setSelectedRoute(r ?? null);
              setError('');
            }}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Choose a route..." />
            </SelectTrigger>
            <SelectContent>
              {routes.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.routeNumber} — {r.startLocation} → {r.endLocation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedRoute && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toggleFavorite(selectedRoute.id);
                setFavs(new Set(getFavorites()));
              }}
              className="ml-auto"
            >
              <Heart className={`size-4 ${favs.has(selectedRoute.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span className="ml-1 hidden sm:inline">{favs.has(selectedRoute.id) ? 'Unfavorite' : 'Favorite'}</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative h-[450px] w-full md:h-[550px]">
            {mapLoading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading route path from OSRM...</span>
                </div>
              </div>
            )}

            {!mapLoading && !selectedRoute && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Map className="size-10" />
                  <span className="text-sm">Select a route to view on map</span>
                </div>
              </div>
            )}

            {mapReady && selectedRoute && (
              <MapContainer
                center={getCenter()}
                zoom={13}
                className="h-full w-full"
                bounds={getBounds() ?? undefined}
                boundsOptions={{ padding: [40, 40] }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Markers */}
                {stops.map((stop, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === stops.length - 1;
                  return (
                    <Marker
                      key={idx}
                      position={[stop.lat, stop.lng]}
                      icon={isFirst ? greenIcon : isLast ? redIcon : blueIcon}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold">{stop.name}</p>
                          <p className="text-muted-foreground">
                            {isFirst ? 'Start' : isLast ? 'End' : `Stop ${idx}`}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* OSRM Polyline */}
                {!useFallback && polylineCoords.length > 0 && (
                  <Polyline
                    positions={polylineCoords}
                    pathOptions={{
                      color: '#16a34a',
                      weight: 5,
                      opacity: 0.8,
                    }}
                  />
                )}

                {/* Fallback straight lines */}
                {useFallback && fallbackCoords.length > 0 && (
                  <Polyline
                    positions={fallbackCoords}
                    pathOptions={{
                      color: '#16a34a',
                      weight: 4,
                      opacity: 0.7,
                      dashArray: '8, 8',
                    }}
                  />
                )}
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Route Info Cards */}
      {selectedRoute && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
                <Route className="size-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Route</p>
                <p className="font-semibold text-sm">{selectedRoute.routeNumber}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100">
                <Navigation className="size-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-semibold text-sm">{selectedRoute.distanceKm ? `${selectedRoute.distanceKm} km` : '—'}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-sm">{formatDuration(selectedRoute.durationMin)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                <IndianRupee className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fare</p>
                <p className="font-semibold text-sm">{formatCurrency(selectedRoute.fare)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1 hover:shadow-sm transition-shadow">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100">
                <MapPin className="size-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stops</p>
                <p className="font-semibold text-sm">{selectedRoute.stopsCount ?? stops.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Route path display (start to end) */}
      {selectedRoute && stops.length > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="py-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Route Path</p>
            <div className="flex flex-wrap items-center gap-1">
              {stops.map((stop, idx) => (
                <React.Fragment key={idx}>
                  <Badge variant={idx === 0 ? 'default' : idx === stops.length - 1 ? 'destructive' : 'secondary'} className="text-xs">
                    {stop.name}
                  </Badge>
                  {idx < stops.length - 1 && (
                    <ArrowRight className="size-3 text-muted-foreground" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {useFallback && selectedRoute && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-2 py-3 text-sm text-amber-700">
            <TrendingUp className="size-4 shrink-0" />
            Showing straight-line route (OSRM routing unavailable). The actual road path may differ.
          </CardContent>
        </Card>
      )}

      {routes.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="mb-3 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No routes available for map display</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── My Bookings ─────────────────────────────────────────────────────────────

function MyBookings({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        const res = await fetch(`/api/journeys?customerId=${userId}&status=planned`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const data = await res.json();
        setBookings(data.journeys ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [userId]);

  const handleCancel = useCallback(async (journey: Journey) => {
    try {
      setCancelling(journey.id);
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', id: journey.id }),
      });
      if (!res.ok) throw new Error('Cancellation failed');
      setBookings(prev => prev.filter(j => j.id !== journey.id));
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully.',
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cancellation failed');
    } finally {
      setCancelling(null);
    }
  }, []);

  const handleDownloadReceipt = useCallback((journey: Journey) => {
    toast({
      title: 'Receipt Downloaded',
      description: `Receipt for ${jRouteNumber(journey)} has been downloaded.`,
    });
  }, []);

  // Map status to receipt status label
  function receiptStatus(status: string | undefined): { label: string; cls: string } {
    const s = status?.toLowerCase() ?? 'planned';
    switch (s) {
      case 'confirmed':
        return { label: 'Confirmed', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
      case 'completed':
        return { label: 'Completed', cls: 'bg-sky-100 text-sky-700 border-sky-300' };
      case 'cancelled':
        return { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-300' };
      default:
        return { label: 'Planned', cls: 'bg-amber-100 text-amber-700 border-amber-300' };
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-sky-500" />
            My Bookings
            {!loading && <Badge variant="secondary" className="ml-2">{bookings.length}</Badge>}
          </CardTitle>
          <CardDescription>Manage your planned journeys</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <XCircle className="size-4 shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <Ticket className="size-12 text-muted-foreground/30" />
              </div>
              <p className="font-medium text-muted-foreground">No bookings yet</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                When you book a route, your planned trips will appear here
              </p>
            </div>
          ) : (
            <div className="max-h-[700px] space-y-4 overflow-y-auto">
              {bookings.map(j => {
                const seat = seatFromId(j.id);
                const status = receiptStatus(j.status);
                return (
                  <Card key={j.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {/* Top section: Route number + status */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-muted/50 to-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Bus className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-bold tracking-tight">{jRouteNumber(j)}</p>
                          <p className="text-xs text-muted-foreground">
                            {jStartLocation(j)} → {jEndLocation(j)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs font-medium ${status.cls}`}>
                        {status.label}
                      </Badge>
                    </div>

                    {/* Tear line 1 */}
                    <div className="px-1">
                      <TearLine />
                    </div>

                    {/* Middle section: Journey details + QR */}
                    <div className="flex items-stretch px-5 py-4">
                      <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Departure Time</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" />
                            {jTime(j)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Travel Date</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <CalendarClock className="size-3 text-muted-foreground" />
                            {jDate(j)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Seat Number</p>
                          <p className="text-sm font-bold text-primary">{seat}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fare</p>
                          <p className="text-sm font-bold text-emerald-700">{formatCurrency(j.cost)}</p>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="mx-4" />
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <QRPattern seed={j.id} />
                        <p className="mt-1 text-[10px]">Boarding Pass</p>
                      </div>
                    </div>

                    {/* Tear line 2 */}
                    <div className="px-1">
                      <TearLine />
                    </div>

                    {/* Bottom section: Actions */}
                    <div className="flex items-center justify-between px-5 py-3 bg-muted/20">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Ticket className="size-3" />
                        <span>Journey ID: {j.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReceipt(j)}
                        >
                          <Download className="size-3" />
                          Download Receipt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={cancelling === j.id}
                          onClick={() => handleCancel(j)}
                        >
                          {cancelling === j.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <XCircle className="size-3" />
                          )}
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Journey History ─────────────────────────────────────────────────────────

function JourneyHistory({ userId }: { userId: string }) {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Date range filter
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(getTodayString());
  const [showFilters, setShowFilters] = useState(false);

  // Stats derived from journeys
  const totalSpent = useMemo(() => journeys.reduce((sum, j) => sum + (j.cost ?? 0), 0), [journeys]);
  const avgCost = useMemo(() => journeys.length > 0 ? totalSpent / journeys.length : 0, [journeys, totalSpent]);
  const totalDistance = useMemo(() => journeys.reduce((sum, j) => sum + (jDistance(j) ?? 0), 0), [journeys]);
  const ratedCount = useMemo(() => journeys.filter(j => (j.rating ?? 0) > 0).length, [journeys]);

  // Filter journeys by date range
  const filteredJourneys = useMemo(() => {
    return journeys.filter(j => {
      const d = j.schedule?.date;
      if (!d) return true;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [journeys, startDate, endDate]);

  const filteredTotalSpent = useMemo(() => filteredJourneys.reduce((sum, j) => sum + (j.cost ?? 0), 0), [filteredJourneys]);
  const filteredTotalDistance = useMemo(() => filteredJourneys.reduce((sum, j) => sum + (jDistance(j) ?? 0), 0), [filteredJourneys]);
  const filteredAvgFare = useMemo(() => filteredJourneys.length > 0 ? filteredTotalSpent / filteredJourneys.length : 0, [filteredJourneys, filteredTotalSpent]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await fetch(`/api/journeys?customerId=${userId}&status=completed`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        const jList: Journey[] = data.journeys ?? [];
        setJourneys(jList);
        // Initialize ratings
        const initRatings: Record<string, number> = {};
        const initFeedbacks: Record<string, string> = {};
        for (const j of jList) {
          initRatings[j.id] = j.rating ?? 0;
          initFeedbacks[j.id] = j.feedback ?? '';
        }
        setRatings(initRatings);
        setFeedbacks(initFeedbacks);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [userId]);

  const handleSubmitRating = useCallback(async (journeyId: string) => {
    const rating = ratings[journeyId];
    if (!rating || rating < 1) {
      setError('Please select a rating before submitting');
      return;
    }
    try {
      setSubmitting(journeyId);
      const res = await fetch('/api/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rate',
          id: journeyId,
          rating,
          feedback: feedbacks[journeyId] ?? '',
        }),
      });
      if (!res.ok) throw new Error('Rating submission failed');
      setJourneys(prev =>
        prev.map(j =>
          j.id === journeyId
            ? { ...j, rating, feedback: feedbacks[journeyId] ?? '' }
            : j
        )
      );
      toast({
        title: 'Rating Submitted!',
        description: 'Thank you for your feedback.',
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rating submission failed');
    } finally {
      setSubmitting(null);
    }
  }, [ratings, feedbacks]);

  return (
    <div className="space-y-4">
      {/* Spending Summary Card */}
      {!loading && journeys.length > 0 && (
        <Card className="border-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <CardContent className="py-6">
            <p className="mb-4 text-sm font-medium opacity-80">Spending Summary</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs opacity-70">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Trips Completed</p>
                <p className="text-2xl font-bold">{journeys.length}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Avg Trip Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(avgCost)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Total Distance</p>
                <p className="text-2xl font-bold">{totalDistance > 0 ? `${totalDistance.toFixed(0)} km` : '—'}</p>
              </div>
            </div>
            {ratedCount > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="text-sm">
                  You&apos;ve rated {ratedCount} of {journeys.length} journeys
                </span>
                <Progress value={(ratedCount / journeys.length) * 100} className="ml-2 h-2 flex-1 max-w-[120px]" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter + Stats Row */}
      {!loading && journeys.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Date Range Filter */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="size-4 text-primary" />
                  Filter by Date Range
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent className="pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing {filteredJourneys.length} of {journeys.length} journeys
                </p>
              </CardContent>
            )}
            {!showFilters && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {startDate} to {endDate} · {filteredJourneys.length} journey{filteredJourneys.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            )}
          </Card>

          {/* Average Fare + Total Distance */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <IndianRupee className="size-6 text-amber-600 mb-2" />
                <p className="text-xs text-muted-foreground">Average Fare</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(filteredAvgFare)}</p>
                {startDate && endDate && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ({filteredJourneys.length} filtered trips)
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <Navigation className="size-6 text-sky-600 mb-2" />
                <p className="text-xs text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold text-sky-700">{filteredTotalDistance > 0 ? `${filteredTotalDistance.toFixed(0)}` : '—'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">kilometers traveled</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {!loading && journeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-5 text-amber-500" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingDistribution journeys={filteredJourneys} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            Journey History
            {!loading && <Badge variant="secondary" className="ml-2">{filteredJourneys.length}</Badge>}
          </CardTitle>
          <CardDescription>Your completed trips and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <XCircle className="size-4 shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : filteredJourneys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <CheckCircle2 className="size-12 text-muted-foreground/30" />
              </div>
              <p className="font-medium text-muted-foreground">
                {journeys.length === 0 ? 'No completed journeys yet' : 'No journeys match the selected date range'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                {journeys.length === 0
                  ? 'Your completed trips will appear here'
                  : 'Try adjusting the date filter'}
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] space-y-3 overflow-y-auto">
              {filteredJourneys.map(j => {
                const isRated = (j.rating ?? 0) > 0;
                const isSubmitting = submitting === j.id;
                return (
                  <Card key={j.id} className={isRated ? 'opacity-80' : ''}>
                    <CardContent className="py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              {jRouteNumber(j)}
                            </Badge>
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">
                              Completed
                            </Badge>
                            {jDistance(j) !== undefined && (
                              <span className="text-xs text-muted-foreground">{jDistance(j)} km</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="size-3.5 text-emerald-500" />
                            <span className="text-muted-foreground">{jStartLocation(j)}</span>
                            <ArrowRight className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">{jEndLocation(j)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarClock className="size-3" />
                              {jDate(j)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {jTime(j)}
                            </span>
                            <Separator orientation="vertical" className="h-3" />
                            <span className="font-medium text-foreground">{formatCurrency(j.cost)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 sm:min-w-[200px]">
                          {/* Existing rating */}
                          {isRated && (
                            <div className="space-y-1">
                              <StarRating rating={j.rating!} />
                              {j.feedback && (
                                <p className="text-xs text-muted-foreground italic">&quot;{j.feedback}&quot;</p>
                              )}
                            </div>
                          )}

                          {/* Rating form for unrated */}
                          {!isRated && (
                            <div className="w-full space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3">
                              <p className="text-xs font-medium text-amber-700">Rate your journey</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Rating:</span>
                                <StarRating
                                  rating={ratings[j.id] ?? 0}
                                  onChange={r =>
                                    setRatings(prev => ({ ...prev, [j.id]: r }))
                                  }
                                />
                              </div>
                              <Textarea
                                placeholder="Share your feedback (optional)..."
                                className="min-h-14 text-xs"
                                value={feedbacks[j.id] ?? ''}
                                onChange={e =>
                                  setFeedbacks(prev => ({
                                    ...prev,
                                    [j.id]: e.target.value,
                                  }))
                                }
                              />
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={isSubmitting || !ratings[j.id]}
                                onClick={() => handleSubmitRating(j.id)}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Star className="size-3" />
                                )}
                                Submit Rating
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CustomerContent({ portal, userId, token, setPortal }: Props) {
  // token is available if needed for authorized requests
  const _token = token;
  void _token;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {portal === 'dashboard' && 'Dashboard'}
          {portal === 'search' && 'Search Routes'}
          {portal === 'map' && 'Route Map'}
          {portal === 'bookings' && 'My Bookings'}
          {portal === 'history' && 'Journey History'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {portal === 'dashboard' && 'Welcome back! Here is your travel overview.'}
          {portal === 'search' && 'Find and book available bus routes.'}
          {portal === 'map' && 'Explore routes on an interactive map.'}
          {portal === 'bookings' && 'View and manage your planned trips.'}
          {portal === 'history' && 'Review your completed journeys and rate them.'}
        </p>
      </div>

      {/* Content */}
      {portal === 'dashboard' && <Dashboard userId={userId} setPortal={setPortal} />}
      {portal === 'search' && <SearchRoutes userId={userId} />}
      {portal === 'map' && <RouteMapView />}
      {portal === 'bookings' && <MyBookings userId={userId} />}
      {portal === 'history' && <JourneyHistory userId={userId} />}
    </div>
  );
}
