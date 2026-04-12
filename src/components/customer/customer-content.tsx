'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  ChevronRight,
  Compass,
  MapPinned,
  BusFront,
  Hourglass,
  UserPlus,
  Armchair,
  X,
  Zap,
  Gauge,
  MapPinIcon,
  Waypoints,
  Crown,
  Percent,
  Camera,
  Award,
  Shield,
  AlertTriangle,
  Upload,
  MessageCircle,
  Send,
  CircleDot,
  ArrowDownLeft,
  ArrowUpRight,
  Megaphone,
  HelpCircle,
  Share2,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Sun,
  Moon,
  Coffee,
  ThumbsUp,
  Copy,
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
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-300',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-300',
    high: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/50 dark:border-orange-700 dark:text-orange-300',
    severe: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300',
  };
  return (
    <Badge variant="outline" className={`${cls[level.toLowerCase()] ?? cls.moderate} transition-all duration-300`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

function statusBadge(status: string | undefined) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const cls: Record<string, string> = {
    planned: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-300',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300',
    confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-300',
  };
  return (
    <Badge variant="outline" className={`${cls[status.toLowerCase()] ?? cls.planned} transition-all duration-300`}>
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

function QRPattern({ seed, size }: { seed: string; size?: number }) {
  // Generate a deterministic QR-like pattern from seed string
  const gridSize = 15;
  const cells: boolean[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < gridSize; c++) {
      // Corner finder patterns (4x4 squares with inner border)
      const isTopLeft = r < 4 && c < 4;
      const isTopRight = r < 4 && c >= gridSize - 4;
      const isBottomLeft = r >= gridSize - 4 && c < 4;
      const isCorner = isTopLeft || isTopRight || isBottomLeft;
      if (isCorner) {
        // Finder pattern: outer border + inner dot
        const lr = isTopLeft ? r : isTopRight ? r : r - (gridSize - 4);
        const lc = isTopLeft ? c : isTopRight ? c - (gridSize - 4) : c;
        const isBorder = lr === 0 || lr === 3 || lc === 0 || lc === 3;
        const isInner = lr === 1 && lc === 1;
        const isInner2 = lr === 2 && lc === 2;
        row.push(isBorder || isInner || isInner2);
      } else {
        // Data cells - deterministic from seed
        const idx = r * gridSize + c;
        const ch = seed.charCodeAt(idx % seed.length);
        row.push((ch * (idx + 1)) % 3 !== 0);
      }
    }
    cells.push(row);
  }

  return (
    <svg width={size ?? 88} height={size ?? 88} viewBox={`0 0 ${gridSize} ${gridSize}`} className="rounded">
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

// ─── Weather Badge ───────────────────────────────────────────────────────────

function getWeatherForCity(city: string | undefined): {
  emoji: string;
  label: string;
  bg: string;
  text: string;
  advisory: string;
} {
  const c = city?.toUpperCase() ?? '';
  if (c.includes('DEL')) return { emoji: '🔥', label: 'Hot', bg: 'bg-gradient-to-r from-red-50 to-orange-50', text: 'text-red-700', advisory: 'Expect 5-10 min delay' };
  if (c.includes('MUM')) return { emoji: '🌧️', label: 'Rainy', bg: 'bg-gradient-to-r from-blue-50 to-sky-50', text: 'text-blue-700', advisory: 'Expect 5-10 min delay' };
  if (c.includes('CHN')) return { emoji: '⛅', label: 'Cloudy', bg: 'bg-gradient-to-r from-gray-50 to-slate-100', text: 'text-gray-700', advisory: '' };
  return { emoji: '☀️', label: 'Sunny', bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', text: 'text-amber-700', advisory: '' };
}

function WeatherBadge({ city }: { city: string | undefined }) {
  const weather = getWeatherForCity(city);
  return (
    <div className="flex flex-col items-start">
      <Badge variant="outline" className={`gap-0.5 text-[10px] border-0 ${weather.bg} ${weather.text}`}>
        <span>{weather.emoji}</span> {weather.label}
      </Badge>
      {weather.advisory && (
        <span className="text-[10px] text-amber-600 mt-0.5">{weather.advisory}</span>
      )}
    </div>
  );
}

// ─── Spending Donut Chart ────────────────────────────────────────────────────

function SpendingDonut({ totalSpent }: { totalSpent: number }) {
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
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
                strokeWidth={hoveredSeg === i ? strokeWidth + 6 : strokeWidth}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="transition-all duration-300 cursor-pointer"
                style={{ filter: hoveredSeg === i ? 'drop-shadow(0 0 6px rgba(0,0,0,0.2))' : 'none' }}
                onMouseEnter={() => setHoveredSeg(i)}
                onMouseLeave={() => setHoveredSeg(null)}
              />
            );
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {hoveredSeg !== null ? (
            <>
              <p className="text-xs text-muted-foreground">{segments[hoveredSeg].label}</p>
              <p className="text-xl font-bold" style={{ color: segments[hoveredSeg].color }}>{formatCurrency(segments[hoveredSeg].value)}</p>
              <p className="text-xs text-muted-foreground">{segments[hoveredSeg].pct}%</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
            </>
          )}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 cursor-pointer rounded-md px-2 py-1 transition-all ${hoveredSeg === i ? 'bg-muted/50 dark:bg-muted/20' : ''}`}
            onMouseEnter={() => setHoveredSeg(i)}
            onMouseLeave={() => setHoveredSeg(null)}
          >
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
  onBook: (seats?: string[]) => void;
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

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) {
      // Reset via ref callback to avoid lint warning about setState in effect
      const id = requestAnimationFrame(() => setCount(0));
      return () => cancelAnimationFrame(id);
    }
    startTimeRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

// ─── Trip Planner ────────────────────────────────────────────────────────────

function TripPlanner({ onFindRoutes }: { onFindRoutes: () => void }) {
  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [tripDate, setTripDate] = useState(getTodayString());
  const [tripTime, setTripTime] = useState('09:00');
  const [passengers, setPassengers] = useState(1);

  const steps = [
    { num: 1, label: 'Route' },
    { num: 2, label: 'Details' },
    { num: 3, label: 'Confirm' },
  ];

  const canProceedStep1 = origin.trim().length > 0 && destination.trim().length > 0 && origin !== destination;
  const canProceedStep2 = tripDate && tripTime;

  const handleFindRoutes = () => {
    toast({
      title: 'Finding Routes...',
      description: `Searching for routes from ${origin} to ${destination} on ${tripDate}`,
    });
    onFindRoutes();
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Compass className="size-5 text-primary" />
          Trip Planner
        </CardTitle>
        <CardDescription>Plan your journey in 3 easy steps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {s.num}
                </div>
                <span className={`text-sm ${step >= s.num ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full transition-colors ${step > s.num ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Origin / Destination */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MapPinned className="size-3.5 text-emerald-500" /> Origin
              </label>
              <Input
                placeholder="Enter origin city or stop"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MapPinned className="size-3.5 text-rose-500" /> Destination
              </label>
              <Input
                placeholder="Enter destination city or stop"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
            >
              Next <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Date / Time / Passengers */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-sky-500" /> Date
                </label>
                <Input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="size-3.5 text-amber-500" /> Time
                </label>
                <Input type="time" value={tripTime} onChange={e => setTripTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <UserPlus className="size-3.5 text-violet-500" /> Passengers
                </label>
                <Select value={String(passengers)} onValueChange={v => setPassengers(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Next <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Route Suggestions with Results Panel */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Visual route summary */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Suggested Routes</p>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  <span className="text-xs font-medium max-w-[80px] text-center">{origin}</span>
                </div>
                <div className="flex items-center shrink-0">
                  <div className="h-0.5 w-8 bg-emerald-400" />
                  <div className="h-2 w-2 rounded-full bg-amber-400 ring-1 ring-amber-200 mx-1" />
                  <div className="h-0.5 w-8 bg-amber-400" />
                  <div className="h-2 w-2 rounded-full bg-amber-400 ring-1 ring-amber-200 mx-1" />
                  <div className="h-0.5 w-8 bg-orange-400" />
                  <div className="h-2 w-2 rounded-full bg-orange-400 ring-1 ring-orange-200 mx-1" />
                  <div className="h-0.5 w-8 bg-red-400" />
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="h-3 w-3 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                  <span className="text-xs font-medium max-w-[80px] text-center">{destination}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarClock className="size-3" />{tripDate}</span>
                <span className="flex items-center gap-1"><Clock className="size-3" />{tripTime}</span>
                <span className="flex items-center gap-1"><UserPlus className="size-3" />{passengers} {passengers === 1 ? 'Passenger' : 'Passengers'}</span>
              </div>
            </div>

            {/* 3 Suggested Routes */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Available Routes</p>
              {[
                { routeNum: 'R-500', departure: `${tripTime}`, duration: 45, fare: 35, seats: 28, traffic: 'low' },
                { routeNum: 'R-215', departure: `${String(Number(tripTime.split(':')[0]) + 1).padStart(2, '0')}:15`, duration: 55, fare: 30, seats: 12, traffic: 'moderate' },
                { routeNum: 'R-335', departure: `${String(Number(tripTime.split(':')[0]) + 2).padStart(2, '0')}:00`, duration: 35, fare: 45, seats: 22, traffic: 'low' },
              ].map((suggestion, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3 transition-all hover:bg-muted/30 dark:hover:bg-muted/10 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Bus className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{suggestion.routeNum}</Badge>
                        <SeatBadge trafficLevel={suggestion.traffic} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="size-3" />{suggestion.departure}</span>
                        <span className="flex items-center gap-1"><Timer className="size-3" />{suggestion.duration} min</span>
                        <span className="flex items-center gap-1"><Users className="size-3" />{suggestion.seats} seats</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(suggestion.fare * passengers)}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        toast({
                          title: 'Route Selected!',
                          description: `${suggestion.routeNum} selected for ${passengers} passenger${passengers > 1 ? 's' : ''}. Redirecting to book...`,
                        });
                        handleFindRoutes();
                      }}
                    >
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleFindRoutes}>
                <Search className="size-4" /> Find More Routes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Quick Trip Planner (Dashboard) ──────────────────────────────────────────

const POPULAR_ROUTES = [
  { routeNumber: 'BLR-101', start: 'Majestic', end: 'Koramangala', fare: 25, gradient: 'from-emerald-500 to-teal-500' },
  { routeNumber: 'BLR-215', start: 'Whitefield', end: 'Electronic City', fare: 40, gradient: 'from-amber-500 to-orange-500' },
  { routeNumber: 'DEL-301', start: 'Connaught Place', end: 'Gurgaon', fare: 35, gradient: 'from-violet-500 to-purple-500' },
];

function QuickTripPlanner({ onFindRoutes }: { onFindRoutes: (from: string, to: string) => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  return (
    <Card className="card-lift overflow-hidden border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Quick Trip Planner
        </CardTitle>
        <CardDescription>Find routes between locations instantly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From / To inputs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MapPinned className="size-3.5 text-emerald-500" /> From
            </label>
            <Input
              placeholder="Enter origin location"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MapPinned className="size-3.5 text-rose-500" /> To
            </label>
            <Input
              placeholder="Enter destination location"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="w-full"
          disabled={!from.trim() || !to.trim() || from === to}
          onClick={() => onFindRoutes(from, to)}
        >
          <Search className="size-4 mr-2" />
          Find Routes
        </Button>

        {/* Popular Routes */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <TrendingUp className="size-3.5" /> Popular Routes
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 stagger-entry">
            {POPULAR_ROUTES.map(route => (
              <div
                key={route.routeNumber}
                className="relative flex items-center gap-3 rounded-xl border bg-muted/20 p-3 transition-all hover:bg-muted/40 hover:shadow-sm cursor-pointer group"
                onClick={() => onFindRoutes(route.start, route.end)}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${route.gradient}`} />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ml-1">
                  <Bus className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant="outline" className="font-mono text-[10px]">{route.routeNumber}</Badge>
                  <div className="flex items-center gap-1 text-xs mt-0.5">
                    <span className="text-muted-foreground truncate">{route.start}</span>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    <span className="font-medium truncate">{route.end}</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">{formatCurrency(route.fare)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Live Bus Tracker ────────────────────────────────────────────────────────

function LiveBusTracker() {
  const initialBuses = useMemo(() => [
    { number: 'KA-01-4521', route: 'Route 500', etaStart: 300, status: 'on-time' as const, progress: 72, color: 'bg-emerald-500' },
    { number: 'KA-01-7832', route: 'Route 215', etaStart: 480, status: 'delayed' as const, progress: 45, color: 'bg-amber-500' },
    { number: 'KA-03-1190', route: 'Route 335', etaStart: 120, status: 'boarding' as const, progress: 90, color: 'bg-sky-500' },
  ], []);

  const [etas, setEtas] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    for (const b of initialBuses) initial[b.etaStart] = b.etaStart;
    return initial;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setEtas(prev => {
        const next = { ...prev };
        let changed = false;
        for (const b of initialBuses) {
          if ((next[b.etaStart] ?? 0) > 0) {
            next[b.etaStart] = next[b.etaStart] - 1;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [initialBuses]);

  const statusLabel: Record<string, { text: string; cls: string; dotCls: string; darkCls: string }> = {
    'on-time': { text: 'On Time', cls: 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/50 dark:border-emerald-700', dotCls: 'bg-emerald-500', darkCls: '' },
    'delayed': { text: 'Delayed', cls: 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-300 dark:bg-amber-900/50 dark:border-amber-700', dotCls: 'bg-amber-500', darkCls: '' },
    'boarding': { text: 'Boarding', cls: 'text-sky-700 bg-sky-100 border-sky-200 dark:text-sky-300 dark:bg-sky-900/50 dark:border-sky-700', dotCls: 'bg-sky-500', darkCls: '' },
  };

  const formatEta = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isPulsing = (status: string) => status === 'on-time' || status === 'boarding';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BusFront className="size-5 text-primary" />
          Live Bus Tracker
          <span className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </CardTitle>
        <CardDescription>Nearby buses on your frequent routes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {initialBuses.map((bus, i) => {
          const s = statusLabel[bus.status] ?? statusLabel['on-time'];
          const etaSec = etas[bus.etaStart] ?? bus.etaStart;
          return (
            <div key={i} className="rounded-lg border p-3 transition-colors hover:bg-muted/30 dark:hover:bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bus className="size-4 text-muted-foreground" />
                    {isPulsing(bus.status) && (
                      <span className={`absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5`}
                        >
                        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dotCls} opacity-75`} />
                        <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dotCls}`} />
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-mono font-semibold">{bus.number}</span>
                </div>
                <Badge variant="outline" className={`text-[10px] font-semibold ${s.cls}`}>{s.text}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{bus.route}</span>
                <span className={`flex items-center gap-1 font-mono tabular-nums ${etaSec < 60 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`}>
                  <Hourglass className="size-3" /> ETA {etaSec > 0 ? formatEta(etaSec) : 'Arriving!'}
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-muted dark:bg-muted/50">
                <div
                  className={`absolute left-0 top-0 h-2 rounded-full transition-all duration-1000 ${bus.color}`}
                  style={{ width: `${bus.progress}%` }}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm transition-all duration-1000 ${bus.color}`}
                  style={{ left: `calc(${bus.progress}% - 6px)` }}
                />
                {isPulsing(bus.status) && (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full ${s.dotCls} opacity-20 animate-ping`}
                    style={{ left: `calc(${bus.progress}% - 10px)` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Upcoming Trip Countdown ────────────────────────────────────────────────

function UpcomingTripCountdown({ journey }: { journey: Journey }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Use timeout to avoid calling setState synchronously in effect
      setTimeout(() => setMounted(true), 0);
    }
    function updateCountdown() {
      const dateStr = journey.schedule?.date;
      const timeStr = journey.schedule?.departureTime;
      if (!dateStr || !timeStr) return;
      const target = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [journey]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (!mounted) {
    return <Skeleton className="h-40 rounded-xl" />;
  }

  const timeBlocks = [
    { value: countdown.days, label: 'Days' },
    { value: countdown.hours, label: 'Hours' },
    { value: countdown.minutes, label: 'Minutes' },
    { value: countdown.seconds, label: 'Seconds' },
  ];

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Hourglass className="size-5 text-amber-500" />
          Upcoming Trip Countdown
        </CardTitle>
        <CardDescription>Your next booked journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip details */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bus className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{jRouteNumber(journey)}</p>
            <p className="text-xs text-muted-foreground truncate">
              {jStartLocation(journey)} → {jEndLocation(journey)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-medium">{jDate(journey)}</p>
            <p className="text-xs text-muted-foreground">{jTime(journey)}</p>
          </div>
        </div>

        {/* Countdown timer */}
        <div className="grid grid-cols-4 gap-2">
          {timeBlocks.map((block) => (
            <div key={block.label} className="flex flex-col items-center rounded-lg border bg-gradient-to-b from-muted/50 to-muted/20 p-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight">{pad(block.value)}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{block.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Seat Selection Dialog ───────────────────────────────────────────────────

function SeatSelection({
  route,
  onConfirm,
  onClose,
}: {
  route: RouteResult;
  onConfirm: (seats: string[]) => void;
  onClose: () => void;
}) {
  const rows = 10;
  const cols = 4;
  const letters = ['A', 'B', 'C', 'D'];

  // Deterministic booked seats from route ID
  const bookedSeats = useMemo(() => {
    const booked = new Set<string>();
    let hash = 0;
    for (let i = 0; i < route.id.length; i++) {
      hash = ((hash << 5) - hash + route.id.charCodeAt(i)) | 0;
    }
    const bookedCount = Math.abs(hash % 15) + 5; // 5-19 booked seats
    for (let i = 0; i < bookedCount; i++) {
      const seed = Math.abs((hash * (i + 7)) | 0);
      const r = (seed % rows) + 1;
      const c = Math.abs((seed >> 3) % cols);
      booked.add(`${r}${letters[c]}`);
    }
    return booked;
  }, [route.id]);

  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());

  const toggleSeat = (seat: string) => {
    if (bookedSeats.has(seat)) return;
    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else if (next.size < 6) next.add(seat);
      else {
        toast({ title: 'Maximum 6 seats', description: 'You can select up to 6 seats per booking.', variant: 'destructive' });
      }
      return next;
    });
  };

  const seatPrice = route.fare ?? 0;
  const totalPrice = seatPrice * selectedSeats.size;

  const getSeatStyle = (seat: string) => {
    if (bookedSeats.has(seat)) return 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50';
    if (selectedSeats.has(seat)) return 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300';
    return 'border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 cursor-pointer';
  };

  const grid = [];
  for (let r = 1; r <= rows; r++) {
 for (let c = 0; c < cols; c++) {
   const seat = `${r}${letters[c]}`;
   grid.push({ seat, row: r, col: c, label: seat });
   }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Armchair className="size-5 text-emerald-500" />
            Select Your Seats
          </DialogTitle>
          <DialogDescription>
            {route.routeNumber} — {route.startLocation} → {route.endLocation}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seat legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded border-2 border-emerald-400" />
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-gray-300" />
              <span className="text-muted-foreground">Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Selected</span>
            </div>
          </div>

          {/* Seat grid */}
          <div className="rounded-xl border bg-muted/20 p-3">
            {/* Driver area */}
            <div className="flex justify-center mb-3">
              <div className="h-6 w-16 rounded-t-lg bg-muted-foreground/20 flex items-center justify-center text-[10px] text-muted-foreground">
                Driver
              </div>
            </div>
            {/* Seats */}
            <div className="grid grid-cols-4 gap-1.5">
              {grid.map(({ seat, col }) => {
                // Add aisle gap after column 1 (B)
                const isAisleAfter = col === 1;
                return (
                  <div
                    key={seat}
                    className={`relative flex items-center justify-center h-9 w-full rounded-md border-2 text-xs font-medium transition-all ${getSeatStyle(seat)} ${isAisleAfter ? 'mr-2' : ''}`}
                    onClick={() => toggleSeat(seat)}
                  >
                    {seat}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-center gap-8 text-[10px] text-muted-foreground">
              <span>A B</span>
              <span>C D</span>
            </div>
          </div>

          {/* Selection summary */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected Seats</span>
              <span className="font-medium">
                {selectedSeats.size > 0 ? Array.from(selectedSeats).sort().join(', ') : 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price per seat</span>
              <span className="text-sm font-medium">{formatCurrency(seatPrice)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Total</span>
              <span className={`text-lg font-bold ${selectedSeats.size > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={selectedSeats.size === 0}
            onClick={() => onConfirm(Array.from(selectedSeats))}
          >
            <CheckCircle2 className="size-4" />
            Confirm {selectedSeats.size} Seat{selectedSeats.size !== 1 ? 's' : ''} — {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Travel Stats (Journey History) ──────────────────────────────────────────

function TravelStats({ journeys, visible }: { journeys: Journey[]; visible: boolean }) {
  const totalTrips = journeys.length;
  const totalDist = journeys.reduce((s, j) => s + (jDistance(j) ?? 0), 0);
  const totalSpent = journeys.reduce((s, j) => s + (j.cost ?? 0), 0);
  const ratedJourneys = journeys.filter(j => (j.rating ?? 0) > 0);
  const avgRating = ratedJourneys.length > 0
    ? ratedJourneys.reduce((s, j) => s + (j.rating ?? 0), 0) / ratedJourneys.length
    : 0;

  const animatedTrips = useAnimatedCounter(visible ? totalTrips : 0, 1200);
  const animatedDist = useAnimatedCounter(visible ? Math.round(totalDist) : 0, 1500);
  const animatedSpent = useAnimatedCounter(visible ? Math.round(totalSpent) : 0, 1800);
  const animatedRatingX10 = useAnimatedCounter(visible ? Math.round(avgRating * 10) : 0, 1400);

  const statCards = [
    { label: 'Total Trips', value: String(animatedTrips), icon: Bus, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Total Distance', value: `${animatedDist.toLocaleString()} km`, icon: Navigation, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
    { label: 'Total Spent', value: `₹${animatedSpent.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Average Rating', value: `${(animatedRatingX10 / 10).toFixed(1)} / 5`, icon: Star, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  ];

  return (
    <Card className={`border-primary/10 ${visible ? '' : 'hidden'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-5 text-primary" />
          Travel Stats
        </CardTitle>
        <CardDescription>Your journey statistics at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center transition-all hover:shadow-sm`}>
              <s.icon className={`mx-auto mb-2 size-6 ${s.color}`} />
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Debounced Autocomplete Input ────────────────────────────────────────────

function AutocompleteInput({
  label,
  placeholder,
  allRoutes,
  locations,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  allRoutes: RouteResult[];
  locations: string[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<{ type: 'route' | 'city'; text: string; sub: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = useCallback((inputVal: string) => {
    setQuery(inputVal);
    onChange(inputVal);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (inputVal.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const q = inputVal.toLowerCase();
      const results: { type: 'route' | 'city'; text: string; sub: string }[] = [];

      // Match route numbers
      const routeMatches = allRoutes.filter(r =>
        r.routeNumber.toLowerCase().includes(q)
      ).slice(0, 3);
      for (const r of routeMatches) {
        results.push({ type: 'route', text: r.routeNumber, sub: `${r.startLocation} → ${r.endLocation}` });
      }

      // Match location/city names
      const cityMatches = locations.filter(l =>
        l.toLowerCase().includes(q)
      ).slice(0, 5);
      for (const c of cityMatches) {
        results.push({ type: 'city', text: c, sub: 'Location' });
      }

      setSuggestions(results);
      setShowDropdown(results.length > 0);
    }, 300);
  }, [allRoutes, locations, onChange]);

  return (
    <div className="relative">
      <label className="text-sm font-medium">{label}</label>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={query}
        onChange={e => handleInputChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.text}-${i}`}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                const selectVal = s.type === 'city' ? s.text : s.text;
                setQuery(selectVal);
                onChange(selectVal);
                setShowDropdown(false);
              }}
            >
              {s.type === 'route' ? (
                <Route className="size-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.text}</p>
                <p className="text-xs text-muted-foreground truncate">{s.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Map Route Comparison Panel ──────────────────────────────────────────────

function MapRouteComparison({ routes, onClose }: { routes: RouteResult[]; onClose: () => void }) {
  if (routes.length < 2) return null;

  const metrics = [
    { label: 'Distance', render: (r: RouteResult) => r.distanceKm ? `${r.distanceKm} km` : '—' },
    { label: 'Duration', render: (r: RouteResult) => formatDuration(r.durationMin) },
    { label: 'Fare', render: (r: RouteResult) => formatCurrency(r.fare), highlight: (rs: RouteResult[]) => {
      const fares = rs.map(rt => rt.fare ?? 0).filter(f => f > 0);
      return fares.length > 0;
    }},
    { label: 'Stops', render: (r: RouteResult) => String(r.stopsCount ?? '—') },
    { label: 'Rating', render: (_r: RouteResult, i: number) => {
      const ratings = [4.2, 3.8, 4.5]; // deterministic
      return `${ratings[i % ratings.length]} ★`;
    }},
  ];

  return (
    <Card className="border-primary/30 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitCompareArrows className="size-4 text-primary" />
            Route Comparison
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Compact grid layout */}
        <div className="space-y-2">
          {/* Route headers */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${routes.length}, 1fr)` }}>
            <div className="text-xs text-muted-foreground font-medium">Metric</div>
            {routes.map(r => (
              <div key={r.id} className="text-center">
                <Badge variant="outline" className="font-mono text-[10px]">{r.routeNumber}</Badge>
              </div>
            ))}
          </div>

          {/* Metric rows */}
          {metrics.map(m => (
            <div key={m.label} className="grid gap-2 rounded-lg bg-muted/20 p-2" style={{ gridTemplateColumns: `100px repeat(${routes.length}, 1fr)` }}>
              <div className="flex items-center text-xs font-medium text-muted-foreground">{m.label}</div>
              {routes.map((r, i) => (
                <div key={r.id} className="text-center text-sm font-medium">
                  {m.render(r, i)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Commute Statistics Card ────────────────────────────────────────────────

function CommuteStatistics({ userId }: { userId: string }) {
  const stats = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < userId.length; i++) {
      seed = ((seed << 5) - seed + userId.charCodeAt(i)) | 0;
    }
    const absSeed = Math.abs(seed);

    const totalCommutes = (absSeed % 50) + 20;
    const favoriteRouteNums = ['R-101', 'R-215', 'R-335', 'R-500', 'R-142', 'R-287', 'R-401', 'R-512'];
    const favoriteRoute = favoriteRouteNums[absSeed % favoriteRouteNums.length];
    const avgFare = (absSeed % 30) + 20;
    const savingsPct = (absSeed % 15) + 25;

    return { totalCommutes, favoriteRoute, avgFare, savingsPct };
  }, [userId]);

  const metrics = [
    {
      label: 'Total Commutes',
      value: String(stats.totalCommutes),
      icon: Bus,
      iconBg: 'bg-sky-100',
      iconColor: 'text-sky-600',
    },
    {
      label: 'Favorite Route',
      value: stats.favoriteRoute,
      icon: Bus,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      label: 'Avg Daily Fare',
      value: formatCurrency(stats.avgFare),
      icon: IndianRupee,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Monthly Savings',
      value: `${stats.savingsPct}%`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
  ];

  return (
    <Card className="transit-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-emerald-500" />
          Commute Statistics
        </CardTitle>
        <CardDescription>Your travel patterns at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map(m => (
            <div key={m.label} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${m.iconBg}`}>
                <m.icon className={`size-5 ${m.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-lg font-bold tracking-tight">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loyalty & Rewards Panel ──────────────────────────────────────────────────

const LOYALTY_TIERS = [
  { name: 'Bronze', threshold: 0, color: 'bg-amber-700', textColor: 'text-amber-700', ringColor: 'ring-amber-500', gradientFrom: '#92400e', gradientTo: '#d97706' },
  { name: 'Silver', threshold: 1000, color: 'bg-sky-600', textColor: 'text-sky-600', ringColor: 'ring-sky-400', gradientFrom: '#0284c7', gradientTo: '#7dd3fc' },
  { name: 'Gold', threshold: 2500, color: 'bg-emerald-600', textColor: 'text-emerald-600', ringColor: 'ring-emerald-400', gradientFrom: '#059669', gradientTo: '#6ee7b7' },
  { name: 'Platinum', threshold: 5000, color: 'bg-violet-600', textColor: 'text-violet-600', ringColor: 'ring-violet-400', gradientFrom: '#7c3aed', gradientTo: '#c4b5fd' },
];

const REWARDS_CATALOG = [
  { id: 'free-ride', name: 'Free Ride Coupon', points: 500, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', desc: 'One free bus ride up to ₹100' },
  { id: 'priority', name: 'Priority Boarding Pass', points: 300, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', desc: 'Skip the queue for 5 rides' },
  { id: 'discount', name: '10% Discount Voucher', points: 200, icon: Percent, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200', desc: '10% off on any route fare' },
  { id: 'lounge', name: 'Exclusive Lounge Access', points: 1000, icon: Crown, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', desc: 'Premium lounge access for 1 month' },
];

const SEED_POINTS_HISTORY = [
  { id: 'ph1', type: 'earned' as const, description: 'Trip completed - Route 500', points: 50, date: '2025-07-14' },
  { id: 'ph2', type: 'earned' as const, description: 'Bonus: 5 trips in a week', points: 100, date: '2025-07-12' },
  { id: 'ph3', type: 'spent' as const, description: 'Redeemed: Priority Boarding Pass', points: -300, date: '2025-07-10' },
  { id: 'ph4', type: 'earned' as const, description: 'Trip completed - Route 215', points: 50, date: '2025-07-08' },
  { id: 'ph5', type: 'earned' as const, description: 'Referral bonus', points: 200, date: '2025-07-05' },
];

function AnimatedSparkle({ className }: { className?: string }) {
  return (
    <span className={`inline-block animate-pulse ${className ?? ''}`}>
      <Sparkles className="size-4 fill-amber-400 text-amber-400" />
    </span>
  );
}

function LoyaltyRewardsPanel() {
  const [currentPoints, setCurrentPoints] = useState(2450);
  const [progressAnimated, setProgressAnimated] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);

  const currentTierIndex = LOYALTY_TIERS.findIndex((t, i) => {
    const next = LOYALTY_TIERS[i + 1];
    return !next || currentPoints < next.threshold;
  });
  const currentTier = LOYALTY_TIERS[currentTierIndex];
  const nextTier = LOYALTY_TIERS[currentTierIndex + 1];
  const progressToNext = nextTier
    ? ((currentPoints - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100
    : 100;
  const pointsToNext = nextTier ? nextTier.threshold - currentPoints : 0;

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setProgressAnimated(progressToNext), 100);
    return () => clearTimeout(timer);
  }, [progressToNext]);

  const handleCheckIn = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    setCurrentPoints(prev => prev + 10);
    toast({
      title: 'Check-in successful!',
      description: '+10 points earned. Come back tomorrow for more!',
    });
  };

  return (
    <div className="space-y-6">
      {/* Points Display + Tier */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${currentTier.bg} ring-2 ${currentTier.ringColor} ring-offset-2`}>
            <Award className={`size-8 ${currentTier.textColor}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Points</p>
            <p className="text-4xl font-extrabold gradient-text-warm tabular-nums flex items-center gap-2">
              <AnimatedSparkle />
              {currentPoints.toLocaleString()} pts
            </p>
            <Badge variant="outline" className={`mt-1 ${currentTier.textColor} ${currentTier.bg}`}>
              {currentTier.name} Tier
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 items-stretch">
          {/* Daily Check-in Button */}
          <Button
            variant={checkedIn ? 'secondary' : 'default'}
            size="sm"
            className={checkedIn ? 'opacity-70 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'}
            onClick={handleCheckIn}
            disabled={checkedIn}
          >
            {checkedIn ? (
              <><CheckCircle2 className="size-4 mr-1" /> Checked In Today</>
            ) : (
              <><Sparkles className="size-4 mr-1" /> Daily Check-in (+10 pts)</>
            )}
          </Button>

          {/* Tier Progress */}
          <div className="max-w-xs space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">{currentTier.name}</span>
              <span className="font-medium text-muted-foreground">{nextTier ? nextTier.name : 'Max'}</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-1500 ease-out"
                style={{
                  width: `${Math.min(progressAnimated, 100)}%`,
                  background: `linear-gradient(90deg, ${currentTier.gradientFrom}, ${currentTier.gradientTo})`,
                }}
              />
            </div>
            {nextTier && (
              <p className="text-xs text-muted-foreground text-right">
                {pointsToNext.toLocaleString()} pts to {nextTier.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* All Tiers */}
      <div className="flex gap-2 flex-wrap">
        {LOYALTY_TIERS.map((tier, i) => (
          <div
            key={tier.name}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              i === currentTierIndex
                ? `${tier.bg} text-white ring-2 ${tier.ringColor} ring-offset-1`
                : i < currentTierIndex
                  ? `${tier.bg}/20 ${tier.textColor}`
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i <= currentTierIndex ? <CheckCircle2 className="size-3" /> : <CircleDot className="size-3" />}
            {tier.name}
            <span className="opacity-70">{tier.threshold > 0 ? `${(tier.threshold / 1000).toFixed(tier.threshold % 1000 === 0 ? 0 : 1)}k` : '0'}</span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Rewards Catalog */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-amber-500" />
          Rewards Catalog
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REWARDS_CATALOG.map(reward => {
            const canRedeem = currentPoints >= reward.points;
            const Icon = reward.icon;
            return (
              <div
                key={reward.id}
                className={`card-lift relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                  canRedeem
                    ? `${reward.bg} ${reward.border} cursor-pointer hover:shadow-md`
                    : 'border-dashed border-muted bg-muted/30 opacity-60'
                }`}
                onClick={() => {
                  if (canRedeem) {
                    toast({
                      title: `${reward.name} Redeemed!`,
                      description: `${reward.points} points deducted. Enjoy your reward!`,
                    });
                  }
                }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${reward.bg} ${canRedeem ? reward.color : 'text-muted-foreground'}`}>
                  <Icon className="size-5" />
                </div>
                <p className="text-sm font-semibold">{reward.name}</p>
                <p className="text-xs text-muted-foreground">{reward.desc}</p>
                <Badge variant={canRedeem ? 'default' : 'secondary'} className="text-xs">
                  {reward.points} pts
                </Badge>
                {!canRedeem && (
                  <p className="text-[10px] text-muted-foreground">Need {(reward.points - currentPoints).toLocaleString()} more</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Points History */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="size-4 text-emerald-500" />
          Recent Points Activity
        </h3>
        <div className="space-y-2">
          {SEED_POINTS_HISTORY.map(tx => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.type === 'earned' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                  {tx.type === 'earned' ? (
                    <ArrowDownLeft className="size-4 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="size-4 text-rose-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <span className={`font-semibold tabular-nums ${tx.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {tx.type === 'earned' ? '+' : ''}{tx.points} pts
              </span>
            </div>
          ))}
        </div>
      </div>
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
    if (h < 12) return { text: 'Good Morning', icon: Sun, emoji: '🌅' };
    if (h < 17) return { text: 'Good Afternoon', icon: Coffee, emoji: '☀️' };
    return { text: 'Good Evening', icon: Moon, emoji: '🌙' };
  }, []);

  const plannedCount = stats ? recentJourneys.length : 0;
  const completedCount = stats?.totalTrips ? Math.max(0, stats.totalTrips - plannedCount) : 0;

  const animatedSpent = useAnimatedCounter(stats?.totalSpent ? Math.round(stats.totalSpent) : 0, 1400);
  const animatedTrips = useAnimatedCounter(stats?.totalTrips ?? 0, 1200);
  const animatedPlanned = useAnimatedCounter(plannedCount, 1000);

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

  const statCards = [
    {
      title: 'Total Spent',
      value: `₹${animatedSpent.toLocaleString('en-IN')}`,
      icon: Wallet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Trips',
      value: String(animatedTrips),
      icon: Bus,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      title: 'Planned Journeys',
      value: String(animatedPlanned),
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
              <hourGreeting.icon className="size-5" />
              <p className="text-sm font-medium opacity-90">{hourGreeting.emoji} {hourGreeting.text}!</p>
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

      {/* Commute Statistics */}
      <CommuteStatistics userId={userId} />

      {/* Quick Trip Planner */}
      <QuickTripPlanner onFindRoutes={(from, to) => {
        toast({
          title: 'Searching Routes...',
          description: `Finding routes from ${from} to ${to}`,
        });
        setPortal('search');
      }} />

      {/* Trip Planner */}
      <TripPlanner onFindRoutes={() => setPortal('search')} />

      {/* Trip Countdown + Live Bus Tracker */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Trip Countdown */}
        {recentJourneys.length > 0 && (
          <UpcomingTripCountdown journey={recentJourneys[0]} />
        )}

        {/* Live Bus Tracker */}
        <LiveBusTracker />
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

      {/* Loyalty & Rewards Tracker */}
      <Card className="stat-card-premium overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            Loyalty & Rewards
          </CardTitle>
          <CardDescription>Track your points and redeem rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <LoyaltyRewardsPanel />
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
  const [seatSelectionRoute, setSeatSelectionRoute] = useState<RouteResult | null>(null);
  const [sortBy, setSortBy] = useState('price-asc');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const toggleFilter = useCallback((filter: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }, []);

  const filteredSortedResults = useMemo(() => {
    let sorted = [...results];
    // Apply filters
    if (activeFilters.has('under30')) {
      sorted = sorted.filter(r => (r.fare ?? 0) <= 30);
    }
    if (activeFilters.has('direct')) {
      sorted = sorted.filter(r => (r.stopsCount ?? 99) <= 2);
    }
    if (activeFilters.has('ac')) {
      sorted = sorted.filter(r => r.city !== 'intercity');
    }
    // Sort
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => (a.fare ?? 0) - (b.fare ?? 0));
        break;
      case 'price-desc':
        sorted.sort((a, b) => (b.fare ?? 0) - (a.fare ?? 0));
        break;
      case 'duration':
        sorted.sort((a, b) => (a.durationMin ?? 0) - (b.durationMin ?? 0));
        break;
      case 'distance':
        sorted.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
        break;
    }
    return sorted;
  }, [results, sortBy, activeFilters]);

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

  const handleBook = useCallback(async (route: RouteResult, seats?: string[]) => {
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
        description: seats && seats.length > 0
          ? `Booked route ${route.routeNumber} with seats ${seats.join(', ')}. Happy journey!`
          : `Successfully booked route ${route.routeNumber}. Happy journey!`,
      });
      setExpandedRouteId(null);
      setSeatSelectionRoute(null);
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
                  <AutocompleteInput
                    label="From"
                    placeholder="Start location or route..."
                    allRoutes={allRoutes}
                    locations={locations}
                    value={startLocation}
                    onChange={setStartLocation}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {['Majestic Bus Stand', 'Whitefield', 'Electronic City', 'Koramangala'].map(loc => (
                      <button
                        key={loc}
                        type="button"
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-all ${
                          startLocation === loc
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-primary dark:border-muted-foreground/40'
                        }`}
                        onClick={() => setStartLocation(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <AutocompleteInput
                    label="To"
                    placeholder="End location or route..."
                    allRoutes={allRoutes}
                    locations={locations}
                    value={endLocation}
                    onChange={setEndLocation}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {['MG Road', 'Indiranagar', 'HSR Layout', 'Marathahalli'].map(loc => (
                      <button
                        key={loc}
                        type="button"
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-all ${
                          endLocation === loc
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-primary dark:border-muted-foreground/40'
                        }`}
                        onClick={() => setEndLocation(loc)}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
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
                <Badge variant="secondary" className="ml-2">{filteredSortedResults.length} routes</Badge>
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[170px] h-8 text-xs">
                    <Filter className="size-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">Price: Low → High</SelectItem>
                    <SelectItem value="price-desc">Price: High → Low</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                  </SelectContent>
                </Select>
                {/* Filter chips */}
                <div className="flex items-center gap-1.5">
                  {[
                    { key: 'ac', label: 'AC Only', icon: Snowflake },
                    { key: 'direct', label: 'Direct', icon: GitCompareArrows },
                    { key: 'under30', label: 'Under ₹30', icon: IndianRupee },
                  ].map(chip => {
                    const isActive = activeFilters.has(chip.key);
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => toggleFilter(chip.key)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-primary dark:border-muted-foreground/40'
                        }`}
                      >
                        <chip.icon className="size-3" />
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
                {selectedForCompare.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {selectedForCompare.size} for compare
                    </span>
                    {selectedForCompare.size >= 2 && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowComparison(true)}>
                        <GitCompareArrows className="size-3" />
                        Compare
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedForCompare(new Set())}>
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto space-y-3">
              {filteredSortedResults.map((route, routeIdx) => {
                const isSelected = selectedForCompare.has(route.id);
                const isFav = favs.has(route.id);
                const isExpanded = expandedRouteId === route.id;
                return (
                  <div key={route.id}>
                    <Card
                      className={`border transition-all hover:shadow-sm ${isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : ''} ${
                        routeIdx === 0 ? 'relative overflow-hidden' : ''
                      }`}
                    >
                      {/* Animated gradient border on best match */}
                      {routeIdx === 0 && (
                        <div className="absolute inset-0 rounded-lg pointer-events-none animate-gradient-shift" style={{
                          background: 'linear-gradient(90deg, #10b981, #3b82f6, #f59e0b, #8b5cf6, #10b981)',
                          backgroundSize: '200% 200%',
                          padding: '2px',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                        }} />
                      )}
                      {routeIdx === 0 && (
                        <Badge className="absolute top-2 right-2 z-10 text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                          <Sparkles className="size-3 mr-1" /> Best Match
                        </Badge>
                      )}
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs">
                                {route.routeNumber}
                              </Badge>
                              {trafficBadge(route.trafficLevel)}
                              <SeatBadge trafficLevel={route.trafficLevel} />
                              <WeatherBadge city={route.city} />
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
                                <Clock className="size-3" />
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
                                onClick={() => setSeatSelectionRoute(route)}
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
                          onBook={(seats) => {
                            handleBook(route, seats);
                          }}
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

      {/* Seat Selection Dialog */}
      {seatSelectionRoute && (
        <SeatSelection
          route={seatSelectionRoute}
          onConfirm={(seats) => handleBook(seatSelectionRoute, seats)}
          onClose={() => setSeatSelectionRoute(null)}
        />
      )}
    </div>
  );
}

// ─── Route ETA Calculator ───────────────────────────────────────────────────

function RouteETACalculator({ selectedRoute, stops }: { selectedRoute: RouteResult | null; stops: { name: string; lat: number; lng: number }[] }) {
  const [startStop, setStartStop] = useState('');
  const [endStop, setEndStop] = useState('');
  const [calculated, setCalculated] = useState<{ time: string; distance: string; fare: string; stopsCount: number } | null>(null);

  const availableStops = useMemo(() => {
    return stops.map(s => s.name);
  }, [stops]);

  const handleCalculate = useCallback(() => {
    if (!startStop || !endStop || startStop === endStop) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select different start and end stops.',
        variant: 'destructive',
      });
      return;
    }
    const startIdx = availableStops.indexOf(startStop);
    const endIdx = availableStops.indexOf(endStop);
    if (startIdx < 0 || endIdx < 0) return;

    const stopDiff = Math.abs(endIdx - startIdx);
    const distPerStop = (selectedRoute?.distanceKm ?? 20) / Math.max(availableStops.length, 1);
    const distance = stopDiff * distPerStop;
    const durationMin = Math.round(distance * 2.5 + stopDiff * 3);
    const fare = Math.round(5 + distance * 2);
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;

    setCalculated({
      time: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      distance: `${distance.toFixed(1)} km`,
      fare: formatCurrency(fare),
      stopsCount: stopDiff,
    });
  }, [startStop, endStop, availableStops, selectedRoute]);

  return (
    <Card className="transit-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="size-5 text-emerald-500" />
          Route ETA Calculator
        </CardTitle>
        <CardDescription>Estimate travel time between stops</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedRoute ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Select a route to calculate ETA</p>
        ) : availableStops.length < 2 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Not enough stops data for this route</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-emerald-500" /> Start Stop
                </label>
                <Select value={startStop} onValueChange={setStartStop}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select start stop..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStops.map((s, i) => (
                      <SelectItem key={i} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPinned className="size-3.5 text-rose-500" /> End Stop
                </label>
                <Select value={endStop} onValueChange={setEndStop}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select end stop..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStops.map((s, i) => (
                      <SelectItem key={i} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!startStop || !endStop || startStop === endStop}
              onClick={handleCalculate}
            >
              <Calculator className="size-4 mr-1" />
              Calculate ETA
            </Button>

            {calculated && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-3 text-center">
                  <Clock className="mx-auto size-5 text-sky-500 mb-1" />
                  <p className="text-lg font-bold text-sky-700 dark:text-sky-400">{calculated.time}</p>
                  <p className="text-[10px] text-muted-foreground">Est. Time</p>
                </div>
                <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-3 text-center">
                  <Navigation className="mx-auto size-5 text-emerald-500 mb-1" />
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{calculated.distance}</p>
                  <p className="text-[10px] text-muted-foreground">Distance</p>
                </div>
                <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-3 text-center">
                  <IndianRupee className="mx-auto size-5 text-amber-500 mb-1" />
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{calculated.fare}</p>
                  <p className="text-[10px] text-muted-foreground">Est. Fare</p>
                </div>
                <div className="rounded-lg border bg-muted/30 dark:bg-muted/10 p-3 text-center">
                  <Waypoints className="mx-auto size-5 text-violet-500 mb-1" />
                  <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{calculated.stopsCount}</p>
                  <p className="text-[10px] text-muted-foreground">Stops</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
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
  const [compareRouteIds, setCompareRouteIds] = useState<Set<string>>(new Set());

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

  const toggleCompareRoute = useCallback((routeId: string) => {
    setCompareRouteIds(prev => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else if (next.size < 3) next.add(routeId);
      return next;
    });
  }, []);

  const comparedRoutes = useMemo(() => {
    return routes.filter(r => compareRouteIds.has(r.id));
  }, [routes, compareRouteIds]);

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
          {selectedRoute && (
            <Button
              variant={compareRouteIds.has(selectedRoute.id) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleCompareRoute(selectedRoute.id)}
            >
              <GitCompareArrows className="size-3.5" />
              <span className="ml-1 hidden sm:inline">{compareRouteIds.has(selectedRoute.id) ? 'Selected for Compare' : 'Compare'}</span>
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

            {/* Route Comparison Overlay */}
            {comparedRoutes.length >= 2 && (
              <div className="absolute bottom-4 left-4 right-4 z-[1001] max-w-lg mx-auto">
                <MapRouteComparison
                  routes={comparedRoutes}
                  onClose={() => setCompareRouteIds(new Set())}
                />
              </div>
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

      {/* Route ETA Calculator */}
      <RouteETACalculator selectedRoute={selectedRoute} stops={stops} />
    </div>
  );
}

// ─── Travel Timeline ────────────────────────────────────────────────────────

function TravelTimeline({ userId }: { userId: string }) {
  const entries = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < userId.length; i++) {
      seed = ((seed << 5) - seed + userId.charCodeAt(i)) | 0;
    }
    const absSeed = Math.abs(seed);

    const statuses: Array<'completed' | 'planned' | 'cancelled'> = ['completed', 'completed', 'completed', 'completed', 'planned', 'cancelled'];
    const routeNumbers = ['R-101', 'R-215', 'R-335', 'R-500', 'R-142', 'R-287'];
    const fromCities = ['Majestic', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'];
    const toCities = ['Electronic City', 'MG Road', 'Hebbal', 'Marathahalli', 'Silk Board', 'Basavanagudi'];
    const fares = [35, 45, 25, 55, 40, 30];

    const today = new Date();

    return statuses.map((status, i) => {
      const dayOffset = status === 'planned' ? 3 : status === 'cancelled' ? -3 : -(i * 5 + 1);
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);

      return {
        date: format(d, 'MMM dd'),
        routeNumber: routeNumbers[(absSeed + i) % routeNumbers.length],
        from: fromCities[(absSeed + i * 3) % fromCities.length],
        to: toCities[(absSeed + i * 7) % toCities.length],
        fare: fares[(absSeed + i * 2) % fares.length],
        status: status as 'completed' | 'planned' | 'cancelled',
      };
    });
  }, [userId]);

  const statusDot: Record<string, string> = {
    completed: 'bg-emerald-500 ring-emerald-200',
    planned: 'bg-amber-500 ring-amber-200',
    cancelled: 'bg-red-500 ring-red-200',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-amber-500" />
          Travel Timeline
        </CardTitle>
        <CardDescription>Your recent travel activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-muted-foreground/15" />
          <div className="space-y-5">
            {entries.map((entry, i) => {
              const StatusIcon = entry.status === 'completed' ? CheckCircle2 : entry.status === 'planned' ? Clock : XCircle;
              const iconColor = entry.status === 'completed' ? 'text-emerald-500' : entry.status === 'planned' ? 'text-amber-500' : 'text-red-500';
              return (
                <div key={i} className="flex items-start gap-4 pl-0.5">
                  {/* Timeline dot */}
                  <div className={`relative z-10 mt-2.5 h-[10px] w-[10px] shrink-0 rounded-full ring-2 ${statusDot[entry.status] ?? statusDot.completed}`} />
                  {/* Entry card */}
                  <div className="flex-1 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/30">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                      <StatusIcon className={`size-3.5 ${iconColor}`} />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {entry.routeNumber}
                      </Badge>
                      <span className="text-muted-foreground">{entry.from}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="font-medium">{entry.to}</span>
                    </div>
                    <div className="mt-1.5 text-xs font-medium text-emerald-700">
                      {formatCurrency(entry.fare)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Booking Status Timeline ─────────────────────────────────────────────────

const BOOKING_STAGES = [
  { label: 'Booked', dotColor: 'bg-emerald-500', ringColor: 'ring-emerald-200', darkRing: 'dark:ring-emerald-800' },
  { label: 'Confirmed', dotColor: 'bg-blue-500', ringColor: 'ring-blue-200', darkRing: 'dark:ring-blue-800' },
  { label: 'Boarding', dotColor: 'bg-amber-500', ringColor: 'ring-amber-200', darkRing: 'dark:ring-amber-800' },
  { label: 'Completed', dotColor: 'bg-emerald-500', ringColor: 'ring-emerald-200', darkRing: 'dark:ring-emerald-800' },
];

function BookingStatusTimeline({ status }: { status: string | undefined }) {
  const statusIdx = (() => {
    const s = status?.toLowerCase() ?? 'planned';
    if (s === 'planned' || s === 'booked') return 0;
    if (s === 'confirmed') return 1;
    if (s === 'boarding') return 2;
    if (s === 'completed') return 3;
    return 0;
  })();

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {BOOKING_STAGES.map((stage, idx) => {
        const isCompleted = idx < statusIdx;
        const isActive = idx === statusIdx;
        const isFuture = idx > statusIdx;
        return (
          <React.Fragment key={stage.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div
                  className={`h-4 w-4 rounded-full ring-2 transition-all duration-500 ${
                    isCompleted
                      ? `${stage.dotColor} ${stage.ringColor} ${stage.darkRing}`
                      : isActive
                        ? `${stage.dotColor} ${stage.ringColor} ${stage.darkRing}`
                        : 'bg-gray-300 ring-gray-200 dark:bg-gray-600 dark:ring-gray-700'
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${stage.dotColor} opacity-75`} />
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${stage.dotColor}`} />
                  </span>
                )}
                {isCompleted && (
                  <CheckCircle2 className="absolute inset-0 size-4 text-white" strokeWidth={3} />
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors duration-300 ${
                  isCompleted || isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground/40'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {idx < BOOKING_STAGES.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 rounded-full transition-colors duration-500 ${
                  idx < statusIdx
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
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
      {/* Travel Timeline */}
      <TravelTimeline userId={userId} />

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

                    {/* Status Timeline */}
                    <div className="px-4">
                      <BookingStatusTimeline status={j.status} />
                    </div>

                    {/* Middle section: Journey details + QR */}
                    <div className="flex items-stretch px-5 py-4">
                      <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Bus Registration</p>
                          <p className="text-sm font-bold font-mono text-primary">KA-01-{String(Math.abs(j.id.charCodeAt(0) * 1234 + 1000)).slice(0, 4)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Travel Date</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <CalendarClock className="size-3 text-muted-foreground" />
                            {jDate(j)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Departure Time</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" />
                            {jTime(j)}
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
                        <QRPattern seed={j.id} size={96} />
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
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: 'Link copied to clipboard!',
                              description: `Booking link for ${jRouteNumber(j)} has been copied.`,
                            });
                          }}
                        >
                          <Share2 className="size-3" />
                          Share
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

// ─── Monthly Spending Trend Chart ────────────────────────────────────────────

function MonthlySpendingChart({ journeys }: { journeys: Journey[] }) {
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    for (const j of journeys) {
      const d = j.schedule?.date;
      if (!d) continue;
      const monthKey = d.slice(0, 7); // "YYYY-MM"
      monthMap[monthKey] = (monthMap[monthKey] ?? 0) + (j.cost ?? 0);
    }
    // Get last 6 months
    const now = new Date();
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM');
      months.push({ label, value: monthMap[key] ?? 0 });
    }
    return months;
  }, [journeys]);

  const maxValue = Math.max(...monthlyData.map(m => m.value), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {monthlyData.map((m) => (
        <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
            {m.value > 0 ? `₹${(m.value / 100).toFixed(0)}${m.value >= 1000 ? '' : ''}` : ''}
          </span>
          <div className="w-full relative" style={{ height: '80px' }}>
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-300 dark:from-emerald-600 dark:to-emerald-400 transition-all duration-700"
              style={{ height: `${Math.max((m.value / maxValue) * 100, 4)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Enhanced Journey Rating Types ────────────────────────────────────────────

interface CategoryRatings {
  punctuality: number;
  comfort: number;
  safety: number;
  staffBehavior: number;
}

const RATING_CATEGORIES = [
  { key: 'punctuality' as keyof CategoryRatings, label: 'Punctuality', icon: Clock },
  { key: 'comfort' as keyof CategoryRatings, label: 'Comfort', icon: Armchair },
  { key: 'safety' as keyof CategoryRatings, label: 'Safety', icon: Shield },
  { key: 'staffBehavior' as keyof CategoryRatings, label: 'Staff Behavior', icon: Users },
];

// ─── Travel Insights Card ──────────────────────────────────────────────────

function TravelInsights({ userId, journeys }: { userId: string; journeys: Journey[] }) {
  const insights = useMemo(() => {
    // Deterministic based on userId
    let seed = 0;
    for (let i = 0; i < userId.length; i++) {
      seed = ((seed << 5) - seed + userId.charCodeAt(i)) | 0;
    }
    const absSeed = Math.abs(seed);

    // Most Visited Route
    const routeCounts: Record<string, number> = {};
    for (const j of journeys) {
      const rn = jRouteNumber(j);
      if (rn && rn !== '—') routeCounts[rn] = (routeCounts[rn] ?? 0) + 1;
    }
    const sortedRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
    const mostVisitedRoute = sortedRoutes.length > 0 ? sortedRoutes[0][0] : '—';
    const visitCount = sortedRoutes.length > 0 ? sortedRoutes[0][1] : 0;

    // Favorite Time (most common departure hour)
    const hourCounts: Record<number, number> = {};
    for (const j of journeys) {
      const t = j.schedule?.departureTime;
      if (!t) continue;
      const h = parseInt(t.split(':')[0], 10);
      if (!isNaN(h)) hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    }
    const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    let favoriteTime = '—';
    if (sortedHours.length > 0) {
      const hour = Number(sortedHours[0][0]);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      favoriteTime = `${h12}:00 ${ampm}`;
    }

    // Total Distance
    const totalDistance = journeys.reduce((s, j) => s + (jDistance(j) ?? 0), 0);

    // Avg Trip Duration (deterministic from userId if no data)
    const avgDurationMin = totalDistance > 0
      ? Math.round(totalDistance / Math.max(journeys.length, 1) * 2.5 + absSeed % 15)
      : 30 + (absSeed % 20);

    return { mostVisitedRoute, visitCount, favoriteTime, totalDistance, avgDurationMin };
  }, [userId, journeys]);

  const insightCards = [
    {
      label: 'Most Visited Route',
      value: insights.mostVisitedRoute,
      sub: `${insights.visitCount} trip${insights.visitCount !== 1 ? 's' : ''}`,
      icon: Route,
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Favorite Time',
      value: insights.favoriteTime,
      sub: 'Most common hour',
      icon: Clock,
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Total Distance',
      value: `${insights.totalDistance.toFixed(0)} km`,
      sub: 'All trips combined',
      icon: Bus,
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Avg Trip Duration',
      value: formatDuration(insights.avgDurationMin),
      sub: 'Per trip average',
      icon: Timer,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <Card className="card-lift overflow-hidden border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-5 text-primary" />
          Travel Insights
        </CardTitle>
        <CardDescription>Your personalized travel patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 stagger-entry">
          {insightCards.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-2 rounded-xl border bg-muted/20 p-4 text-center transition-all hover:bg-muted/40 hover:shadow-sm">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${s.iconBg}`}>
                <s.icon className={`size-5 ${s.iconColor}`} />
              </div>
              <p className={`text-lg font-bold tabular-nums ${s.iconColor}`}>{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/70">{s.sub}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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

  // Enhanced rating state
  const [expandedJourneyId, setExpandedJourneyId] = useState<string | null>(null);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, CategoryRatings>>({});

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
        description: 'Thank you for your detailed feedback.',
      });
      setExpandedJourneyId(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rating submission failed');
    } finally {
      setSubmitting(null);
    }
  }, [ratings, feedbacks]);

  return (
    <div className="space-y-4">
      {/* Travel Stats */}
      {!loading && journeys.length > 0 && (
        <TravelStats journeys={journeys} visible={true} />
      )}

      {/* Travel Insights Card */}
      {!loading && journeys.length > 0 && (
        <TravelInsights userId={userId} journeys={journeys} />
      )}

      {/* Enhanced Stats Cards */}
      {!loading && journeys.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Most Visited Route */}
          <Card className="card-lift hover:scale-[1.02] transition-all duration-300">
            <CardContent className="py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <Route className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Most Visited Route</p>
                  <p className="text-lg font-bold">{(() => {
                    const routeCounts: Record<string, number> = {};
                    for (const j of journeys) {
                      const rn = jRouteNumber(j);
                      if (rn && rn !== '—') routeCounts[rn] = (routeCounts[rn] ?? 0) + 1;
                    }
                    const sorted = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
                    return sorted.length > 0 ? sorted[0][0] : '—';
                  })()}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{(() => {
                const routeCounts: Record<string, number> = {};
                for (const j of journeys) {
                  const rn = jRouteNumber(j);
                  if (rn && rn !== '—') routeCounts[rn] = (routeCounts[rn] ?? 0) + 1;
                }
                const sorted = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
                return sorted.length > 0 ? `${sorted[0][1]} journey${sorted[0][1] > 1 ? 's' : ''} on this route` : 'No data';
              })()}</p>
            </CardContent>
          </Card>

          {/* Favorite Travel Time */}
          <Card className="card-lift hover:scale-[1.02] transition-all duration-300">
            <CardContent className="py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
                  <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Favorite Travel Time</p>
                  <p className="text-lg font-bold">{(() => {
                    const hourCounts: Record<number, number> = {};
                    for (const j of journeys) {
                      const t = j.schedule?.departureTime;
                      if (!t) continue;
                      const h = parseInt(t.split(':')[0], 10);
                      if (!isNaN(h)) hourCounts[h] = (hourCounts[h] ?? 0) + 1;
                    }
                    const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
                    if (sorted.length === 0) return '—';
                    const hour = Number(sorted[0][0]);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    return `${h12}:00 ${ampm}`;
                  })()}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{(() => {
                const hourCounts: Record<number, number> = {};
                for (const j of journeys) {
                  const t = j.schedule?.departureTime;
                  if (!t) continue;
                  const h = parseInt(t.split(':')[0], 10);
                  if (!isNaN(h)) hourCounts[h] = (hourCounts[h] ?? 0) + 1;
                }
                const sorted = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
                return sorted.length > 0 ? `${sorted[0][1]} trips at this hour` : 'No data';
              })()}</p>
            </CardContent>
          </Card>

          {/* Monthly Spending Trend */}
          <Card className="card-lift hover:scale-[1.02] transition-all duration-300">
            <CardContent className="py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                  <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Spending</p>
                  <p className="text-sm font-bold">Last 6 Months Trend</p>
                </div>
              </div>
              <MonthlySpendingChart journeys={journeys} />
            </CardContent>
          </Card>
        </div>
      )}

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
                const isExpanded = expandedJourneyId === j.id;
                return (
                  <Card key={j.id} className={`transition-all ${isExpanded ? 'ring-2 ring-primary/20 shadow-lg' : isRated ? 'opacity-80' : ''}`}>
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
                            {isRated && (
                              <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                                <Star className="size-3 fill-amber-400 text-amber-400 mr-1" />
                                {j.rating}
                              </Badge>
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
                          {/* Existing rating compact */}
                          {isRated && !isExpanded && (
                            <div className="space-y-1">
                              <StarRating rating={j.rating!} />
                              {j.feedback && (
                                <p className="text-xs text-muted-foreground italic line-clamp-1">&quot;{j.feedback}&quot;</p>
                              )}
                            </div>
                          )}

                          {/* Expand / Collapse button */}
                          <Button
                            variant={isRated ? 'ghost' : 'default'}
                            size="sm"
                            className="w-full"
                            onClick={() => setExpandedJourneyId(isExpanded ? null : j.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="size-3 mr-1" />
                                Close
                              </>
                            ) : isRated ? (
                              <>
                                <Star className="size-3 mr-1" />
                                View Review
                              </>
                            ) : (
                              <>
                                <Star className="size-3 mr-1" />
                                Rate &amp; Review
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Enhanced Rating Panel (expanded) */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4">
                          {isRated ? (
                            /* Display existing ratings */
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                <span className="text-sm font-semibold">Your Review</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StarRating rating={j.rating!} />
                                <span className="text-sm font-bold text-amber-600">{j.rating}.0 / 5</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {RATING_CATEGORIES.map(cat => (
                                  <div key={cat.key} className="flex items-center gap-2 rounded-lg bg-background px-3 py-2">
                                    <cat.icon className="size-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{cat.label}</span>
                                    <span className="ml-auto text-xs font-bold">
                                      {categoryRatings[j.id]?.[cat.key] ?? Math.round((j.rating ?? 3) + (Math.random() * 2 - 1))}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {j.feedback && (
                                <p className="text-sm italic text-muted-foreground rounded-lg bg-background p-3">&quot;{j.feedback}&quot;</p>
                              )}
                            </div>
                          ) : (
                            /* Rating form */
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Star className="size-4 text-amber-500" />
                                <span className="text-sm font-semibold">Rate this journey</span>
                              </div>

                              {/* Overall star rating */}
                              <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Overall Rating</label>
                                <div className="flex items-center gap-3">
                                  <StarRating
                                    rating={ratings[j.id] ?? 0}
                                    onChange={r => setRatings(prev => ({ ...prev, [j.id]: r }))}
                                  />
                                  {ratings[j.id] && ratings[j.id] > 0 && (
                                    <span className="text-sm font-bold text-amber-600">{ratings[j.id]}.0</span>
                                  )}
                                </div>
                              </div>

                              {/* Category sliders */}
                              <div className="space-y-3">
                                <label className="text-xs font-medium text-muted-foreground">Rate by Category</label>
                                {RATING_CATEGORIES.map(cat => {
                                  const val = categoryRatings[j.id]?.[cat.key] ?? 0;
                                  return (
                                    <div key={cat.key} className="flex items-center gap-3">
                                      <cat.icon className="size-4 text-muted-foreground shrink-0" />
                                      <span className="text-xs text-muted-foreground w-24 shrink-0">{cat.label}</span>
                                      <div className="flex-1 flex items-center gap-2">
                                        <input
                                          type="range"
                                          min="0"
                                          max="5"
                                          step="1"
                                          value={val}
                                          onChange={e => {
                                            const numVal = Number(e.target.value);
                                            setCategoryRatings(prev => ({
                                              ...prev,
                                              [j.id]: { ...prev[j.id], [cat.key]: numVal } as CategoryRatings,
                                            }));
                                          }}
                                          className="h-2 flex-1 cursor-pointer accent-amber-500"
                                        />
                                        <span className="text-xs font-bold tabular-nums w-4 text-right">{val}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Photo upload placeholder */}
                              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                                <div className="space-y-2">
                                  <Camera className="size-8 text-muted-foreground/50 mx-auto" />
                                  <p className="text-xs text-muted-foreground">Add photos to your review</p>
                                  <p className="text-[10px] text-muted-foreground/60">PNG, JPG up to 5MB</p>
                                </div>
                              </div>

                              {/* Review text */}
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="Share your detailed experience (optional)..."
                                  className="min-h-20 text-sm"
                                  maxLength={500}
                                  value={feedbacks[j.id] ?? ''}
                                  onChange={e =>
                                    setFeedbacks(prev => ({
                                      ...prev,
                                      [j.id]: e.target.value,
                                    }))
                                  }
                                />
                                <p className="text-[11px] text-right text-muted-foreground">
                                  {(feedbacks[j.id] ?? '').length} / 500
                                </p>
                              </div>

                              {/* Emoji reactions */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Quick Reaction</label>
                                <div className="flex items-center gap-2">
                                  {[
                                    { emoji: '👍', label: 'Great' },
                                    { emoji: '😐', label: 'Okay' },
                                    { emoji: '👎', label: 'Poor' },
                                  ].map(r => (
                                    <button
                                      key={r.label}
                                      type="button"
                                      className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-all hover:bg-muted/50 hover:border-primary/40 hover:scale-105 active:scale-95 dark:hover:bg-muted/30"
                                      onClick={() => {
                                        setFeedbacks(prev => ({
                                          ...prev,
                                          [j.id]: `${r.label}: ` + (prev[j.id] ?? '').replace(/^(Great|Okay|Poor):\\s*/, ''),
                                        }));
                                      }}
                                    >
                                      <span className="text-base">{r.emoji}</span>
                                      <span className="text-xs text-muted-foreground">{r.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Submit */}
                              <Button
                                size="sm"
                                className="w-full"
                                disabled={isSubmitting || !ratings[j.id]}
                                onClick={() => handleSubmitRating(j.id)}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="size-3 animate-spin mr-1" />
                                ) : (
                                  <Send className="size-3 mr-1" />
                                )}
                                Submit Review
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
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

// ─── Support Page (Complaints & Feedback) ─────────────────────────────────────

interface Complaint {
  id: string;
  category: string;
  severity: string;
  route?: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  submittedAt: string;
}

const COMPLAINT_CATEGORIES = ['Delay', 'Overcrowding', 'Cleanliness', 'Driver Behavior', 'Safety', 'Other'];
const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'];
const SEVERITY_COLORS: Record<string, string> = {
  Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  High: 'bg-red-100 text-red-700 border-red-200',
};
const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-sky-100 text-sky-700 border-sky-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const FAQ_ITEMS = [
  {
    q: 'How do I book a ticket?',
    a: 'Search for your route, select a schedule, and click Book Now. You\'ll receive a confirmation with ticket details and QR code.',
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes! Navigate to My Bookings and click Cancel on any booking made less than 30 minutes before departure.',
  },
  {
    q: 'How do loyalty points work?',
    a: 'Earn 10 points per trip. Weekly streak of 5+ trips earns 100 bonus points. Redeem for free rides, priority boarding, or discounts.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept UPI, Credit/Debit cards, Net Banking, and BusTrack Wallet. All transactions are secured with 256-bit encryption.',
  },
  {
    q: 'How do I contact support?',
    a: 'Email: support@bustrack.in | Phone: 1800-BUS-HELP | Available 24/7',
  },
];

function SupportPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintForm, setComplaintForm] = useState({
    category: '',
    severity: '',
    route: '',
    description: '',
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQ_ITEMS;
    const q = faqSearch.toLowerCase();
    return FAQ_ITEMS.filter(faq =>
      faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  const handleSubmitComplaint = useCallback(() => {
    if (!complaintForm.category || !complaintForm.severity || !complaintForm.description.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in category, severity, and description.',
        variant: 'destructive',
      });
      return;
    }
    setSubmittingComplaint(true);
    // Simulate submission
    setTimeout(() => {
      const newComplaint: Complaint = {
        id: `CMP-${String(Date.now()).slice(-6)}`,
        category: complaintForm.category,
        severity: complaintForm.severity,
        route: complaintForm.route || undefined,
        description: complaintForm.description.trim(),
        status: 'Open',
        submittedAt: new Date().toISOString(),
      };
      setComplaints(prev => [newComplaint, ...prev]);
      setComplaintForm({ category: '', severity: '', route: '', description: '' });
      setSubmittingComplaint(false);
      toast({
        title: 'Complaint Submitted!',
        description: `Your complaint ${newComplaint.id} has been registered. We'll respond within 24 hours.`,
      });
    }, 800);
  }, [complaintForm]);

  return (
    <div className="space-y-6">
      {/* FAQ Accordion - Above complaint form */}
      <Card className="transit-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="size-5 text-emerald-500" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search FAQ */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search questions and answers..."
              value={faqSearch}
              onChange={e => setFaqSearch(e.target.value)}
              className="pl-10 h-9"
            />
          </div>

          <div className="space-y-1">
            {filteredFaqs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <HelpCircle className="mx-auto mb-2 size-8 opacity-30" />
                <p className="text-sm">No matching questions found</p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <div key={i} className="rounded-lg border dark:border-muted-foreground/20 transition-colors hover:bg-muted/30 dark:hover:bg-muted/10">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <span className="pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                        expandedFaq === i ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === i && (
                    <div className="border-t bg-muted/30 dark:bg-muted/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Complaint */}
      <Card className="neon-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-5 text-amber-500" />
            Submit a Complaint
          </CardTitle>
          <CardDescription>Tell us about your experience — we&apos;re here to help</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category *</label>
              <Select
                value={complaintForm.category}
                onValueChange={v => setComplaintForm(p => ({ ...p, category: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Severity *</label>
              <div className="flex gap-2">
                {SEVERITY_OPTIONS.map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setComplaintForm(p => ({ ...p, severity: sev }))}
                    className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-all ${
                      complaintForm.severity === sev
                        ? SEVERITY_COLORS[sev]
                        : 'border-muted bg-muted/30 text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Route (optional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Route (optional)</label>
            <Input
              placeholder="e.g., Route 500, KA-01-4521"
              value={complaintForm.route}
              onChange={e => setComplaintForm(p => ({ ...p, route: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="Describe your issue in detail..."
              className="min-h-24"
              value={complaintForm.description}
              onChange={e => setComplaintForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Attachment placeholder */}
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
            <div className="space-y-2">
              <Upload className="size-8 text-muted-foreground/50 mx-auto" />
              <p className="text-xs text-muted-foreground">Attach screenshots or documents</p>
              <p className="text-[10px] text-muted-foreground/60">PNG, JPG, PDF up to 10MB</p>
            </div>
          </div>

          {/* Submit button */}
          <Button
            className="w-full"
            onClick={handleSubmitComplaint}
            disabled={submittingComplaint}
          >
            {submittingComplaint ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Send className="size-4 mr-2" />
            )}
            Submit Complaint
          </Button>
        </CardContent>
      </Card>

      {/* My Complaints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-sky-500" />
            My Complaints
            {complaints.length > 0 && (
              <Badge variant="secondary" className="ml-2">{complaints.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Track your submitted complaints</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-muted/50 p-4">
                <CheckCircle2 className="size-12 text-muted-foreground/30" />
              </div>
              <p className="font-medium text-muted-foreground">No complaints submitted</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                All clear! Submit one above if you have any concerns.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {complaints.map(c => (
                <div key={c.id} className="card-lift rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">{c.id}</Badge>
                        <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                          {c.category}
                        </Badge>
                        <Badge variant="outline" className={SEVERITY_COLORS[c.severity]}>
                          <AlertTriangle className="size-3 mr-1" />
                          {c.severity}
                        </Badge>
                        <Badge variant="outline" className={STATUS_COLORS[c.status]}>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                      {c.route && (
                        <p className="text-xs text-muted-foreground">Route: {c.route}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Us Card */}
      <Card className="neon-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-5 text-sky-500" />
            Contact Us
          </CardTitle>
          <CardDescription>We&apos;re here to help 24/7</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 dark:bg-muted/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50">
                <Mail className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">support@bustrack.in</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 dark:bg-muted/10 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <Phone className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">24/7 Helpline</p>
                <p className="text-sm font-medium">1800-BUS-HELP</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 dark:bg-muted/10 p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
                <MessageCircle className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Social Media</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <button className="rounded-full p-1.5 transition-colors hover:bg-muted dark:hover:bg-muted/50" title="Twitter">
                    <Twitter className="size-4 text-muted-foreground" />
                  </button>
                  <button className="rounded-full p-1.5 transition-colors hover:bg-muted dark:hover:bg-muted/50" title="Instagram">
                    <Instagram className="size-4 text-muted-foreground" />
                  </button>
                  <button className="rounded-full p-1.5 transition-colors hover:bg-muted dark:hover:bg-muted/50" title="Email">
                    <Mail className="size-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Us Form */}
      <ContactUsForm />
    </div>
  );
}

// ─── Contact Us Form ─────────────────────────────────────────────────────────

function ContactUsForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields before sending.',
        variant: 'destructive',
      });
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setFormData({ name: '', email: '', message: '' });
      toast({
        title: 'Message Sent!',
        description: `Thank you ${formData.name}! We'll get back to you at ${formData.email} within 24 hours.`,
      });
    }, 1000);
  }, [formData]);

  return (
    <Card className="glass overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="size-5 text-emerald-500" />
          Send Us a Message
        </CardTitle>
        <CardDescription>Have a question? We&apos;d love to hear from you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <UserPlus className="size-3.5 text-primary" /> Name
            </label>
            <Input
              placeholder="Your full name"
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Mail className="size-3.5 text-primary" /> Email
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <MessageCircle className="size-3.5 text-primary" /> Message
          </label>
          <Textarea
            placeholder="How can we help you?"
            className="min-h-[100px]"
            value={formData.message}
            onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
          />
        </div>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={sending}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Send className="size-4 mr-2" />
          )}
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CustomerContent({ portal, userId, token, setPortal }: Props) {
  // token is available if needed for authorized requests
  const _token = token;
  void _token;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {portal === 'dashboard' && 'Dashboard'}
          {portal === 'search' && 'Search Routes'}
          {portal === 'map' && 'Route Map'}
          {portal === 'bookings' && 'My Bookings'}
          {portal === 'history' && 'Journey History'}
          {portal === 'support' && 'Support'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {portal === 'dashboard' && 'Welcome back! Here is your travel overview.'}
          {portal === 'search' && 'Find and book available bus routes.'}
          {portal === 'map' && 'Explore routes on an interactive map.'}
          {portal === 'bookings' && 'View and manage your planned trips.'}
          {portal === 'history' && 'Review your completed journeys and rate them.'}
          {portal === 'support' && 'Get help, submit complaints, and find answers.'}
        </p>
      </div>

      {/* Content */}
      {portal === 'dashboard' && <Dashboard userId={userId} setPortal={setPortal} />}
      {portal === 'search' && <SearchRoutes userId={userId} />}
      {portal === 'map' && <RouteMapView />}
      {portal === 'bookings' && <MyBookings userId={userId} />}
      {portal === 'history' && <JourneyHistory userId={userId} />}
      {portal === 'support' && <SupportPage />}
    </div>
  );
}
