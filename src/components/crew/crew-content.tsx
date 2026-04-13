'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Switch } from '@/components/ui/switch';
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  Bus,
  User,
  MapPin,
  TrendingUp,
  AlertCircle,
  Send,
  Edit3,
  Save,
  Power,
  Shield,
  Briefcase,
  FileText,
  Timer,
  Play,
  Square,
  DollarSign,
  Award,
  X,
  Pause,
  RotateCcw,
  Users,
  Navigation,
  MessageSquare,
  Flame,
  Zap,
  Fuel,
  CircleDot,
  Plus,
  Minus,
  Cloud,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  Trophy,
  Sun as SunIcon,
  Gauge,
  ArrowUp,
  ArrowDown,
  Coffee,
  AlertTriangle,
  Download,
  Trash2,
  IndianRupee,
  ArrowUpDown,
  Hourglass,
  Thermometer,
  TreePalm,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Heart,
  Snowflake,
  LogOut,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ──────────────────────────── Types ────────────────────────────

interface Props {
  portal: string;
  userId: string;
  token: string;
}

interface CrewProfileData {
  id: string;
  profileId: string;
  specialization: string;
  licenseNo: string;
  experienceYears: number;
  performanceRating: number;
  availability: string;
  maxDailyHours: number;
  busNumber: string;
  profile: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AssignmentData {
  id: string;
  scheduleId: string;
  crewId: string;
  status: string;
  assignedAt: string;
  completedAt: string | null;
  schedule: {
    id: string;
    routeId: string;
    date: string;
    departureTime: string;
    status: string;
    route: {
      id: string;
      routeNumber: string;
      startLocation: string;
      endLocation: string;
      distanceKm?: number;
      fare?: number;
      busRegistration?: string;
    };
  };
}

interface HolidayRequestData {
  id: string;
  crewId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  crew?: { id: string; name: string; email: string };
}

// ──────────────────────────── Helpers ────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

function isFuture(dateStr: string): boolean {
  return dateStr >= getTodayStr();
}

function isFutureDate(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(getTodayStr() + 'T00:00:00');
  return d > today;
}

function isTomorrow(dateStr: string): boolean {
  const today = new Date(getTodayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return target.getTime() === tomorrow.getTime();
}

function isThisWeek(dateStr: string): boolean {
  const today = new Date(getTodayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  return target > today && target <= endOfWeek;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'declined':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'scheduled':
      return 'bg-slate-100 text-slate-800 border-slate-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
  }
}

function getAvailabilityColor(status: string): string {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'on_leave':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'unavailable':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600';
  }
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getSpecializationColor(spec: string): string {
  switch (spec) {
    case 'driver':
      return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'conductor':
      return 'bg-violet-100 text-violet-700 border-violet-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600';
  }
}

// Deterministic hash for seed-based hours
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getWeeklyHours(name: string): number[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((_, i) => {
    const seed = simpleHash(name + days[i]);
    return 6 + (seed % 5); // 6-10 hours
  });
}

function getBarColor(hours: number): string {
  if (hours <= 8) return 'bg-emerald-500';
  if (hours <= 9) return 'bg-amber-500';
  return 'bg-red-500';
}

// ──────────────────────────── Daily Summary Report ────────────────────────────

function DailySummaryReport({ crewName }: { crewName: string }) {
  const today = getTodayStr();

  // Deterministic values from crewName + today
  const tripsCompleted = 3 + getSeededValue(crewName + 'trips' + today, 0, 3);
  const totalKm = 120 + getSeededValue(crewName + 'km' + today, 0, 160);
  const totalPassengers = 150 + getSeededValue(crewName + 'pax' + today, 0, 250);
  const fuelConsumed = 25 + getSeededValue(crewName + 'fuel' + today, 0, 25);
  const earnings = 800 + getSeededValue(crewName + 'earn' + today, 0, 1700);

  const handleDownloadReport = () => {
    const report = [
      `═══════════════════════════════════════════`,
      `       DAILY SUMMARY REPORT`,
      `       BusTrack Pro - Crew Module`,
      `═══════════════════════════════════════════`,
      ``,
      `  Date:        ${formatDate(today)}`,
      `  Crew:        ${crewName}`,
      ``,
      `───────────────────────────────────────────`,
      `  METRICS`,
      `───────────────────────────────────────────`,
      ``,
      `  Trips Completed:    ${tripsCompleted}`,
      `  Total Km Driven:    ${totalKm} km`,
      `  Total Passengers:   ${totalPassengers}`,
      `  Fuel Consumed:      ${fuelConsumed} L`,
      `  Earnings:           ₹${earnings.toLocaleString('en-IN')}`,
      ``,
      `───────────────────────────────────────────`,
      `  Generated at: ${new Date().toLocaleString()}`,
      `═══════════════════════════════════════════`,
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${today}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: `Daily report for ${formatDate(today)} saved.` });
  };

  const stats = [
    { label: 'Trips Completed', value: tripsCompleted, unit: '', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
    { label: 'Total Km Driven', value: totalKm, unit: 'km', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30', border: 'border-sky-100 dark:border-sky-800' },
    { label: 'Total Passengers', value: totalPassengers, unit: '', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30', border: 'border-violet-100 dark:border-violet-800' },
    { label: 'Fuel Consumed', value: fuelConsumed, unit: 'L', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
    { label: 'Earnings', value: `₹${earnings.toLocaleString('en-IN')}`, unit: '', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-100 dark:border-rose-800' },
  ];

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-900/40 dark:to-amber-900/40">
              <Download className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <CardTitle className="text-base">Daily Summary Report</CardTitle>
              <CardDescription className="text-xs">Today&apos;s performance at a glance</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 h-8 text-xs"
            onClick={handleDownloadReport}
          >
            <Download className="h-3.5 w-3.5" />
            Download Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg border p-3 text-center ${stat.bg} ${stat.border}`}
            >
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── Shift Handover Notes ────────────────────────────

function ShiftHandoverNotes({ crewName }: { crewName: string }) {
  const storageKey = `bt_handover_notes_${crewName}`;
  const [note, setNote] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.note || '';
      }
    } catch {
      // ignore parse errors
    }
    return '';
  });
  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.timestamp || null;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [saving, setSaving] = useState(false);

  const MAX_CHARS = 1000;

  const handleSave = () => {
    if (!note.trim()) {
      toast({ title: 'Cannot save empty note', description: 'Please write something before saving.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const timestamp = new Date().toLocaleString();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ note, timestamp }));
      setLastSaved(timestamp);
      toast({ title: 'Note saved!', description: `Handover note saved at ${timestamp}` });
    } catch {
      toast({ title: 'Save failed', description: 'Could not save to local storage.', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleClear = () => {
    setNote('');
    setLastSaved(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    toast({ title: 'Note cleared', description: 'Handover note has been removed.' });
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-violet-100 dark:from-sky-900/40 dark:to-violet-900/40">
            <Edit3 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <CardTitle className="text-base">Shift Handover Notes</CardTitle>
            <CardDescription className="text-xs">Write notes for the next shift crew</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Write your handover notes here... e.g., Bus KA-01-F1234 needs oil check, Route R215 has road work near Silk Board..."
            className="min-h-[100px] resize-y text-sm"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-xs ${note.length > MAX_CHARS * 0.9 ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                {note.length}/{MAX_CHARS} characters
              </span>
              {lastSaved && (
                <span className="text-[10px] text-muted-foreground">
                  Last saved: {lastSaved}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
              <Button
                size="sm"
                className="gap-1.5 h-8 text-xs bg-sky-600 text-white hover:bg-sky-700"
                onClick={handleSave}
                disabled={saving || !note.trim()}
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Seed-based Data Helpers ────────────────────────────

function getSeededValue(seed: string, min: number, max: number): number {
  const h = simpleHash(seed);
  return min + (h % (max - min + 1));
}

function getMonthlyEarnings(name: string): { month: string; amount: number }[] {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  return months.map((m, i) => ({
    month: m,
    amount: 18000 + getSeededValue(name + m, 2000, 12000),
  }));
}

function getStopsForRoute(seed: string): { name: string; isCurrent: boolean; passed: boolean }[] {
  const allStops = [
    'Majestic Bus Stand', 'Indiranagar', 'Koramangala', 'HSR Layout',
    'Silk Board', 'Electronic City', 'Hebbal', 'Whitefield',
    'Marathahalli', 'KR Puram',
  ];
  const count = 5 + (simpleHash(seed) % 4); // 5-8 stops
  const currentIdx = 2 + (simpleHash(seed + 'curr') % (count - 3)); // 2 to count-2
  return allStops.slice(0, count).map((name, i) => ({
    name,
    isCurrent: i === currentIdx,
    passed: i < currentIdx,
  }));
}

function getTripPerformanceData(seed: string): { route: string; scheduled: string; actual: string; status: 'early' | 'ontime' | 'late' }[] {
  const routes = ['R201', 'R315', 'R402', 'R128', 'R507'];
  const statuses: ('early' | 'ontime' | 'late')[] = ['early', 'ontime', 'ontime', 'late', 'ontime'];
  return routes.map((r, i) => {
    const h = getSeededValue(seed + r, 0, 10);
    const minOff = h <= 2 ? -(5 + h) : h <= 8 ? 0 : h - 2;
    const scheduled = `${8 + i}:${String(15 + i * 7).padStart(2, '0')} ${i < 3 ? 'AM' : 'PM'}`;
    const parts = scheduled.split(':');
    let hr = parseInt(parts[0]);
    let mn = parseInt(parts[1].split(' ')[0]);
    const period = parts[1].split(' ')[1];
    mn += minOff;
    if (mn < 0) { mn += 60; hr -= 1; }
    if (mn >= 60) { mn -= 60; hr += 1; }
    const actual = `${hr}:${String(mn).padStart(2, '0')} ${period}`;
    const status = minOff < -2 ? 'early' : minOff > 3 ? 'late' : 'ontime';
    return { route: r, scheduled, actual, status };
  });
}

function getWeeklyOnTimeData(seed: string): { day: string; onTime: number; total: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((d) => {
    const total = 4 + (simpleHash(seed + d) % 5);
    const onTime = 2 + (simpleHash(seed + d + 'ot') % (total - 1));
    return { day: d, onTime, total };
  });
}

// ──────────────────────────── Assignment Performance Helper ────────────────────────────

function AssignmentPerformanceBadge({ assignmentId }: { assignmentId: string }) {
  const onTimeRate = 75 + getSeededValue(assignmentId + 'otr', 0, 24);
  const tripsThisWeek = 8 + getSeededValue(assignmentId + 'ttw', 0, 7);
  const perfColor = onTimeRate >= 90 ? 'emerald' : onTimeRate >= 75 ? 'amber' : 'red';
  const barColor = onTimeRate >= 90 ? 'bg-emerald-500' : onTimeRate >= 75 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = onTimeRate >= 90 ? 'text-emerald-600' : onTimeRate >= 75 ? 'text-amber-600' : 'text-red-600';
  const barBg = onTimeRate >= 90 ? 'bg-emerald-100 dark:bg-emerald-900/50' : onTimeRate >= 75 ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-red-100 dark:bg-red-900/50';

  return (
    <div className="mt-2 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[10px] text-gray-400 shrink-0">On Time:</span>
        <div className={`h-1.5 w-16 ${barBg} rounded-full overflow-hidden`}>
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${onTimeRate}%` }} />
        </div>
        <span className={`text-[10px] font-bold ${textColor}`}>{onTimeRate}%</span>
      </div>
      <div className="flex items-center gap-1">
        <Navigation className="h-3 w-3 text-gray-400" />
        <span className="text-[10px] text-gray-500 font-medium">{tripsThisWeek} trips this week</span>
      </div>
    </div>
  );
}

// ──────────────────────────── End-of-Shift Summary ────────────────────────────

function EndOfShiftSummary({ crewName }: { crewName: string }) {
  const totalTrips = 6 + getSeededValue(crewName + 'eodt' + getTodayStr(), 0, 8);
  const totalHours = 7 + getSeededValue(crewName + 'eodh' + getTodayStr(), 0, 3) + getSeededValue(crewName + 'eodh2', 0, 60) / 60;
  const totalDistance = 120 + getSeededValue(crewName + 'eodd' + getTodayStr(), 0, 180);
  const perfScore = 3 + getSeededValue(crewName + 'eods' + getTodayStr(), 0, 2);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReport = () => {
    setSubmitted(true);
    toast({ title: 'Daily report submitted successfully!', description: `Report for ${formatDate(getTodayStr())} has been recorded.` });
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-amber-100">
            <FileText className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">End of Day Summary</CardTitle>
            <CardDescription className="text-xs">Daily shift report</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 p-3 text-center">
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totalTrips}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Trips Done</p>
          </div>
          <div className="rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 p-3 text-center">
            <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{totalHours.toFixed(1)}h</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Hours Worked</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 p-3 text-center">
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{totalDistance} km</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Distance</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Performance:</span>
            <StarRating rating={perfScore} size={16} />
          </div>
          {submitted ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Submitted
            </Badge>
          ) : (
            <Button size="sm" className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700 h-8 px-4 text-xs" onClick={handleSubmitReport}>
              <Send className="h-3.5 w-3.5" />
              Submit Report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── Certification Badges ────────────────────────────

function CertificationBadges({ crewName }: { crewName: string }) {
  const certifications = [
    { name: 'Heavy Vehicle License', icon: GraduationCap, expiry: `Dec ${2025 + (simpleHash(crewName + 'cert1') % 3)}`, active: simpleHash(crewName + 'cert1') % 5 !== 0, gradient: 'from-emerald-500 to-teal-600', bgLight: 'from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30', border: 'border-emerald-200 dark:border-emerald-800' },
    { name: 'Defensive Driving', icon: Shield, expiry: `Mar ${2026 + (simpleHash(crewName + 'cert2') % 2)}`, active: simpleHash(crewName + 'cert2') % 6 !== 0, gradient: 'from-amber-500 to-orange-600', bgLight: 'from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30', border: 'border-amber-200 dark:border-amber-800' },
    { name: 'First Aid Certified', icon: Heart, expiry: `Jun ${2025 + (simpleHash(crewName + 'cert3') % 3)}`, active: simpleHash(crewName + 'cert3') % 4 !== 0, gradient: 'from-rose-500 to-pink-600', bgLight: 'from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30', border: 'border-rose-200 dark:border-rose-800' },
    { name: 'AC Bus Certified', icon: Snowflake, expiry: `Sep ${2026 + (simpleHash(crewName + 'cert4') % 2)}`, active: simpleHash(crewName + 'cert4') % 7 !== 0, gradient: 'from-sky-500 to-blue-600', bgLight: 'from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30', border: 'border-sky-200 dark:border-sky-800' },
  ];

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Certifications
        </CardTitle>
        <CardDescription>Professional certifications and licenses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {certifications.map((cert) => {
            const Icon = cert.icon;
            return (
              <div key={cert.name} className={`rounded-xl border p-4 bg-gradient-to-br ${cert.bgLight} ${cert.border} transition-all hover:shadow-sm`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cert.gradient} shadow-sm`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{cert.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Expires: {cert.expiry}</p>
                    <Badge className={`mt-1.5 text-[10px] ${cert.active ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'}`}>
                      {cert.active ? <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> : <XCircle className="mr-0.5 h-2.5 w-2.5" />}
                      {cert.active ? 'Active' : 'Expired'}
                    </Badge>
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

// ──────────────────────────── New Feature: Digital Trip Manifest ────────────────────────────

function DigitalTripManifest({ crewName, assignments }: { crewName: string; assignments: AssignmentData[] }) {
  const todayStr = getTodayStr();
  const todayAsgn = assignments.filter((a) => a.schedule.date === todayStr);
  const trip = todayAsgn.length > 0 ? todayAsgn[0] : null;

  const [tripStatus, setTripStatus] = useState<'idle' | 'started' | 'completed'>('idle');
  const [tripElapsed, setTripElapsed] = useState(0);
  const tripIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [animatedStops, setAnimatedStops] = useState(0);

  const routeNumber = trip?.schedule.route?.routeNumber || `R${100 + getSeededValue(crewName, 1, 400)}`;
  const departureTime = trip?.schedule.departureTime || `${8 + (getSeededValue(crewName + 'dep', 0, 2))}:${String(getSeededValue(crewName + 'dep2', 0, 59)).padStart(2, '0')}`;
  const busReg = trip?.schedule.route?.busRegistration || `KA-${String(getSeededValue(crewName + 'bus', 1, 99)).padStart(2, '0')}-F-${String(getSeededValue(crewName + 'bus2', 1000, 9999))}`;
  const totalPassengers = 30 + getSeededValue(crewName + 'pax', 0, 25);
  const busCapacity = 55;
  const occupancyPct = Math.round((totalPassengers / busCapacity) * 100);
  const stops = getStopsForRoute(crewName + routeNumber);
  const currentStop = stops.find((s) => s.isCurrent);
  const nextStop = stops.find((s) => !s.passed && !s.isCurrent);
  const progressPct = tripStatus === 'completed' ? 100 : stops.length > 1 ? Math.round((stops.filter((s) => s.passed).length / (stops.length - 1)) * 100) : 0;

  // Sequential fill animation on mount
  useEffect(() => {
    if (stops.length === 0) return;
    const timer = setTimeout(() => setAnimatedStops(1), 200);
    return () => clearTimeout(timer);
  }, [stops.length]);

  useEffect(() => {
    if (animatedStops > 0 && animatedStops < stops.length) {
      const timer = setTimeout(() => setAnimatedStops((p) => p + 1), 150);
      return () => clearTimeout(timer);
    }
  }, [animatedStops, stops.length]);

  // Trip elapsed timer
  useEffect(() => {
    if (tripStatus === 'started') {
      tripIntervalRef.current = setInterval(() => setTripElapsed((p) => p + 1), 1000);
    }
    return () => { if (tripIntervalRef.current) clearInterval(tripIntervalRef.current); };
  }, [tripStatus]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleStartTrip = () => {
    setTripStatus('started');
    setTripElapsed(0);
    toast({ title: 'Trip started!', description: 'Safe travels! 🚌' });
  };

  const handleCompleteTrip = () => {
    setTripStatus('completed');
    if (tripIntervalRef.current) clearInterval(tripIntervalRef.current);
    toast({ title: 'Trip completed!', description: 'Great job! 🎉' });
  };

  const isDotFilled = (i: number) => {
    if (tripStatus === 'completed') return true;
    if (tripStatus === 'started' && i === 0) return true;
    return stops[i]?.passed && i < animatedStops;
  };

  return (
    <Card className="card-shine-sweep rounded-xl shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-white/80" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Digital Trip Manifest</span>
          </div>
          <div className="flex items-center gap-2">
            {tripStatus !== 'idle' && (
              <span className="text-[10px] text-white/70 bg-white/15 rounded-full px-2 py-0.5 font-mono">{formatElapsed(tripElapsed)}</span>
            )}
            <span className="text-xs text-white/70">{formatDate(todayStr)}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-0">
        {/* Route & Time Row */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Route Number</p>
            <p className="text-lg font-bold text-emerald-700">{routeNumber}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Departure</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{departureTime}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Bus Reg</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{busReg}</p>
          </div>
        </div>

        {/* Passengers Progress Bar */}
        <div className="px-5 py-3 border-b border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Passengers</span>
            </div>
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{totalPassengers}/{busCapacity} <span className="text-gray-400 font-normal">({occupancyPct}%)</span></span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${occupancyPct > 85 ? 'bg-red-500' : occupancyPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>

        {/* Route Progress - Animated Dots */}
        <div className="px-5 py-3 border-b border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Route Progress</p>
          <div className="flex items-center gap-1 w-full overflow-hidden">
            {stops.map((stop, i) => (
              <React.Fragment key={stop.name}>
                <div className="flex flex-col items-center shrink-0" style={{ width: '14px' }}>
                  <div className={`h-3 w-3 rounded-full border-2 transition-all duration-500 ${
                    isDotFilled(i)
                      ? 'bg-emerald-500 border-emerald-300 shadow-sm shadow-emerald-200 scale-110 animate-check-bounce'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                  }`} style={{ animationDelay: `${i * 150}ms` }} />
                  <span className="mt-1 text-[8px] text-gray-400 leading-tight truncate max-w-[32px]">{stop.name.split(' ')[0]}</span>
                </div>
                {i < stops.length - 1 && (
                  <div className="flex-1 min-w-[8px]">
                    <div className="h-0.5 w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-emerald-400 transition-all duration-700 ease-out ${isDotFilled(i) ? 'w-full' : 'w-0'}`}
                        style={{ transitionDelay: `${i * 150}ms` }}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Navigation className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700">Current: {tripStatus === 'completed' ? 'All stops done' : (currentStop?.name || '—')}</span>
            </div>
            <span className="text-xs text-gray-400">{progressPct}% complete</span>
          </div>
        </div>

        {/* Next Stop + Trip Control */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <MapPin className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Next Stop</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tripStatus === 'completed' ? 'Trip finished' : (nextStop?.name || '—')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{tripStatus !== 'completed' ? `~${2 + (simpleHash(crewName + 'eta') % 6)} min` : ''}</span>
              {tripStatus === 'idle' && (
                <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3 text-xs" onClick={handleStartTrip}>
                  <Play className="h-3 w-3" /> Start Trip
                </Button>
              )}
              {tripStatus === 'started' && (
                <Button size="sm" className="gap-1 bg-teal-600 text-white hover:bg-teal-700 h-8 px-3 text-xs" onClick={handleCompleteTrip}>
                  <CheckCircle2 className="h-3 w-3" /> Complete Trip
                </Button>
              )}
              {tripStatus === 'completed' && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Shift Timer ────────────────────────────

function ShiftTimer() {
  const [shiftState, setShiftState] = useState<'idle' | 'running' | 'paused'>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalShiftHours = 8;
  const totalShiftSeconds = totalShiftHours * 3600;

  useEffect(() => {
    if (shiftState === 'running') {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [shiftState]);

  const handleStart = () => {
    if (shiftState === 'idle') {
      setElapsedSeconds(0);
    }
    setShiftState('running');
    toast({ title: 'Shift Started', description: 'Your shift timer is now running.' });
  };

  const handlePause = () => {
    setShiftState('paused');
    toast({ title: 'Shift Paused', description: 'Timer paused. Resume when ready.' });
  };

  const handleEnd = () => {
    setShiftState('idle');
    setElapsedSeconds(0);
    toast({ title: 'Shift Ended', description: `Total time: ${formatShiftTime(elapsedSeconds)}` });
  };

  const formatShiftTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const progressPct = Math.min((elapsedSeconds / totalShiftSeconds) * 100, 100);
  const color = elapsedSeconds < 6 * 3600 ? 'emerald' : elapsedSeconds < 8 * 3600 ? 'amber' : 'red';
  const strokeColor = color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : '#ef4444';
  const bgColor = color === 'emerald' ? '#d1fae5' : color === 'amber' ? '#fef3c7' : '#fee2e2';

  const radius = 58;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progressPct / 100) * circumference;

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5 text-gray-500" />
          Shift Timer
        </CardTitle>
        <div className="section-accent-line" />
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col items-center gap-4 ${shiftState === 'running' ? 'ring-2 ring-emerald-500/30 animate-pulse rounded-xl p-3 -m-3' : ''}`}>
          {/* Circular Progress */}
          <div className="relative">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10" stroke={bgColor} />
              <circle
                cx="70" cy="70" r={radius} fill="none" strokeWidth="10"
                strokeLinecap="round" stroke={strokeColor}
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">{formatShiftTime(elapsedSeconds)}</span>
              <span className="text-[10px] text-gray-400">/ {totalShiftHours}h shift</span>
            </div>
          </div>

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : color === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
          }`}>
            {shiftState === 'running' && <Zap className="h-3 w-3" />}
            {shiftState === 'paused' && <Pause className="h-3 w-3" />}
            {shiftState === 'idle' && <CircleDot className="h-3 w-3" />}
            {shiftState === 'running' ? 'Active' : shiftState === 'paused' ? 'Paused' : 'Not Started'}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            {shiftState !== 'running' && (
              <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700 h-9 px-4" onClick={handleStart}>
                <Play className="h-3.5 w-3.5" />
                {shiftState === 'paused' ? 'Resume' : 'Start'}
              </Button>
            )}
            {shiftState === 'running' && (
              <Button size="sm" variant="outline" className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 h-9 px-4" onClick={handlePause}>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            )}
            {shiftState === 'running' && (
              <Button size="sm" variant="outline" className="gap-1 border-amber-400 text-amber-600 bg-amber-50 hover:bg-amber-100 h-9 px-4" onClick={() => {
                toast({ title: 'Break started', description: 'Break started. 15-minute timer active.' });
              }}>
                <Coffee className="h-3.5 w-3.5" />
                Break
              </Button>
            )}
            {shiftState !== 'idle' && (
              <Button size="sm" variant="outline" className="gap-1 border-red-300 text-red-600 hover:bg-red-50 h-9 px-4" onClick={handleEnd}>
                <Square className="h-3.5 w-3.5" />
                End
              </Button>
            )}
            {shiftState === 'idle' && elapsedSeconds === 0 && (
              <Button size="sm" variant="outline" className="gap-1 border-gray-300 text-gray-500 h-9 px-4" disabled>
                <Square className="h-3.5 w-3.5" />
                End
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Break Management Timer ────────────────────────────

function BreakTimer() {
  const [breakState, setBreakState] = useState<'idle' | 'on_break' | 'ended'>('idle');
  const [breakType, setBreakType] = useState<'tea' | 'lunch'>('tea');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const breakDurations = { tea: 15 * 60, lunch: 30 * 60 };

  useEffect(() => {
    if (breakState === 'on_break') {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Clear interval immediately to prevent double-increment on next tick
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setBreakState('ended');
            setBreaksTaken((b) => b + 1);
            toast({ title: 'Break Over!', description: 'Break over! Time to get back to work.' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [breakState]);

  const handleStart = (type: 'tea' | 'lunch') => {
    setBreakType(type);
    setRemainingSeconds(breakDurations[type]);
    setBreakState('on_break');
    toast({ title: `${type === 'tea' ? 'Tea' : 'Lunch'} Break Started`, description: `Your ${type === 'tea' ? '15' : '30'}-minute break has begun.` });
  };

  const handleEndEarly = () => {
    setBreakState('ended');
    setBreaksTaken((b) => b + 1);
    toast({ title: 'Break Ended', description: 'Break ended early. Back to work!' });
  };

  const handleReset = () => {
    setBreakState('idle');
    setRemainingSeconds(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const totalSeconds = breakDurations[breakType];
  const progressPct = totalSeconds > 0 ? Math.max((remainingSeconds / totalSeconds) * 100, 0) : 0;
  const size = 80;
  const center = size / 2;
  const radius = 32;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progressPct / 100) * circumference;

  const strokeColor = breakState === 'ended' ? '#ef4444'
    : breakState === 'on_break' ? '#10b981'
    : breakType === 'tea' ? '#f59e0b' : '#0ea5e9';
  const bgColor = breakState === 'ended' ? '#fee2e2'
    : breakState === 'on_break' ? '#d1fae5'
    : breakType === 'tea' ? '#fef3c7' : '#e0f2fe';

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Coffee className="h-5 w-5 text-gray-500" />
            Break Timer
          </CardTitle>
          <span className="text-xs text-gray-400">Breaks today: {breaksTaken}/3</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3">
          {breakState === 'idle' ? (
            <>
              <p className="text-sm text-gray-500">Choose your break type</p>
              <div className="flex gap-2 w-full">
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 bg-amber-500 text-white hover:bg-amber-600 h-9"
                  onClick={() => handleStart('tea')}
                  disabled={breaksTaken >= 3}
                >
                  <Coffee className="h-3.5 w-3.5" />
                  Tea (15m)
                </Button>
                <Button
                  size="sm"
                  className="flex-1 gap-1.5 bg-sky-500 text-white hover:bg-sky-600 h-9"
                  onClick={() => handleStart('lunch')}
                  disabled={breaksTaken >= 3}
                >
                  <Timer className="h-3.5 w-3.5" />
                  Lunch (30m)
                </Button>
              </div>
              {breaksTaken >= 3 && (
                <p className="text-xs text-red-500 font-medium">Max breaks reached for today</p>
              )}
            </>
          ) : (
            <>
              <div className="relative">
                <svg width={size} height={size} className="-rotate-90">
                  <circle cx={center} cy={center} r={radius} fill="none" strokeWidth="6" stroke={bgColor} />
                  <circle
                    cx={center} cy={center} r={radius} fill="none" strokeWidth="6"
                    strokeLinecap="round" stroke={strokeColor}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono tabular-nums">{formatTime(remainingSeconds)}</span>
                  <span className="text-[8px] text-gray-400 uppercase">
                    {breakType === 'tea' ? 'Tea' : 'Lunch'}
                  </span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                breakState === 'on_break' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {breakState === 'on_break' ? (
                  <><Zap className="h-3 w-3" /> On Break</>
                ) : (
                  <><AlertCircle className="h-3 w-3" /> Break Over</>
                )}
              </div>
              <div className="flex gap-2">
                {breakState === 'on_break' && (
                  <Button size="sm" variant="outline" className="gap-1 border-red-300 text-red-600 hover:bg-red-50 h-8 px-3" onClick={handleEndEarly}>
                    <Square className="h-3 w-3" />
                    End Early
                  </Button>
                )}
                {breakState === 'ended' && (
                  <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3" onClick={handleReset}>
                    <Play className="h-3 w-3" />
                    New Break
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Route Performance ────────────────────────────

function RoutePerformance({ crewName }: { crewName: string }) {
  const trips = useMemo(() => getTripPerformanceData(crewName), [crewName]);
  const weeklyData = useMemo(() => getWeeklyOnTimeData(crewName), [crewName]);

  const statusBadge = (status: string) => {
    if (status === 'early') return <Badge className="bg-sky-100 text-sky-700 border-sky-200 text-[10px]">Early</Badge>;
    if (status === 'late') return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Late</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">On Time</Badge>;
  };

  const maxTotal = Math.max(...weeklyData.map((d) => d.total));

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          Route Performance
        </CardTitle>
        <CardDescription>Recent trip punctuality and weekly on-time rate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Recent Trips Table */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Trips</p>
            <div className="space-y-2">
              {trips.map((t) => (
                <div key={t.route} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t.route}</p>
                    <p className="text-[10px] text-gray-400">{t.scheduled} → {t.actual}</p>
                  </div>
                  {statusBadge(t.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Weekly On-Time Bar Chart */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Weekly On-Time Rate</p>
            <div className="flex items-end gap-2 h-32">
              {weeklyData.map((d) => {
                const rate = d.total > 0 ? (d.onTime / d.total) * 100 : 0;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-gray-400">{Math.round(rate)}%</span>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-md relative" style={{ height: '80px' }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all ${
                          rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ height: `${Math.max(rate, d.total > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Pre-Trip Checklist ────────────────────────────

function PreTripChecklist({ crewName }: { crewName: string }) {
  const initialItems = [
    { id: 'vinsp', label: 'Vehicle inspection', icon: Shield, defaultChecked: getSeededValue(crewName + 'chk1', 0, 1) === 1 },
    { id: 'fuel', label: 'Fuel level check', icon: Fuel, defaultChecked: getSeededValue(crewName + 'chk2', 0, 1) === 1 },
    { id: 'tire', label: 'Tire condition', icon: CircleDot, defaultChecked: getSeededValue(crewName + 'chk3', 0, 1) === 1 },
    { id: 'lights', label: 'Lights & signals', icon: Zap, defaultChecked: getSeededValue(crewName + 'chk4', 0, 1) === 1 },
    { id: 'firstaid', label: 'First aid kit', icon: Award, defaultChecked: getSeededValue(crewName + 'chk5', 0, 1) === 1 },
    { id: 'fireext', label: 'Fire extinguisher', icon: Flame, defaultChecked: getSeededValue(crewName + 'chk6', 0, 1) === 1 },
    { id: 'tktmach', label: 'Ticket machine', icon: FileText, defaultChecked: getSeededValue(crewName + 'chk7', 0, 1) === 1 },
  ];

  const [items, setItems] = useState(initialItems);
  const [justToggled, setJustToggled] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setJustToggled(id);
    setTimeout(() => setJustToggled(null), 400);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, defaultChecked: !item.defaultChecked } : item
      )
    );
  };

  const completedCount = items.filter((i) => i.defaultChecked).length;
  const totalCount = items.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Pre-Trip Checklist
            </CardTitle>
            <CardDescription>Complete before starting your shift</CardDescription>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-gray-600'}`}>
              {pct}%
            </p>
            <p className="text-[10px] text-gray-400">{completedCount}/{totalCount} items</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-gray-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-300 ${
                  item.defaultChecked
                    ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 shrink-0 ${
                  item.defaultChecked
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                } ${justToggled === item.id ? 'animate-check-bounce' : ''}`}>
                  {item.defaultChecked && (
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <Icon className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
                  item.defaultChecked ? 'text-emerald-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium transition-colors duration-300 ${
                  item.defaultChecked ? 'text-emerald-800' : 'text-gray-700'
                }`}>
                  {item.label}
                </span>
                {item.defaultChecked && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
        {pct === 100 && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-emerald-700">All checks completed! Ready to depart.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Quick Communication ────────────────────────────

function QuickCommunication() {
  const messages = [
    { label: 'Running 5 min late', icon: Clock, color: 'amber', desc: 'Notify dispatch about delay' },
    { label: 'Arrived at stop', icon: MapPin, color: 'emerald', desc: 'Confirm arrival at current stop' },
    { label: 'Emergency - need backup', icon: AlertCircle, color: 'red', desc: 'Request immediate assistance' },
    { label: 'Break request', icon: Pause, color: 'violet', desc: 'Request a short break' },
  ];

  const colorMap: Record<string, { bg: string; iconBg: string; iconText: string; hover: string }> = {
    amber: { bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100', iconText: 'text-amber-600', hover: 'hover:bg-amber-100 hover:border-amber-200' },
    emerald: { bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', hover: 'hover:bg-emerald-100 hover:border-emerald-200' },
    red: { bg: 'bg-red-50 border-red-100', iconBg: 'bg-red-100', iconText: 'text-red-600', hover: 'hover:bg-red-100 hover:border-red-200' },
    violet: { bg: 'bg-violet-50 border-violet-100', iconBg: 'bg-violet-100', iconText: 'text-violet-600', hover: 'hover:bg-violet-100 hover:border-violet-200' },
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          Quick Communication
        </CardTitle>
        <CardDescription>Send pre-built messages to dispatch</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {messages.map((msg) => {
            const colors = colorMap[msg.color];
            const Icon = msg.icon;
            return (
              <button
                key={msg.label}
                onClick={() => toast({ title: 'Message Sent', description: `"${msg.label}" sent to dispatch.`, })}
                className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-all ${colors.bg} ${colors.hover}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.iconBg}`}>
                  <Icon className={`h-4 w-4 ${colors.iconText}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{msg.label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{msg.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Earnings Tracker ────────────────────────────

function EarningsTracker({ crewName }: { crewName: string }) {
  const earnings = useMemo(() => getMonthlyEarnings(crewName), [crewName]);
  const thisMonth = earnings[earnings.length - 1];
  const lastMonth = earnings[earnings.length - 2];
  const ytdTotal = earnings.reduce((s, e) => s + e.amount, 0);
  const avgMonthly = Math.round(ytdTotal / earnings.length);
  const comparisonPct = lastMonth.amount > 0 ? Math.round(((thisMonth.amount - lastMonth.amount) / lastMonth.amount) * 100) : 0;

  // SVG Line Chart
  const chartW = 500;
  const chartH = 180;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const minVal = Math.min(...earnings.map((e) => e.amount)) * 0.85;
  const maxVal = Math.max(...earnings.map((e) => e.amount)) * 1.05;

  const getX = (i: number) => padL + (i / (earnings.length - 1)) * plotW;
  const getY = (v: number) => padT + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  const linePath = earnings.map((e, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(e.amount)}`).join(' ');
  const areaPath = linePath + ` L ${getX(earnings.length - 1)} ${padT + plotH} L ${padL} ${padT + plotH} Z`;
  const gridLines = 4;
  const gridValues = Array.from({ length: gridLines }, (_, i) => minVal + (i / (gridLines - 1)) * (maxVal - minVal));

  const fmt = (n: number) => `₹${(n / 1000).toFixed(1)}k`;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'This Month', value: `₹${thisMonth.amount.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'emerald' },
          { label: 'Last Month', value: `₹${lastMonth.amount.toLocaleString('en-IN')}`, icon: CalendarIcon, color: 'violet' },
          { label: 'YTD Total', value: `₹${ytdTotal.toLocaleString('en-IN')}`, icon: DollarSign, color: 'amber' },
          { label: 'Avg Monthly', value: `₹${avgMonthly.toLocaleString('en-IN')}`, icon: Briefcase, color: 'rose' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl border p-3 bg-gradient-to-br from-${c.color}-50 to-white border-${c.color}-100`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3.5 w-3.5 text-${c.color}-500`} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{c.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* SVG Line Chart */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Monthly Earnings (Last 6 Months)
            </CardTitle>
            <Button variant="outline" className="gap-1.5 text-xs border-gray-200 dark:border-gray-700 dark:text-gray-300" onClick={() => toast({ title: 'Coming Soon', description: 'Detailed earnings report coming soon!' })}>
              <Download className="h-3.5 w-3.5" />
              View Detailed Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Monthly comparison badge */}
          <div className="mb-3 flex items-center gap-2">
            <Badge className={`${comparisonPct >= 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300'} text-xs`}>
              {comparisonPct >= 0 ? <ArrowUp className="mr-0.5 h-3 w-3" /> : <ArrowDown className="mr-0.5 h-3 w-3" />}
              {comparisonPct >= 0 ? '+' : ''}{comparisonPct}% vs last month
            </Badge>
          </div>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
            <defs>
              <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Y-axis labels */}
            <text x={padL - 5} y={padT + 8} textAnchor="end" className="fill-gray-400 text-[9px]">₹30k</text>
            <text x={padL - 5} y={padT + plotH / 3 + 4} textAnchor="end" className="fill-gray-400 text-[9px]">₹20k</text>
            <text x={padL - 5} y={padT + 2 * plotH / 3 + 4} textAnchor="end" className="fill-gray-400 text-[9px]">₹10k</text>
            <text x={padL - 5} y={padT + plotH + 4} textAnchor="end" className="fill-gray-400 text-[9px]">₹0k</text>
            {/* Grid lines */}
            {gridValues.map((v) => (
              <g key={v}>
                <line x1={padL} y1={getY(v)} x2={chartW - padR} y2={getY(v)} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" className="dark:stroke-gray-700" />
                <text x={padL - 5} y={getY(v) + 3} textAnchor="end" className="fill-gray-400 text-[9px]">{fmt(v)}</text>
              </g>
            ))}
            {/* Area fill */}
            <path d={areaPath} fill="url(#earnGrad)" />
            {/* Line */}
            <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots, labels, and hover tooltips */}
            {earnings.map((e, i) => (
              <g key={e.month} className="group">
                {/* Invisible larger hit area for hover */}
                <circle cx={getX(i)} cy={getY(e.amount)} r="12" fill="transparent" />
                {/* Hover tooltip background */}
                <circle cx={getX(i)} cy={getY(e.amount) - 16} r="24" fill="white" stroke="#e5e7eb" strokeWidth="1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                <text x={getX(i)} y={getY(e.amount) - 16} textAnchor="middle" className="fill-gray-500 text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{e.amount.toLocaleString('en-IN')}</text>
                {/* Data point dot */}
                <circle cx={getX(i)} cy={getY(e.amount)} r="5" fill="white" stroke="#10b981" strokeWidth="2" className="group-hover:r-7 transition-all" />
                <circle cx={getX(i)} cy={getY(e.amount)} r="12" fill="#10b981" fillOpacity="0" className="group-hover:fill-opacity-10 transition-all" />
                <text x={getX(i)} y={chartH - 8} textAnchor="middle" className="fill-gray-500 text-[10px] font-medium">{e.month}</text>
              </g>
            ))}
          </svg>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────── New Feature: Overtime & Pay Calculator ────────────────────────────

function OvertimePayCalculator({ crewName }: { crewName: string }) {
  const [selectedMonth, setSelectedMonth] = useState<'current' | 'previous'>('current');

  const basePay = 25000;
  const otRate = 150;

  const thisWeekOT = getSeededValue(crewName + 'otw' + getTodayStr(), 2, 12);
  const monthKey = selectedMonth === 'current' ? 'cur' : 'prev';
  const thisMonthOT = getSeededValue(crewName + 'otm' + monthKey, 15, 45);
  const nightAllowance = getSeededValue(crewName + 'night' + monthKey, 1500, 3500);
  const perfBonus = getSeededValue(crewName + 'bonus' + monthKey, 500, 2500);
  const deductions = getSeededValue(crewName + 'ded' + monthKey, 800, 2000);

  const otPay = thisMonthOT * otRate;
  const total = basePay + otPay + nightAllowance + perfBonus - deductions;

  const monthLabel = selectedMonth === 'current'
    ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              Overtime &amp; Pay
            </CardTitle>
            <CardDescription>Detailed pay breakdown and overtime summary</CardDescription>
          </div>
          <div className="flex gap-0.5 rounded-lg border border-gray-200 p-0.5">
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedMonth === 'current' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setSelectedMonth('current')}
            >
              This Month
            </button>
            <button
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedMonth === 'previous' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => setSelectedMonth('previous')}
            >
              Previous
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className={`rounded-xl border p-3 ${thisWeekOT > 8 ? 'bg-gradient-to-br from-red-50 to-white border-red-100' : 'bg-gradient-to-br from-amber-50 to-white border-amber-100'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className={`h-3.5 w-3.5 ${thisWeekOT > 8 ? 'text-red-500' : 'text-amber-500'}`} />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">This Week</span>
            </div>
            <p className={`text-xl font-bold ${thisWeekOT > 8 ? 'text-red-600' : 'text-amber-600'}`}>{thisWeekOT}h</p>
            <p className="text-[10px] text-gray-400">overtime</p>
          </div>
          <div className="rounded-xl border p-3 bg-gradient-to-br from-violet-50 to-white border-violet-100">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarIcon className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">This Month</span>
            </div>
            <p className="text-xl font-bold text-violet-600">{thisMonthOT}h</p>
            <p className="text-[10px] text-gray-400">overtime</p>
          </div>
          <div className="rounded-xl border p-3 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <div className="flex items-center gap-1.5 mb-1">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Est. OT Pay</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">₹{otPay.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-400">@ ₹{otRate}/hr</p>
          </div>
        </div>

        {/* Pay Breakdown Table */}
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{monthLabel}</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {[
              { label: 'Base Pay', value: basePay, color: 'text-gray-900 dark:text-gray-100' },
              { label: `Overtime (${thisMonthOT}h × ₹${otRate}/hr)`, value: otPay, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Night Allowance', value: nightAllowance, color: 'text-gray-900 dark:text-gray-100' },
              { label: 'Performance Bonus', value: perfBonus, color: 'text-emerald-600' },
              { label: 'Deductions', value: -deductions, color: 'text-red-600' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-sm font-semibold ${row.color}`}>
                  {row.value < 0 ? '-' : ''}₹{Math.abs(row.value).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Calendar Shift Summary ────────────────────────────

function ShiftSummaryCard({ dateStr, assignments, crewName }: { dateStr: string; assignments: AssignmentData[]; crewName: string }) {
  const dayAssignments = assignments.filter((a) => a.schedule.date === dateStr);
  const seed = simpleHash(dateStr + crewName);

  // Generate deterministic shift summary from assignments
  const morningShift = dayAssignments.find((a) => {
    const h = parseInt(a.schedule.departureTime.split(':')[0], 10);
    return h < 13;
  });
  const eveningShift = dayAssignments.find((a) => {
    const h = parseInt(a.schedule.departureTime.split(':')[0], 10);
    return h >= 13;
  });

  const morningTime = morningShift?.schedule.departureTime || (seed % 3 === 0 ? `${6 + (seed % 3)}:${String(15 + (seed % 4) * 10).padStart(2, '0')}` : null);
  const eveningTime = eveningShift?.schedule.departureTime || (seed % 2 === 0 ? `${(15 + (seed % 4))}:${String(15 + (seed % 4) * 10).padStart(2, '0')}` : null);
  const morningRoute = morningShift?.schedule.route?.routeNumber || (morningTime ? `R${200 + (seed % 300)}` : null);
  const eveningRoute = eveningShift?.schedule.route?.routeNumber || (eveningTime ? `R${100 + (seed % 200)}` : null);

  // Calculate total hours deterministically
  let totalHours = 0;
  if (morningTime) totalHours += 4 + (seed % 3) * 0.5;
  if (eveningTime) totalHours += 3 + (seed % 2) * 0.5;
  const hasOvertime = totalHours > 8;

  if (!morningTime && !eveningTime) return null;

  return (
    <div className={`rounded-lg border p-3 ${hasOvertime ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{formatDate(dateStr)}</p>
      {morningTime && (
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100">
            <Sun className="h-3 w-3 text-amber-600" />
          </div>
          <span className="text-xs text-gray-700">Morning: <span className="font-semibold">{morningTime}</span> — R{morningRoute?.replace('R', '') || '—'}</span>
        </div>
      )}
      {eveningTime && (
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-violet-100">
            <Moon className="h-3 w-3 text-violet-600" />
          </div>
          <span className="text-xs text-gray-700">Evening: <span className="font-semibold">{eveningTime}</span> — R{eveningRoute?.replace('R', '') || '—'}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-medium text-gray-600">Total: <span className="font-bold text-gray-900 dark:text-gray-100">{totalHours.toFixed(1)}h</span></span>
        {hasOvertime && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
            <Flame className="mr-0.5 h-2.5 w-2.5" />
            Overtime
          </Badge>
        )}
      </div>
    </div>
  );
}

// Sun/Moon tiny icons (for shift summary)
function Sun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function Moon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

// ──────────────────────────── Reusable Visual Components ────────────────────────────

function WeeklyHoursBarChart({ crewName }: { crewName: string }) {
  const hours = useMemo(() => getWeeklyHours(crewName), [crewName]);
  const totalHours = hours.reduce((sum, h) => sum + h, 0);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxHours = 10;
  const barHeight = 22;
  const barGap = 8;
  const chartWidth = 100;
  const labelWidth = 32;
  const valueWidth = 36;
  const totalChartHeight = (barHeight + barGap) * 7 - barGap;

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-emerald-600" />
              This Week&apos;s Hours
            </CardTitle>
            <CardDescription>Weekly work hours breakdown</CardDescription>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${totalHours <= 40 ? 'text-emerald-600' : totalHours <= 45 ? 'text-amber-600' : 'text-red-600'}`}>
              {totalHours.toFixed(1)}h
            </p>
            <p className="text-xs text-gray-400">Target: 40h/week</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${chartWidth} ${totalChartHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {hours.map((h, i) => {
            const y = i * (barHeight + barGap);
            const barWidth = (h / maxHours) * (chartWidth - labelWidth - valueWidth);
            return (
              <g key={dayLabels[i]}>
                <text
                  x={0}
                  y={y + barHeight / 2 + 4}
                  className="fill-gray-500 text-[7px] font-semibold"
                  textAnchor="start"
                >
                  {dayLabels[i]}
                </text>
                <rect
                  x={labelWidth}
                  y={y}
                  width={Math.max(barWidth, 2)}
                  height={barHeight}
                  rx={4}
                  className={getBarColor(h)}
                  opacity={0.9}
                />
                <text
                  x={labelWidth + Math.max(barWidth, 2) + 3}
                  y={y + barHeight / 2 + 3.5}
                  className={`fill-gray-700 text-[6.5px] font-bold`}
                >
                  {h.toFixed(1)}h
                </text>
              </g>
            );
          })}
        </svg>
        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            ≤ 8h
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
            8-9h
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
            &gt; 9h
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Digital Shift Logbook ────────────────────────────

function ShiftLogbook({ crewName }: { crewName: string }) {
  const activityTypeDefs = [
    { type: 'Shift Started', icon: Play, color: 'emerald' as const, desc: 'Morning shift started on Route R-201' },
    { type: 'Route Completed', icon: CheckCircle2, color: 'emerald' as const, desc: 'Completed Route R-201 - Majestic to Silk Board' },
    { type: 'Refuel', icon: Fuel, color: 'amber' as const, desc: 'Bus refueled at HP Petrol Bunk, Indiranagar' },
    { type: 'Break Taken', icon: Coffee, color: 'amber' as const, desc: 'Lunch break at Koramangala depot' },
    { type: 'Break Ended', icon: Clock, color: 'amber' as const, desc: 'Resumed shift after 30-min break' },
    { type: 'Passenger Issue', icon: Users, color: 'red' as const, desc: 'Overcrowding reported at Silk Board junction' },
    { type: 'Incident Reported', icon: AlertTriangle, color: 'red' as const, desc: 'Minor scratch on bus near HSR Layout' },
    { type: 'Shift Ended', icon: Square, color: 'emerald' as const, desc: 'Evening shift completed. Total: 8h 15m' },
  ];

  const [entries, setEntries] = useState(() => {
    const now = new Date();
    return activityTypeDefs.map((a, i) => {
      const timeOffset = (activityTypeDefs.length - 1 - i) * 45;
      const entryTime = new Date(now.getTime() - timeOffset * 60000);
      return {
        id: `${crewName}-${i}`,
        type: a.type,
        icon: a.icon,
        color: a.color,
        desc: a.desc,
        timestamp: `${String(entryTime.getHours()).padStart(2, '0')}:${String(entryTime.getMinutes()).padStart(2, '0')}`,
        status: i === 0 ? 'Active' : 'Logged',
      };
    });
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const activityTypeOptions = [
    'Shift Started', 'Break Taken', 'Break Ended', 'Incident Reported',
    'Route Completed', 'Refuel', 'Passenger Issue', 'Shift Ended',
  ];

  const getIconForType = (type: string) => {
    const found = activityTypeDefs.find((a) => a.type === type);
    if (found) return { icon: found.icon, color: found.color };
    return { icon: FileText, color: 'amber' as const };
  };

  const getColorClasses = (color: string) => {
    if (color === 'emerald') return { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-200' };
    if (color === 'amber') return { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-200' };
    if (color === 'red') return { bg: 'bg-red-100', text: 'text-red-600', ring: 'ring-red-200' };
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', ring: 'ring-gray-200 dark:ring-gray-600' };
  };

  const handleAddEntry = () => {
    if (!newType || !newNotes) return;
    const now = new Date();
    const { icon, color } = getIconForType(newType);
    const newEntry = {
      id: `new-${Date.now()}`,
      type: newType,
      icon,
      color,
      desc: newNotes,
      timestamp: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      status: 'Just Added' as const,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setDialogOpen(false);
    setNewType('');
    setNewNotes('');
    toast({ title: 'Log entry added', description: `${newType}: ${newNotes}` });
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Shift Logbook
            </CardTitle>
            <CardDescription>Today&apos;s shift activity timeline</CardDescription>
          </div>
          <Button size="sm" className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 max-h-96 overflow-y-auto">
          {entries.map((entry, i) => {
            const Icon = entry.icon;
            const colors = getColorClasses(entry.color);
            return (
              <div key={entry.id} className="flex gap-3 relative">
                {i < entries.length - 1 && (
                  <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-gray-200" />
                )}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colors.bg} ring-2 ${colors.ring} relative z-10`}>
                  <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                </div>
                <div className="flex-1 pb-4 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{entry.type}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={
                        entry.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]'
                          : entry.status === 'Just Added'
                            ? 'bg-sky-100 text-sky-700 border-sky-200 text-[10px]'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 text-[10px]'
                      }>
                        {entry.status}
                      </Badge>
                      <span className="text-xs text-gray-400 font-mono">{entry.timestamp}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Log Entry</DialogTitle>
            <DialogDescription>Record a new shift activity</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Activity Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Notes</Label>
              <Textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Describe the activity..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleAddEntry}
              disabled={!newType || !newNotes}
            >
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ──────────────────────────── New Feature: Daily Weather Widget ────────────────────────────

function DailyWeatherWidget({ crewName }: { crewName: string }) {
  const weatherData = useMemo(() => {
    const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'];
    const cityIdx = simpleHash(crewName) % cities.length;
    const city = cities[cityIdx];

    const conditions = [
      { type: 'Sunny', iconName: 'sun', tempRange: [30, 38] as const, humidityRange: [25, 45] as const, windRange: [8, 20] as const, roadLabel: 'Good' as const, advisory: 'Clear conditions - normal operations' },
      { type: 'Cloudy', iconName: 'cloud', tempRange: [24, 32] as const, humidityRange: [50, 70] as const, windRange: [12, 25] as const, roadLabel: 'Fair' as const, advisory: 'Overcast skies - maintain normal speed' },
      { type: 'Rainy', iconName: 'rain', tempRange: [22, 28] as const, humidityRange: [75, 95] as const, windRange: [15, 35] as const, roadLabel: 'Poor' as const, advisory: 'Heavy rain - drive carefully, reduce speed' },
      { type: 'Thunderstorm', iconName: 'storm', tempRange: [20, 26] as const, humidityRange: [80, 98] as const, windRange: [25, 50] as const, roadLabel: 'Poor' as const, advisory: 'Thunderstorm warning - exercise extreme caution' },
    ];
    const condIdx = getSeededValue(crewName + 'weather', 0, 3);
    const cond = conditions[condIdx];

    const temp = cond.tempRange[0] + getSeededValue(crewName + 'temp', 0, cond.tempRange[1] - cond.tempRange[0]);
    const humidity = cond.humidityRange[0] + getSeededValue(crewName + 'hum', 0, cond.humidityRange[1] - cond.humidityRange[0]);
    const wind = cond.windRange[0] + getSeededValue(crewName + 'wind', 0, cond.windRange[1] - cond.windRange[0]);
    const roadPct = cond.roadLabel === 'Good'
      ? 75 + getSeededValue(crewName + 'road', 0, 20)
      : cond.roadLabel === 'Fair'
        ? 45 + getSeededValue(crewName + 'road2', 0, 25)
        : 15 + getSeededValue(crewName + 'road3', 0, 25);

    return { city, type: cond.type, iconName: cond.iconName, temp, humidity, wind, roadLabel: cond.roadLabel, advisory: cond.advisory, roadPct };
  }, [crewName]);

  const roadColor = weatherData.roadLabel === 'Good' ? 'bg-emerald-500' : weatherData.roadLabel === 'Fair' ? 'bg-amber-500' : 'bg-red-500';

  const weatherIconEl = weatherData.iconName === 'sun'
    ? <SunIcon className="h-10 w-10 text-amber-500" />
    : weatherData.iconName === 'rain'
      ? <CloudRain className="h-10 w-10 text-sky-500" />
      : weatherData.iconName === 'storm'
        ? <CloudLightning className="h-10 w-10 text-violet-500" />
        : <Cloud className="h-10 w-10 text-gray-400" />;

  return (
    <Card className="glass transit-card rounded-xl shadow-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Cloud className="h-5 w-5 text-sky-500" />
          Today&apos;s Weather
        </CardTitle>
        <CardDescription>{weatherData.city}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {weatherIconEl}
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{weatherData.temp}°C</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{weatherData.type}</p>
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 justify-end">
              <Droplets className="h-3.5 w-3.5 text-sky-400" />
              <span>{weatherData.humidity}% humidity</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 justify-end">
              <Wind className="h-3.5 w-3.5 text-gray-400" />
              <span>{weatherData.wind} km/h wind</span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Road Condition</span>
            <Badge className={
              weatherData.roadLabel === 'Good'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800'
                : weatherData.roadLabel === 'Fair'
                  ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
            }>
              {weatherData.roadLabel}
            </Badge>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${roadColor}`} style={{ width: `${weatherData.roadPct}%` }} />
          </div>
        </div>
        <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
          weatherData.roadLabel === 'Good'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            : weatherData.roadLabel === 'Fair'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          <Navigation className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span className="font-medium">{weatherData.advisory}</span>
        </div>
        <Button variant="outline" className="mt-3 w-full gap-1.5 text-xs border-gray-200 dark:border-gray-700 dark:text-gray-300" onClick={() => toast({ title: 'Coming Soon', description: 'Weather forecast coming soon!' })}>
          <Navigation className="h-3.5 w-3.5" />
          View Full Forecast
        </Button>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Performance Scorecard ────────────────────────────

function PerformanceScorecard({ crewName }: { crewName: string }) {
  const data = useMemo(() => {
    const overallScore = 55 + getSeededValue(crewName + 'overall', 0, 40);
    const safety = 60 + getSeededValue(crewName + 'safety', 0, 38);
    const punctuality = 55 + getSeededValue(crewName + 'punct', 0, 42);
    const passengerRating = 50 + getSeededValue(crewName + 'paxr', 0, 48);
    const fuelEfficiency = 55 + getSeededValue(crewName + 'feff', 0, 43);
    const rank = 1 + getSeededValue(crewName + 'rank', 0, 103);
    const totalCrew = 104;
    const thisMonthScore = overallScore;
    const lastMonthScore = overallScore + (simpleHash(crewName + 'lm') % 15) - 7;
    const diff = thisMonthScore - lastMonthScore;
    return { overallScore, safety, punctuality, passengerRating, fuelEfficiency, rank, totalCrew, thisMonthScore, lastMonthScore, diff };
  }, [crewName]);

  const metrics = [
    { label: 'Safety Score', value: data.safety },
    { label: 'Punctuality', value: data.punctuality },
    { label: 'Passenger Rating', value: data.passengerRating },
    { label: 'Fuel Efficiency', value: data.fuelEfficiency },
  ];

  const getBarColor = (v: number) => v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const getBarBg = (v: number) => v >= 80 ? 'bg-emerald-100' : v >= 60 ? 'bg-amber-100' : 'bg-red-100';
  const getTextColor = (v: number) => v >= 80 ? 'text-emerald-600' : v >= 60 ? 'text-amber-600' : 'text-red-600';

  const radius = 54;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (data.overallScore / 100) * circumference;
  const scoreColor = data.overallScore >= 80 ? '#10b981' : data.overallScore >= 60 ? '#f59e0b' : '#ef4444';
  const scoreBg = data.overallScore >= 80 ? '#d1fae5' : data.overallScore >= 60 ? '#fef3c7' : '#fee2e2';

  return (
    <Card className="transit-card rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Performance Scorecard
            </CardTitle>
            <CardDescription>Your monthly performance metrics</CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200 text-xs font-bold">
            #{data.rank} of {data.totalCrew}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-6 mb-5">
          <div className="relative shrink-0">
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" stroke={scoreBg} />
              <circle
                cx="60" cy="60" r={radius} fill="none" strokeWidth="10"
                strokeLinecap="round" stroke={scoreColor}
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.overallScore}</span>
              <span className="text-[10px] text-gray-400">Overall</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">This Month</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{data.thisMonthScore}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${data.diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {data.diff >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(data.diff)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Last Month</p>
                <p className="text-lg font-bold text-gray-400">{data.lastMonthScore}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">{m.label}</span>
                <span className={`text-xs font-bold ${getTextColor(m.value)}`}>{m.value}%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${getBarBg(m.value)}`}>
                <div className={`h-full rounded-full transition-all duration-500 ${getBarColor(m.value)}`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── Quick Actions ────────────────────────────

function QuickActions() {
  const actions = [
    {
      label: 'Start Shift',
      description: 'Begin your work shift',
      icon: Play,
      color: 'emerald',
      message: 'Shift started!',
    },
    {
      label: 'End Shift',
      description: 'End your current shift',
      icon: Square,
      color: 'red',
      message: 'Shift ended!',
    },
    {
      label: 'Report Issue',
      description: 'Report a problem or incident',
      icon: AlertCircle,
      color: 'amber',
      message: 'Issue reported successfully!',
    },
    {
      label: 'View Pay',
      description: 'Check your pay details',
      icon: DollarSign,
      color: 'violet',
      message: 'Pay details loaded!',
    },
  ];

  const colorMap: Record<string, { bg: string; iconBg: string; iconText: string; hover: string }> = {
    emerald: { bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', hover: 'hover:bg-emerald-100 hover:border-emerald-200' },
    red: { bg: 'bg-red-50 border-red-100', iconBg: 'bg-red-100', iconText: 'text-red-600', hover: 'hover:bg-red-100 hover:border-red-200' },
    amber: { bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100', iconText: 'text-amber-600', hover: 'hover:bg-amber-100 hover:border-amber-200' },
    violet: { bg: 'bg-violet-50 border-violet-100', iconBg: 'bg-violet-100', iconText: 'text-violet-600', hover: 'hover:bg-violet-100 hover:border-violet-200' },
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => {
        const colors = colorMap[action.color];
        const Icon = action.icon;
        return (
          <Card
            key={action.label}
            className={`btn-press rounded-xl shadow-sm cursor-pointer border transition-all hover-glow ${colors.bg} ${colors.hover}`}
            onClick={() => toast({ title: action.message, description: `${action.label} action triggered.` })}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}>
                <Icon className={`h-5 w-5 ${colors.iconText}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{action.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ──────────────────────────── Passenger Counter ────────────────────────────

function PassengerCounter() {
  const [count, setCount] = useState(0);
  const CAPACITY = 40;
  const [stopHistory, setStopHistory] = useState<{ time: string; count: number }[]>([]);

  const percentage = Math.round((count / CAPACITY) * 100);
  const progressColor = percentage > 85
    ? 'bg-red-500'
    : percentage >= 60
      ? 'bg-amber-500'
      : 'bg-emerald-500';
  const progressTrackColor = 'bg-gray-200 dark:bg-gray-700';

  const recordStop = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setStopHistory((prev) =>
      [{ time: timeStr, count }, ...prev].slice(0, 5)
    );
    toast({
      title: 'Stop Recorded',
      description: `${count} passenger${count !== 1 ? 's' : ''} logged at ${timeStr}.`,
    });
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" />
          Passenger Counter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Count Display */}
        <div className="flex flex-col items-center">
          <span className="text-6xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {count}
          </span>
          <span className="text-xs text-gray-400 mt-1">passengers on board</span>
        </div>

        {/* +1 / -1 Circular Buttons */}
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(0, c - 1))}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-400 transition-colors"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* +5 / -5 Quick Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setCount((c) => Math.max(0, c - 5))}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-700 dark:hover:text-red-400 transition-colors"
          >
            −5
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => c + 5)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            +5
          </button>
        </div>

        {/* Capacity Indicator */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Capacity: {count} / {CAPACITY}
            </span>
            <span className={`text-xs font-semibold ${percentage > 85 ? 'text-red-600' : percentage >= 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {percentage}%
            </span>
          </div>
          <div className={`h-2.5 ${progressTrackColor} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-300 ease-out`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Record Stop Button */}
        <Button
          onClick={recordStop}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          Record Stop
        </Button>

        {/* Stop History */}
        {stopHistory.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Stop History
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {stopHistory.map((stop, i) => (
                <div
                  key={`${stop.time}-${stop.count}-${i}`}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/60 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-3 w-3 text-emerald-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {stop.time}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {stop.count} <span className="text-xs font-normal text-gray-500">pax</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CircularProgress({ value, size = 80, strokeWidth = 6, color = 'emerald' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const colorMap: Record<string, string> = {
    emerald: 'stroke-emerald-500',
    amber: 'stroke-amber-500',
    red: 'stroke-red-500',
    slate: 'stroke-slate-400',
  };
  const bgColorMap: Record<string, string> = {
    emerald: 'stroke-emerald-100',
    amber: 'stroke-amber-100',
    red: 'stroke-red-100',
    slate: 'stroke-slate-100',
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className={bgColorMap[color] || bgColorMap.slate} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorMap[color] || colorMap.slate}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-900 dark:text-gray-100">{Math.round(value)}%</span>
    </div>
  );
}

function RouteMiniVisualization({
  start,
  end,
  routeNumber,
}: {
  start: string;
  end: string;
  routeNumber: string;
}) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex flex-col items-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
          <MapPin className="h-3.5 w-3.5" />
        </div>
        <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-300 to-gray-200" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-white text-xs font-bold">
          <MapPin className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-emerald-700 truncate">{start}</span>
        </div>
        <div className="flex items-center gap-1 my-1">
          <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            R{routeNumber}
          </Badge>
          <div className="flex-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-600 truncate">{end}</span>
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ status, createdAt, reviewedAt, reviewerName }: { status: string; createdAt?: string; reviewedAt?: string; reviewerName?: string | null }) {
  const steps = [
    { label: 'Applied', done: true, date: createdAt, dotColor: 'bg-gray-400 dark:bg-gray-500', lineColor: 'bg-gray-300 dark:bg-gray-600' },
    { label: 'Under Review', done: status === 'approved' || status === 'rejected', date: null, dotColor: status === 'approved' || status === 'rejected' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600', lineColor: status === 'approved' || status === 'rejected' ? 'bg-amber-400' : 'bg-gray-200 dark:bg-gray-700' },
    { label: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Decision', done: status === 'approved' || status === 'rejected', date: reviewedAt, dotColor: status === 'rejected' ? 'bg-red-500' : status === 'approved' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600', lineColor: status === 'rejected' ? 'bg-red-400' : status === 'approved' ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700' },
  ];

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center min-w-0 flex-1">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
              step.done
                ? step.dotColor + ' text-white ring-2 ' + (step.dotColor === 'bg-emerald-500' ? 'ring-emerald-200' : step.dotColor === 'bg-red-500' ? 'ring-red-200' : step.dotColor === 'bg-amber-500' ? 'ring-amber-200' : 'ring-gray-200')
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}>
              {step.done ? (
                step.label === 'Rejected' ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )
              ) : (
                <span className="text-[10px]">{i + 1}</span>
              )}
            </div>
            <span className="mt-1 text-[10px] text-gray-500 text-center leading-tight whitespace-nowrap">
              {step.label}
            </span>
            {step.date && (
              <span className="text-[8px] text-gray-400 text-center whitespace-nowrap">{formatDateShort(step.date)}</span>
            )}
            {(step.label === 'Approved' || step.label === 'Rejected') && reviewerName && step.done && (
              <span className="text-[8px] text-gray-400 text-center whitespace-nowrap">by {reviewerName}</span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 mt-[-12px] ${step.done ? step.lineColor : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ──────────────────────────── Star Rating ────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          size={size}
          className="fill-amber-400 text-amber-400"
        />
      ))}
      {hasHalf && (
        <span className="relative" style={{ width: size, height: size }}>
          <Star
            size={size}
            className="absolute inset-0 text-gray-300"
          />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: '50%' }}
          >
            <Star
              size={size}
              className="fill-amber-400 text-amber-400"
            />
          </span>
        </span>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={size}
          className="text-gray-300"
        />
      ))}
    </span>
  );
}

// ──────────────────────────── Loading Skeletons ────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

// ──────────────────────────── Weekly Performance Score ────────────────────────────

function WeeklyPerformanceScore({ crewName }: { crewName: string }) {
  const data = useMemo(() => {
    const score = 72 + getSeededValue(crewName + 'weeklyPerfScore', 0, 24); // 72-96
    const trips = 18 + getSeededValue(crewName + 'wpsTrips', 0, 12);
    const onTimePct = 78 + getSeededValue(crewName + 'wpsOnTime', 0, 22);
    const rating = (3.5 + getSeededValue(crewName + 'wpsRating', 0, 15) / 10).toFixed(1);
    const feedback = 4 + getSeededValue(crewName + 'wpsFeedback', 0, 18);
    return { score, trips, onTimePct, rating, feedback };
  }, [crewName]);

  const scoreColor = data.score >= 85 ? '#10b981' : data.score >= 70 ? '#f59e0b' : '#ef4444';
  const scoreBg = data.score >= 85 ? '#d1fae5' : data.score >= 70 ? '#fef3c7' : '#fee2e2';
  const labelColor = data.score >= 85 ? 'text-emerald-600' : data.score >= 70 ? 'text-amber-600' : 'text-red-600';
  const badgeBg = data.score >= 85 ? 'bg-emerald-50 border-emerald-200' : data.score >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  const radius = 62;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (data.score / 100) * circumference;

  const miniStats = [
    { label: 'Trips', value: `${data.trips}`, icon: Navigation },
    { label: 'On-Time %', value: `${data.onTimePct}%`, icon: Clock },
    { label: 'Rating', value: `${data.rating}`, icon: Star },
    { label: 'Feedback', value: `${data.feedback}`, icon: MessageSquare },
  ];

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 animate-fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Weekly Performance Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Circular Progress Ring with pulse */}
          <div className="relative">
            <svg width="150" height="150" className="-rotate-90">
              <circle cx="75" cy="75" r={radius} fill="none" strokeWidth="10" stroke={scoreBg} />
              <circle
                cx="75" cy="75" r={radius} fill="none" strokeWidth="10"
                strokeLinecap="round" stroke={scoreColor}
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s ease' }}
              />
              {/* Pulse animation ring */}
              <circle
                cx="75" cy="75" r={radius + 8} fill="none" strokeWidth="2" stroke={scoreColor} strokeOpacity="0.3"
                className="origin-center"
                style={{ animation: 'pulse-ring 2.5s ease-in-out infinite', transformOrigin: '75px 75px' }}
              />
            </svg>
            {/* Inline keyframe style injected */}
            <style>{`
              @keyframes pulse-ring {
                0%, 100% { r: ${radius + 8}; stroke-opacity: 0.15; }
                50% { r: ${radius + 14}; stroke-opacity: 0.05; }
              }
            `}</style>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.score}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Performance Score</span>
            </div>
          </div>

          {/* Color-coded badge */}
          <Badge className={`${badgeBg} border ${labelColor} text-xs font-semibold`}>
            {data.score >= 85 ? 'Excellent' : data.score >= 70 ? 'Good' : 'Needs Improvement'}
          </Badge>

          {/* Mini stat badges */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {miniStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2 bg-gray-50/50 dark:bg-gray-800/50">
                  <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-[9px] text-gray-400">{stat.label}</p>
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

// ──────────────────────────── Dashboard Page ────────────────────────────

function DashboardPage({
  userId,
  token,
  crewProfile,
  assignments,
  onRespond,
  onToggleAvailability,
  loading,
}: {
  userId: string;
  token: string;
  crewProfile: CrewProfileData | null;
  assignments: AssignmentData[];
  onRespond: (assignmentId: string, status: string) => void;
  onToggleAvailability: (available: boolean) => void;
  loading: boolean;
}) {
  const todayStr = getTodayStr();

  const todayAssignments = assignments.filter(
    (a) => a.schedule.date === todayStr
  );
  const upcomingAssignments = assignments.filter(
    (a) => a.schedule.date > todayStr && (a.status === 'pending' || a.status === 'accepted')
  );
  const completedCount = assignments.filter(
    (a) => a.status === 'completed'
  ).length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0;
  const isAvailable = crewProfile?.availability === 'available';

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Crew Portal Badge */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1.5 rounded-full bg-amber-500" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Crew Portal</p>
          <p className="text-xs text-muted-foreground">Driver &amp; Conductor Dashboard</p>
        </div>
      </div>

      {/* Welcome Card */}
      <Card className="rounded-xl shadow-sm bg-gradient-to-r from-amber-500 to-orange-600 border-amber-100">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-amber-600 text-lg font-bold shrink-0">
                {getInitials(crewProfile?.profile?.name || '')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {crewProfile?.profile?.name || 'Crew Member'}
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-white/80">
                    {formatDate(todayStr)}
                  </p>
                  {crewProfile && (
                    <Badge className={`${getSpecializationColor(crewProfile.specialization)} border text-xs`}>
                      {crewProfile.specialization === 'driver' ? (
                        <><Bus className="mr-1 h-3 w-3" />Driver</>
                      ) : (
                        <><User className="mr-1 h-3 w-3" />Conductor</>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {/* Quick Status Toggle */}
            <div className="flex items-center gap-3 rounded-lg bg-white/90 px-4 py-2.5">
              <Power className={`h-4 w-4 ${isAvailable ? 'text-emerald-600' : 'text-gray-400'}`} />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500">Availability</span>
                <span className={`text-xs font-semibold ${isAvailable ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={(checked) => onToggleAvailability(checked)}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>
          {/* Gradient Line Separator */}
          <div className="h-px bg-gradient-to-r from-orange-300 via-amber-400 to-orange-300 mt-1 opacity-60" />
          {/* Today's Summary Badges */}
          <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
              <Clock className="h-3.5 w-3.5 text-amber-700" />
              <span className="text-[11px] text-amber-900/70 hidden sm:inline">Shift:</span>
              <span className="text-xs font-bold text-amber-900">06:00 AM</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-orange-700" />
              <span className="text-[11px] text-orange-900/70 hidden sm:inline">Route:</span>
              <span className="text-xs font-bold text-orange-900">{todayAssignments[0]?.schedule.route?.routeNumber || 'BLR-101'}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
              <Users className="h-3.5 w-3.5 text-sky-600" />
              <span className="text-[11px] text-gray-700 hidden sm:inline">Pax:</span>
              <span className="text-xs font-bold text-gray-900">156</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
              <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
              <span className="text-[11px] text-gray-700 hidden sm:inline">Rating:</span>
              <span className="text-xs font-bold text-gray-900">{crewProfile?.performanceRating?.toFixed(1) || '4.8'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <CalendarIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {todayAssignments.length}
                </p>
                <p className="text-xs text-gray-500">Today&apos;s Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {upcomingAssignments.length}
                </p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {completedCount}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                <Star className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {crewProfile?.performanceRating?.toFixed(1) || '—'}
                </span>
                <p className="text-xs text-gray-500">Performance Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Week Stats Row */}
      {crewProfile && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="glass-card rounded-xl border-t-4 border-t-emerald-500 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <Navigation className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {completedCount + getSeededValue(crewProfile.profile?.name || '' + 'wt', 3, 8)}
                </p>
                <p className="text-[11px] text-gray-500">Trips This Week</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-emerald-600">
              <ArrowUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+12%</span>
            </div>
          </div>
          <div className="glass-card rounded-xl border-t-4 border-t-sky-500 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                <Timer className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {getWeeklyHours(crewProfile.profile?.name || '').reduce((s, h) => s + h, 0).toFixed(0)}h
                </p>
                <p className="text-[11px] text-gray-500">Hours Worked</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-amber-600">
              <ArrowUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+5%</span>
            </div>
          </div>
          <div className="glass-card rounded-xl border-t-4 border-t-amber-500 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Gauge className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {320 + getSeededValue(crewProfile.profile?.name || '' + 'wd', 0, 180)} km
                </p>
                <p className="text-[11px] text-gray-500">Distance Covered</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-emerald-600">
              <ArrowUp className="h-3 w-3" />
              <span className="text-[10px] font-semibold">+8%</span>
            </div>
          </div>
          <div className="glass-card rounded-xl border-t-4 border-t-rose-500 p-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                <Fuel className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {38 + getSeededValue(crewProfile.profile?.name || '' + 'wf', 0, 25)} L
                </p>
                <p className="text-[11px] text-gray-500">Fuel Used</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-red-500">
              <ArrowDown className="h-3 w-3" />
              <span className="text-[10px] font-semibold">-3%</span>
            </div>
          </div>
        </div>
      )}

      {/* Communication Board */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            Communication Board
          </CardTitle>
          <CardDescription>Latest updates from dispatch and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { message: 'Route R-215 delayed by 10 min due to traffic', sender: 'Dispatch', time: '15 min ago', priority: 'amber', icon: AlertTriangle },
              { message: 'New schedule effective from tomorrow — check assignments', sender: 'Management', time: '1 hour ago', priority: 'blue', icon: Briefcase },
              { message: 'Fuel station at Jayanagar closed for maintenance', sender: 'Dispatch', time: '2 hours ago', priority: 'red', icon: Fuel },
              { message: 'Weekly meeting scheduled for Friday 4:00 PM', sender: 'HR', time: '5 hours ago', priority: 'emerald', icon: CalendarIcon },
            ].map((item, i) => {
              const ItemIcon = item.icon;
              const dotColor = item.priority === 'amber' ? 'bg-amber-500' : item.priority === 'blue' ? 'bg-sky-500' : item.priority === 'red' ? 'bg-red-500' : 'bg-emerald-500';
              const bgColor = item.priority === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20' : item.priority === 'blue' ? 'bg-sky-50 dark:bg-sky-900/20' : item.priority === 'red' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20';
              const iconColor = item.priority === 'amber' ? 'text-amber-600' : item.priority === 'blue' ? 'text-sky-600' : item.priority === 'red' ? 'text-red-600' : 'text-emerald-600';
              return (
                <div key={i} className={`flex items-start gap-3 rounded-lg ${bgColor} p-3 transition-all hover:shadow-sm`}>
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <ItemIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">{item.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="font-semibold text-gray-500">{item.sender}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Performance Score */}
      {crewProfile && (
        <WeeklyPerformanceScore crewName={crewProfile.profile?.name || ''} />
      )}

      {/* Today's Weather Widget */}
      <DailyWeatherWidget crewName={crewProfile?.profile?.name || ''} />

      {/* Today's Route Preview */}
      {todayAssignments.length > 0 && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Today&apos;s Route Preview
            </CardTitle>
            <CardDescription>
              {todayAssignments.length} assignment{todayAssignments.length > 1 ? 's' : ''} for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {todayAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Route Visualization */}
                    <div className="flex-1 min-w-0">
                      <RouteMiniVisualization
                        start={assignment.schedule.route?.startLocation || 'Unknown'}
                        end={assignment.schedule.route?.endLocation || 'Unknown'}
                        routeNumber={assignment.schedule.route?.routeNumber || '—'}
                      />
                    </div>
                    {/* Route Details */}
                    <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 sm:items-end shrink-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-gray-700">{assignment.schedule.departureTime}</span>
                      </div>
                      {assignment.schedule.route?.busRegistration && (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Bus className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-500">{assignment.schedule.route.busRegistration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Assignment Performance Metrics */}
                  <AssignmentPerformanceBadge assignmentId={assignment.id} />

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                    <Badge className={getStatusColor(assignment.status)}>
                      {capitalize(assignment.status)}
                    </Badge>
                    {assignment.status === 'pending' && (
                      <div className="flex gap-2 ml-auto">
                        <Button
                          size="sm"
                          className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => onRespond(assignment.id, 'accepted')}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => onRespond(assignment.id, 'declined')}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No assignments today */}
      {todayAssignments.length === 0 && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-3">
                <CalendarIcon className="h-8 w-8 text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">You&apos;re free today</p>
              <p className="text-xs text-gray-400 mt-1">Enjoy your day off!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview Card */}
      {crewProfile && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              {/* Rating with circular progress */}
              <div className="flex flex-col items-center rounded-xl bg-gradient-to-b from-gray-50 to-white p-5 border border-gray-100">
                <CircularProgress
                  value={(crewProfile.performanceRating / 5) * 100}
                  size={88}
                  strokeWidth={7}
                  color={crewProfile.performanceRating >= 4 ? 'emerald' : crewProfile.performanceRating >= 3 ? 'amber' : 'red'}
                />
                <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {crewProfile.performanceRating.toFixed(1)} / 5.0
                </p>
                <div className="mt-1">
                  <StarRating rating={crewProfile.performanceRating} size={14} />
                </div>
              </div>

              {/* Experience */}
              <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-gray-50 to-white p-5 border border-gray-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                  <Briefcase className="h-6 w-6 text-violet-600" />
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {crewProfile.experienceYears}
                </p>
                <p className="text-xs text-gray-500">
                  {crewProfile.experienceYears === 1 ? 'Year' : 'Years'} Experience
                </p>
              </div>

              {/* Completion Rate */}
              <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-gray-50 to-white p-5 border border-gray-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(completionRate)}%
                </p>
                <p className="text-xs text-gray-500">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* This Week's Hours Bar Chart */}
      {crewProfile && (
        <WeeklyHoursBarChart crewName={crewProfile.profile?.name || ''} />
      )}

      {/* Passenger Counter + Quick Actions grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PassengerCounter />
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <QuickActions />
        </div>
      </div>

      {/* Quick Status Action Buttons + Weather Impact grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <QuickStatusActions />
        <WeatherImpact />
      </div>

      {/* Digital Trip Manifest + Shift Timer grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DigitalTripManifest crewName={crewProfile?.profile?.name || ''} assignments={assignments} />
        <ShiftTimer />
      </div>

      {/* Break Timer */}
      <BreakTimer />

      {/* End of Day Summary */}
      <EndOfShiftSummary crewName={crewProfile?.profile?.name || ''} />

      {/* Daily Summary Report */}
      <DailySummaryReport crewName={crewProfile?.profile?.name || ''} />

      {/* Shift Handover Notes */}
      <ShiftHandoverNotes crewName={crewProfile?.profile?.name || ''} />

      {/* Route Performance */}
      {crewProfile && (
        <RoutePerformance crewName={crewProfile.profile?.name || ''} />
      )}

      {/* Upcoming Assignments Timeline */}
      {upcomingAssignments.length > 0 && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
            <CardDescription>
              {upcomingAssignments.length} upcoming assignment{upcomingAssignments.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex gap-3 rounded-lg border border-gray-100 dark:border-gray-700 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div className={`h-3 w-3 rounded-full ${
                      assignment.status === 'pending' ? 'bg-yellow-400 ring-2 ring-yellow-100' : 'bg-emerald-400 ring-2 ring-emerald-100'
                    }`} />
                    <div className="w-0.5 h-10 bg-gray-200 mt-1" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        Route {assignment.schedule.route?.routeNumber || '—'}
                      </p>
                      <Badge className={`${getStatusColor(assignment.status)} text-[10px]`}>
                        {capitalize(assignment.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {assignment.schedule.route?.startLocation} → {assignment.schedule.route?.endLocation}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDateShort(assignment.schedule.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {assignment.schedule.departureTime}
                      </span>
                      {assignment.schedule.route?.busRegistration && (
                        <span className="flex items-center gap-1">
                          <Bus className="h-3 w-3" />
                          {assignment.schedule.route.busRegistration}
                        </span>
                      )}
                    </div>
                    <AssignmentPerformanceBadge assignmentId={assignment.id} />
                  </div>
                  {/* Action buttons */}
                  {assignment.status === 'pending' && (
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        className="h-7 bg-emerald-600 text-white hover:bg-emerald-700 px-2 text-xs"
                        onClick={() => onRespond(assignment.id, 'accepted')}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-red-600 border-red-300 hover:bg-red-50 px-2 text-xs"
                        onClick={() => onRespond(assignment.id, 'declined')}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────── New Feature: Quick Status Action Buttons ────────────────────────────

function QuickStatusActions() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const handleClockIn = () => {
    toast({
      title: 'Clocked In',
      description: `Clocked in at ${timeStr}`,
    });
  };

  const handleTakeBreak = () => {
    toast({
      title: 'Break Started',
      description: 'Break started',
    });
  };

  const handleClockOut = () => {
    toast({
      title: 'Clocked Out',
      description: `Clocked out at ${timeStr}`,
    });
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Quick Status
        </CardTitle>
        <CardDescription>Manage your shift status quickly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="btn-press w-full justify-start gap-3 bg-emerald-600 text-white hover:bg-emerald-700 h-11"
          onClick={handleClockIn}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Clock In</p>
            <p className="text-[10px] opacity-80">Start your shift</p>
          </div>
        </Button>
        <Button
          className="w-full justify-start gap-3 bg-amber-500 text-white hover:bg-amber-600 h-11"
          onClick={handleTakeBreak}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/20">
            <Coffee className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Take Break</p>
            <p className="text-[10px] opacity-80">Start a short break</p>
          </div>
        </Button>
        <Button
          className="btn-press w-full justify-start gap-3 bg-red-600 text-white hover:bg-red-700 h-11"
          onClick={handleClockOut}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
            <LogOut className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Clock Out</p>
            <p className="text-[10px] opacity-80">End your shift</p>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── New Feature: Weather Impact Card ────────────────────────────

function WeatherImpact() {
  const weatherData = useMemo(() => {
    // Deterministic weather based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const conditions: {
      type: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy';
      icon: typeof SunIcon;
      temp: number;
      impact: 'No Impact' | 'Minor Delays' | 'Moderate Delays' | 'Severe Delays';
      impactColor: string;
      impactBg: string;
      impactBorder: string;
      advisory: string;
      windSpeed: number;
      humidity: number;
    }[] = [
      {
        type: 'Sunny',
        icon: SunIcon,
        temp: 34,
        impact: 'No Impact',
        impactColor: 'text-emerald-700 dark:text-emerald-300',
        impactBg: 'bg-emerald-50 dark:bg-emerald-900/30',
        impactBorder: 'border-emerald-200 dark:border-emerald-800',
        advisory: 'Clear skies. Normal operations expected throughout the day.',
        windSpeed: 12,
        humidity: 35,
      },
      {
        type: 'Cloudy',
        icon: Cloud,
        temp: 28,
        impact: 'Minor Delays',
        impactColor: 'text-amber-700 dark:text-amber-300',
        impactBg: 'bg-amber-50 dark:bg-amber-900/30',
        impactBorder: 'border-amber-200 dark:border-amber-800',
        advisory: 'Overcast conditions. Expect minor delays on some routes.',
        windSpeed: 20,
        humidity: 55,
      },
      {
        type: 'Rainy',
        icon: CloudRain,
        temp: 24,
        impact: 'Moderate Delays',
        impactColor: 'text-orange-700 dark:text-orange-300',
        impactBg: 'bg-orange-50 dark:bg-orange-900/30',
        impactBorder: 'border-orange-200 dark:border-orange-800',
        advisory: 'Heavy rainfall. Reduce speed and maintain safe distance. Moderate delays expected.',
        windSpeed: 28,
        humidity: 82,
      },
      {
        type: 'Stormy',
        icon: CloudLightning,
        temp: 22,
        impact: 'Severe Delays',
        impactColor: 'text-red-700 dark:text-red-300',
        impactBg: 'bg-red-50 dark:bg-red-900/30',
        impactBorder: 'border-red-200 dark:border-red-800',
        advisory: 'Severe weather alert! Exercise extreme caution. Significant delays expected.',
        windSpeed: 45,
        humidity: 92,
      },
    ];

    // Use day of year to deterministically pick weather
    const idx = dayOfYear % conditions.length;
    const condition = conditions[idx];

    // Add some variation to temperature based on month
    const month = today.getMonth();
    const tempVariation = month >= 3 && month <= 8 ? 4 : -2; // Summer is hotter
    const finalTemp = condition.temp + tempVariation;

    return { ...condition, temp: finalTemp };
  }, []);

  const WeatherIcon = weatherData.icon;

  return (
    <Card className={`rounded-xl shadow-sm border ${weatherData.impactBorder} ${weatherData.type === 'Sunny' ? 'weather-bg-sunny' : weatherData.type === 'Cloudy' ? 'weather-bg-cloudy' : weatherData.type === 'Rainy' ? 'weather-bg-rainy' : 'weather-bg-stormy'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="h-5 w-5 text-sky-500" />
            Weather Impact
          </CardTitle>
          <Badge className={`${weatherData.impactBg} ${weatherData.impactColor} ${weatherData.impactBorder} border text-xs font-semibold`}>
            {weatherData.impact}
          </Badge>
        </div>
        <CardDescription>Current conditions affecting routes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          {/* Weather icon + temperature */}
          <div className="flex flex-col items-center shrink-0">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${weatherData.impactBg}`}>
              <WeatherIcon className={`h-7 w-7 ${
                weatherData.type === 'Sunny' ? 'text-amber-500' :
                weatherData.type === 'Cloudy' ? 'text-gray-400' :
                weatherData.type === 'Rainy' ? 'text-sky-500' :
                'text-violet-500'
              }`} />
            </div>
            <p className="mt-1.5 text-xl font-bold text-foreground">{weatherData.temp}°C</p>
            <p className="text-[10px] text-muted-foreground">{weatherData.type}</p>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Thermometer className="h-3.5 w-3.5" />
                <span>Feels like {weatherData.temp + 2}°C</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Droplets className="h-3.5 w-3.5 text-sky-400" />
                <span>{weatherData.humidity}% humidity</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wind className="h-3.5 w-3.5" />
                <span>{weatherData.windSpeed} km/h wind</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Navigation className="h-3.5 w-3.5" />
                <span>Roads: {
                  weatherData.impact === 'No Impact' ? 'Good' :
                  weatherData.impact === 'Minor Delays' ? 'Fair' :
                  weatherData.impact === 'Moderate Delays' ? 'Poor' : 'Hazardous'
                }</span>
              </div>
            </div>

            {/* Advisory */}
            <div className={`rounded-lg px-3 py-2 text-xs ${weatherData.impactBg} ${weatherData.impactColor}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="font-medium">{weatherData.advisory}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────── Assignments Page ────────────────────────────

function AssignmentsPage({
  assignments,
  crewProfile,
  onRespond,
  loading,
}: {
  assignments: AssignmentData[];
  crewProfile: CrewProfileData | null;
  onRespond: (assignmentId: string, status: string) => void;
  loading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('');
  const [delayAssignmentId, setDelayAssignmentId] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleReportDelay = (assignmentId: string) => {
    setDelayAssignmentId(assignmentId);
    setDelayReason('');
    setDelayDialogOpen(true);
  };

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const handleSubmitDelay = () => {
    if (!delayReason) return;
    toast({ title: 'Delay Reported', description: `Delay reason: ${delayReason}. Dispatch has been notified.` });
    setDelayDialogOpen(false);
  };

  // Time-based grouping for upcoming assignments
  const upcomingAll = assignments.filter((a) => {
    const isUpcoming =
      (a.status === 'pending' || a.status === 'accepted') &&
      isFutureDate(a.schedule.date);
    return isUpcoming;
  });

  const todayUpcoming = upcomingAll.filter((a) => isToday(a.schedule.date));
  const tomorrowUpcoming = upcomingAll.filter((a) => isTomorrow(a.schedule.date));
  const thisWeekUpcoming = upcomingAll.filter((a) => isThisWeek(a.schedule.date) && !isTomorrow(a.schedule.date));
  const laterUpcoming = upcomingAll.filter((a) => !isToday(a.schedule.date) && !isTomorrow(a.schedule.date) && !isThisWeek(a.schedule.date));

  // Apply status filter
  const filterGroup = (group: AssignmentData[]) => {
    if (statusFilter === 'all') return group;
    return group.filter((a) => a.status === statusFilter);
  };

  const historyAssignments = assignments.filter(
    (a) => a.status === 'completed' || a.status === 'declined'
  );

  const AssignmentCard = ({ assignment }: { assignment: AssignmentData }) => {
    const [expanded, setExpanded] = useState(false);

    // Deterministic weather for this assignment
    const weatherData = useMemo(() => {
      const weatherTypes = [
        { label: 'Clear', icon: '☀️', tempRange: [28, 38] as const, textColor: 'text-amber-600' },
        { label: 'Partly Cloudy', icon: '⛅', tempRange: [24, 33] as const, textColor: 'text-amber-500' },
        { label: 'Rain', icon: '🌧️', tempRange: [20, 28] as const, textColor: 'text-sky-600' },
        { label: 'Fog', icon: '🌫️', tempRange: [18, 25] as const, textColor: 'text-gray-500' },
      ];
      const idx = getSeededValue(assignment.id + assignment.schedule.date + 'weather', 0, 3);
      const w = weatherTypes[idx];
      const temp = w.tempRange[0] + getSeededValue(assignment.id + 'temp', 0, w.tempRange[1] - w.tempRange[0]);
      return { ...w, temp };
    }, [assignment.id, assignment.schedule.date]);

    const statusBadgeClass = (status: string) => {
      if (status === 'accepted') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      if (status === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200';
      if (status === 'declined') return 'bg-red-100 text-red-700 border-red-200';
      if (status === 'completed') return 'bg-sky-100 text-sky-700 border-sky-200';
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    };
    const statusBorderColor = (status: string) => {
      if (status === 'accepted' || status === 'active') return 'border-l-4 border-l-emerald-400';
      if (status === 'completed') return 'border-l-4 border-l-sky-400';
      if (status === 'pending') return 'border-l-4 border-l-amber-400';
      return 'border-l-4 border-l-gray-300';
    };
    const dist = assignment.schedule.route?.distanceKm || (10 + getSeededValue(assignment.id, 5, 45));
    const travelTime = Math.round(dist / 30 * 60); // approximate minutes
    const travelHrs = Math.floor(travelTime / 60);
    const travelMins = travelTime % 60;
    const travelStr = travelHrs > 0 ? `${travelHrs}h ${travelMins}m` : `${travelMins}m`;

    // Route completion percentage (deterministic)
    const routeCompletion = (() => {
      if (assignment.status === 'completed') return 100;
      if (assignment.status === 'accepted' && isToday(assignment.schedule.date)) return 40 + getSeededValue(assignment.id + 'prog', 0, 50);
      if (assignment.status === 'pending') return 0;
      return getSeededValue(assignment.id + 'prog2', 0, 20);
    })();

    // Estimated arrival time
    const depParts = assignment.schedule.departureTime.split(':');
    const depH = parseInt(depParts[0], 10) || 8;
    const depM = parseInt(depParts[1], 10) || 0;
    const arrivalTotalMin = depH * 60 + depM + travelTime;
    const arrH = Math.floor(arrivalTotalMin / 60) % 24;
    const arrM = arrivalTotalMin % 60;
    const estimatedArrival = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;

    // Route stops for the detail view
    const stops = getStopsForRoute(assignment.id + assignment.schedule.route?.routeNumber || 'route');

    const progressColor = routeCompletion >= 100 ? 'bg-sky-500'
      : routeCompletion >= 40 ? 'bg-emerald-500'
      : 'bg-gray-300';

    return (
    <div className={`rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-all card-lift hover:border-gray-200 dark:hover:border-gray-600 animate-fade-in-up glass-card ${statusBorderColor(assignment.status)}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Status indicator dot */}
            <span className={`relative flex h-2.5 w-2.5 ${assignment.status === 'accepted' || assignment.status === 'active' ? '' : assignment.status === 'pending' ? '' : assignment.status === 'completed' ? '' : ''}`}>
              {assignment.status === 'accepted' || assignment.status === 'active' ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              ) : null}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                assignment.status === 'accepted' || assignment.status === 'active' ? 'bg-emerald-500' :
                assignment.status === 'pending' ? 'bg-amber-500' :
                assignment.status === 'completed' ? 'bg-gray-400' :
                'bg-gray-400'
              }`} />
            </span>
            <Badge className={`${statusBadgeClass(assignment.status)} text-[10px] border`}>
              {capitalize(assignment.status)}
            </Badge>
            {/* Weather indicator */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 ${weatherData.textColor}`}>
              <span>{weatherData.icon}</span>
              <span>{weatherData.label}</span>
              <span>{weatherData.temp}°C</span>
            </span>
          </div>
          {assignment.status !== 'declined' && assignment.status !== 'completed' && (
            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] gap-1 border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400" onClick={() => handleReportDelay(assignment.id)}>
              <AlertTriangle className="h-3 w-3" /> Report Delay
            </Button>
          )}
        </div>
        <RouteMiniVisualization
          start={assignment.schedule.route?.startLocation || 'Unknown'}
          end={assignment.schedule.route?.endLocation || 'Unknown'}
          routeNumber={assignment.schedule.route?.routeNumber || '—'}
        />
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {assignment.schedule.departureTime}
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="h-3 w-3" />
            {travelStr}
          </span>
          <span className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            {dist} km
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="h-3 w-3" />
            ETA {estimatedArrival}
          </span>
        </div>
        {assignment.schedule.route?.busRegistration && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Bus className="h-3 w-3" />
            {assignment.schedule.route.busRegistration}
          </div>
        )}
        {/* Route Completion Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Route Completion</span>
            <span className="text-[10px] font-bold text-gray-600">{routeCompletion}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
              style={{ width: `${routeCompletion}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {formatDateShort(assignment.schedule.date)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-2">
          {assignment.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 bg-emerald-600 text-white hover:bg-emerald-700 px-3 text-xs"
                onClick={() => onRespond(assignment.id, 'accepted')}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 px-3 text-xs"
                onClick={() => onRespond(assignment.id, 'declined')}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Decline
              </Button>
            </div>
          )}
          {assignment.status !== 'pending' && <span />}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10px] gap-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Hide Details' : 'View Details'}
          </Button>
        </div>
        {/* Expanded Route Stops */}
        {expanded && (
          <div className="mt-1 animate-fade-in-up">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Route Stops</p>
              <div className="relative space-y-0">
                {stops.map((stop, i) => (
                  <div key={stop.name} className="flex items-start gap-3 relative">
                    {/* Timeline line */}
                    {i < stops.length - 1 && (
                      <div className="absolute left-[7px] top-[18px] bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                    )}
                    {/* Dot */}
                    <div className={`mt-1 h-[15px] w-[15px] rounded-full border-2 shrink-0 z-10 ${
                      stop.passed
                        ? 'bg-emerald-500 border-emerald-300'
                        : stop.isCurrent
                          ? 'bg-amber-400 border-amber-300 animate-pulse-glow'
                          : 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600'
                    }`} />
                    <div className="pb-3 min-w-0">
                      <p className={`text-xs font-medium ${
                        stop.passed ? 'text-emerald-700 dark:text-emerald-300' : stop.isCurrent ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'
                      }`}>{stop.name}</p>
                      {stop.isCurrent && (
                        <span className="text-[10px] text-amber-500 font-medium">Current stop</span>
                      )}
                      {stop.passed && (
                        <span className="text-[10px] text-emerald-500 font-medium">Passed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  };

  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your route assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-500">Filter:</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pre-Trip Checklist + Quick Communication grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PreTripChecklist crewName={crewProfile?.profile?.name || ''} />
        <QuickCommunication />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAll.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({historyAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingAll.length === 0 ? (
            <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <CalendarIcon className="mb-2 h-10 w-10" />
                  <p className="text-sm">No upcoming assignments</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Today */}
              {filterGroup(todayUpcoming).length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-2 mb-3 w-full text-left group"
                    onClick={() => toggleGroup('today')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-100">Today</h3>
                    <span className="text-xs text-gray-400">({todayUpcoming.length})</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${collapsedGroups.has('today') ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.has('today') && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filterGroup(todayUpcoming).map((a) => (
                        <AssignmentCard key={a.id} assignment={a} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tomorrow */}
              {filterGroup(tomorrowUpcoming).length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-2 mb-3 w-full text-left group"
                    onClick={() => toggleGroup('tomorrow')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-100">Tomorrow</h3>
                    <span className="text-xs text-gray-400">({tomorrowUpcoming.length})</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${collapsedGroups.has('tomorrow') ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.has('tomorrow') && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filterGroup(tomorrowUpcoming).map((a) => (
                        <AssignmentCard key={a.id} assignment={a} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* This Week */}
              {filterGroup(thisWeekUpcoming).length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-2 mb-3 w-full text-left group"
                    onClick={() => toggleGroup('thisweek')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-100">This Week</h3>
                    <span className="text-xs text-gray-400">({thisWeekUpcoming.length})</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${collapsedGroups.has('thisweek') ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.has('thisweek') && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filterGroup(thisWeekUpcoming).map((a) => (
                        <AssignmentCard key={a.id} assignment={a} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Later */}
              {filterGroup(laterUpcoming).length > 0 && (
                <div>
                  <button
                    className="flex items-center gap-2 mb-3 w-full text-left group"
                    onClick={() => toggleGroup('later')}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 dark:text-gray-100">Later</h3>
                    <span className="text-xs text-gray-400">({laterUpcoming.length})</span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 ml-auto transition-transform ${collapsedGroups.has('later') ? '-rotate-90' : ''}`} />
                  </button>
                  {!collapsedGroups.has('later') && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filterGroup(laterUpcoming).map((a) => (
                        <AssignmentCard key={a.id} assignment={a} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              {historyAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle2 className="mb-2 h-10 w-10" />
                  <p className="text-sm">No past assignments yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {assignment.schedule.route?.routeNumber || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDateShort(assignment.schedule.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              {assignment.schedule.departureTime}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(assignment.status)}>
                              {capitalize(assignment.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shift Logbook */}
      <ShiftLogbook crewName={crewProfile?.profile?.name || ''} />

      {/* Report Delay Dialog */}
      <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Report Delay
            </DialogTitle>
            <DialogDescription>Select the reason for the delay</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Delay Reason</Label>
              <Select value={delayReason} onValueChange={setDelayReason}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Traffic">Traffic</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Weather">Weather</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelayDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 text-white hover:bg-amber-700" onClick={handleSubmitDelay} disabled={!delayReason}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────── Calendar Page ────────────────────────────

function CalendarPage({
  assignments,
  crewProfile,
  loading,
}: {
  assignments: AssignmentData[];
  crewProfile: CrewProfileData | null;
  loading: boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayStr = getTodayStr();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build a map of dates to assignments
  const assignmentMap = new Map<string, AssignmentData[]>();
  assignments.forEach((a) => {
    const date = a.schedule.date;
    if (!assignmentMap.has(date)) {
      assignmentMap.set(date, []);
    }
    assignmentMap.get(date)!.push(a);
  });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const getDateStr = (day: number): string => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const selectedAssignments = selectedDate ? assignmentMap.get(selectedDate) || [] : [];

  // Calculate week number for a given day of month (1-based)
  const getWeekNumber = (day: number): number => {
    const dayOfWeek = (firstDayOfMonth + day - 1) % 7; // 0=Sun
    return Math.floor((firstDayOfMonth + day - 1) / 7) + 1;
  };

  // Get total hours for a week
  const getWeekHours = (weekNum: number): number => {
    const weekStart = (weekNum - 1) * 7 - firstDayOfMonth + 1;
    const weekEnd = Math.min(weekStart + 6, daysInMonth);
    let total = 0;
    for (let d = Math.max(weekStart, 1); d <= weekEnd; d++) {
      const ds = getDateStr(d);
      const dayAsgn = assignmentMap.get(ds) || [];
      total += dayAsgn.length * (4 + getSeededValue(ds + (crewProfile?.profile?.name || ''), 2, 5));
    }
    return total;
  };

  // Check if a day-of-week index is a weekend (0=Sun, 6=Sat)
  const isWeekendDay = (dayIndex: number): boolean => dayIndex === 0 || dayIndex === 6;

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your assignments on a monthly calendar
        </p>
      </div>

      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-4 sm:p-6">
          {/* Month Navigation */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              {selectedDate && (
                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 font-medium">
                  Week {getWeekNumber(parseInt(selectedDate.split('-')[2], 10))} — {getWeekHours(getWeekNumber(parseInt(selectedDate.split('-')[2], 10)))}h scheduled
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => { setCurrentMonth(new Date().getMonth()); setCurrentYear(new Date().getFullYear()); setSelectedDate(null); }}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid — 8 columns (week label + 7 days) */}
          <div className="grid grid-cols-8 gap-1">
            {/* Day Headers */}
            <div className="py-2" />
            {dayNames.map((name, i) => (
              <div
                key={name}
                className={`py-2 text-center text-xs font-semibold uppercase tracking-wider ${isWeekendDay(i) ? 'text-amber-500 dark:text-amber-400' : 'text-gray-500'}`}
              >
                {name}
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells with week labels */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateStr(day);
              const dayAssignments = assignmentMap.get(dateStr) || [];
              const count = dayAssignments.length;
              const isTodayCell = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dayOfWeek = (firstDayOfMonth + i) % 7;
              const weekend = isWeekendDay(dayOfWeek);
              const weekNum = getWeekNumber(day);
              const showWeekLabel = dayOfWeek === 0 || i === 0;

              return (
                <React.Fragment key={day}>
                  {/* Week label at the start of each row */}
                  {showWeekLabel && (
                    <div className="flex items-center justify-center self-stretch">
                      <span className="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        W{weekNum}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`
                      aspect-square relative flex flex-col items-center justify-center rounded-lg text-sm transition-all cursor-pointer
                      ${isSelected
                        ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                        : isTodayCell
                          ? 'bg-emerald-100 text-emerald-800 font-bold ring-2 ring-primary ring-offset-2'
                          : count > 0
                            ? 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-600'
                            : weekend
                              ? 'bg-amber-50/50 text-gray-500 hover:bg-amber-50'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <span className="leading-none">{day}</span>
                  {count > 0 && (
                    <div className="mt-0.5 flex items-center gap-0.5">
                      {dayAssignments.filter((a) => parseInt(a.schedule.departureTime.split(':')[0], 10) < 13).length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {dayAssignments.filter((a) => parseInt(a.schedule.departureTime.split(':')[0], 10) >= 13).length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  )}
                </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
              Today
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/50 dark:ring-emerald-800" />
              Accepted
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-900/50 dark:ring-amber-800" />
              Pending
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-200 dark:bg-red-900/50 dark:ring-red-800" />
              Declined
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-emerald-500" />
              Selected
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-sky-100 ring-1 ring-sky-200 dark:bg-sky-900/50 dark:ring-sky-800" />
              Leave
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border-emerald-100">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <CalendarIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {formatDate(selectedDate)}
                </CardTitle>
                <CardDescription>
                  {selectedAssignments.length === 0
                    ? 'No assignments on this day'
                    : `${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Shift Summary Card */}
            <ShiftSummaryCard dateStr={selectedDate} assignments={assignments} crewName={crewProfile?.profile?.name || ''} />

            {/* Enhanced Day Detail */}
            {selectedAssignments.length > 0 && (
              <div className="mt-4 space-y-3">
                {/* Total Hours & Estimated Distance */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 p-3">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-sky-500" />
                      <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                        Total Scheduled: {
                          (() => {
                            const seed = simpleHash(selectedDate + (crewProfile?.profile?.name || ''));
                            let hrs = 0;
                            const morningH = parseInt(selectedAssignments[0]?.schedule.departureTime.split(':')[0] || '0', 10);
                            if (morningH > 0 && morningH < 13) hrs += 4 + (seed % 3) * 0.5;
                            const eveningAsgn = selectedAssignments.find((a) => parseInt(a.schedule.departureTime.split(':')[0], 10) >= 13);
                            if (eveningAsgn) hrs += 3 + (seed % 2) * 0.5;
                            return hrs > 0 ? `${hrs.toFixed(1)}h` : 'N/A';
                          })()
                        }
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 p-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Est. Distance: {selectedAssignments.reduce((s, a) => s + (a.schedule.route?.distanceKm || 15 + getSeededValue(a.id + 'dist', 5, 35)), 0)} km
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shift Summary Line */}
                <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Shift Summary</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                    {selectedAssignments.filter((a) => parseInt(a.schedule.departureTime.split(':')[0], 10) < 13).map((a) => {
                      const endH = parseInt(a.schedule.departureTime.split(':')[0], 10) + 4;
                      return (
                        <span key={a.id} className="flex items-center gap-1">
                          <Sun className="h-3 w-3 text-amber-500" />
                          Morning: {a.schedule.departureTime}-{endH}:00 ({endH - parseInt(a.schedule.departureTime.split(':')[0], 10)}h)
                        </span>
                      );
                    })}
                    {selectedAssignments.filter((a) => parseInt(a.schedule.departureTime.split(':')[0], 10) >= 13).map((a) => {
                      const endH = parseInt(a.schedule.departureTime.split(':')[0], 10) + 5;
                      return (
                        <span key={a.id} className="flex items-center gap-1">
                          <Moon className="h-3 w-3 text-violet-500" />
                          Evening: {a.schedule.departureTime}-{endH % 24}:00 ({endH - parseInt(a.schedule.departureTime.split(':')[0], 10)}h)
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bus Assignments List */}
                {selectedAssignments.some((a) => a.schedule.route?.busRegistration) && (
                  <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Bus Assignments</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAssignments.filter((a) => a.schedule.route?.busRegistration).map((a) => (
                        <span key={a.id} className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <Bus className="h-3 w-3" />
                          {a.schedule.route!.busRegistration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <CalendarIcon className="mb-2 h-8 w-8" />
                <p className="text-sm">No assignment details available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4"
                  >
                    <RouteMiniVisualization
                      start={assignment.schedule.route?.startLocation || 'Unknown'}
                      end={assignment.schedule.route?.endLocation || 'Unknown'}
                      routeNumber={assignment.schedule.route?.routeNumber || '—'}
                    />
                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {assignment.schedule.departureTime}
                        </span>
                        {assignment.schedule.route?.busRegistration && (
                          <span className="flex items-center gap-1">
                            <Bus className="h-3 w-3" />
                            {assignment.schedule.route.busRegistration}
                          </span>
                        )}
                      </div>
                      <Badge className={getStatusColor(assignment.status)}>
                        {capitalize(assignment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────── Leave Requests Page ────────────────────────────

function LeaveRequestsPage({
  userId,
  token,
  holidayRequests,
  loading,
  onRefresh,
}: {
  userId: string;
  token: string;
  holidayRequests: HolidayRequestData[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('sick');

  // Leave balance calculations
  const usedDays = holidayRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => {
      const start = new Date(r.startDate + 'T00:00:00');
      const end = new Date(r.endDate + 'T00:00:00');
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return sum + diffDays;
    }, 0);
  const pendingDays = holidayRequests
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => {
      const start = new Date(r.startDate + 'T00:00:00');
      const end = new Date(r.endDate + 'T00:00:00');
      const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return sum + diffDays;
    }, 0);
  const totalAllowance = 20;
  const availableDays = Math.max(0, totalAllowance - usedDays - pendingDays);

  // Build leave date map for calendar dots - now with type info
  const leaveDateMap = new Map<string, { status: string; type: string }>();
  holidayRequests.forEach((r) => {
    const start = new Date(r.startDate + 'T00:00:00');
    const end = new Date(r.endDate + 'T00:00:00');
    const current = new Date(start);
    const leaveType = r.reason?.toLowerCase().includes('sick') ? 'sick'
      : r.reason?.toLowerCase().includes('vacation') || r.reason?.toLowerCase().includes('holiday') ? 'vacation'
      : r.reason?.toLowerCase().includes('personal') ? 'personal'
      : r.reason?.toLowerCase().includes('emergency') || r.reason?.toLowerCase().includes('urgent') ? 'emergency'
      : 'sick';
    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      leaveDateMap.set(dateStr, { status: r.status, type: leaveType });
      current.setDate(current.getDate() + 1);
    }
  });

  // Calendar mini view for current month
  const now = new Date();
  const calMonth = now.getMonth();
  const calYear = now.getFullYear();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getCalDateStr = (day: number): string => {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getLeaveDotColor = (status: string, type?: string): string => {
    if (type === 'sick') return 'bg-rose-400';
    if (type === 'vacation') return 'bg-sky-400';
    if (type === 'personal') return 'bg-amber-400';
    if (type === 'emergency') return 'bg-red-500';
    switch (status) {
      case 'approved': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-400';
      case 'rejected': return 'bg-red-400';
      default: return 'bg-gray-300';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast({ title: 'Missing dates', description: 'Please select both start and end dates.', variant: 'destructive' });
      return;
    }

    if (endDate < startDate) {
      toast({ title: 'Invalid date range', description: 'End date cannot be before start date.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          crewId: userId,
          startDate,
          endDate,
          reason: `[${capitalize(leaveType)}] ${reason}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Submission failed', description: data.error || 'Failed to submit leave request.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Leave request submitted successfully!' });
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveDialogOpen(false);
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'An error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit and track your leave requests
          </p>
        </div>
        <Button
          onClick={() => setLeaveDialogOpen(true)}
          className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700"
        >
          <Send className="h-4 w-4" />
          Request Leave
        </Button>
      </div>

      {/* Leave Balance Progress Ring */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 glass animate-fade-in-up">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Circular progress ring */}
            <div className="relative shrink-0">
              <svg width="160" height="160" className="-rotate-90">
                {/* Background track */}
                <circle cx="80" cy="80" r={60} fill="none" strokeWidth="14" stroke="#f3f4f6" />
                {/* Used segment (red) */}
                {(() => {
                  const usedPct = (usedDays / totalAllowance) * 100;
                  const usedCircum = 60 * 2 * Math.PI;
                  return (
                    <circle cx="80" cy="80" r={60} fill="none" strokeWidth="14" stroke="#ef4444" strokeOpacity="0.6"
                      strokeDasharray={`${(usedPct / 100) * usedCircum} ${usedCircum}`}
                      strokeLinecap="round"
                    />
                  );
                })()}
                {/* Pending segment (amber) */}
                {(() => {
                  const usedPct = (usedDays / totalAllowance) * 100;
                  const pendingPct = (pendingDays / totalAllowance) * 100;
                  const pendingCircum = 60 * 2 * Math.PI;
                  const pendingOffset = -(usedPct / 100) * pendingCircum;
                  return (
                    <circle cx="80" cy="80" r={60} fill="none" strokeWidth="14" stroke="#f59e0b" strokeOpacity="0.7"
                      strokeDasharray={`${(pendingPct / 100) * pendingCircum} ${pendingCircum}`}
                      strokeDashoffset={pendingOffset}
                      strokeLinecap="round"
                    />
                  );
                })()}
                {/* Available segment (green) */}
                {(() => {
                  const usedPct = (usedDays / totalAllowance) * 100;
                  const pendingPct = (pendingDays / totalAllowance) * 100;
                  const availPct = Math.max(0, 100 - usedPct - pendingPct);
                  const availCircum = 60 * 2 * Math.PI;
                  const availOffset = -((usedPct + pendingPct) / 100) * availCircum;
                  return (
                    <circle cx="80" cy="80" r={60} fill="none" strokeWidth="14" stroke="#10b981"
                      strokeDasharray={`${(availPct / 100) * availCircum} ${availCircum}`}
                      strokeDashoffset={availOffset}
                      strokeLinecap="round"
                    />
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{availableDays}</span>
                <span className="text-[10px] text-gray-400">days available</span>
              </div>
            </div>

            {/* Legend + details */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Leave Balance</h3>
                <p className="text-xs text-gray-400 mt-0.5">{totalAllowance} total days allowance</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{availableDays}</p>
                    <p className="text-[10px] text-gray-400">Available</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{pendingDays}</p>
                    <p className="text-[10px] text-gray-400">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm bg-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{usedDays}</p>
                    <p className="text-[10px] text-gray-400">Used</p>
                  </div>
                </div>
              </div>
              {/* Linear progress bar */}
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div className="bg-red-400 h-full transition-all" style={{ width: `${(usedDays / totalAllowance) * 100}%` }} />
                <div className="bg-amber-500 h-full transition-all" style={{ width: `${(pendingDays / totalAllowance) * 100}%` }} />
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(availableDays / totalAllowance) * 100}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance Card */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="glass-card rounded-xl bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700">{availableDays}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Available Days</p>
            <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(availableDays / totalAllowance) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-xl bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-700">{pendingDays}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Pending Days</p>
            <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(pendingDays / totalAllowance) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card rounded-xl bg-gradient-to-br from-rose-50 to-white border-rose-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 mx-auto mb-2">
              <CheckCircle2 className="h-5 w-5 text-rose-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-rose-700">{usedDays}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Used Days</p>
            <div className="mt-2 h-1.5 bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${(usedDays / totalAllowance) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Breakdown by Type */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            Leave Balance by Type
          </CardTitle>
          <CardDescription>Breakdown across leave categories (20 days total allowance)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { type: 'sick', label: 'Sick Leave', icon: Thermometer, color: 'rose', maxDays: 5, desc: 'For illness or medical appointments' },
              { type: 'vacation', label: 'Vacation', icon: TreePalm, color: 'sky', maxDays: 8, desc: 'Planned holidays and travel' },
              { type: 'personal', label: 'Personal', icon: User, color: 'amber', maxDays: 4, desc: 'Personal errands and matters' },
              { type: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'red', maxDays: 3, desc: 'Urgent family or personal situations' },
            ].map((lt) => {
              const Icon = lt.icon;
              const typeUsed = holidayRequests
                .filter((r) => r.status === 'approved')
                .reduce((sum, r) => {
                  const rType = r.reason?.toLowerCase().includes('sick') ? 'sick'
                    : r.reason?.toLowerCase().includes('vacation') || r.reason?.toLowerCase().includes('holiday') ? 'vacation'
                    : r.reason?.toLowerCase().includes('personal') ? 'personal'
                    : r.reason?.toLowerCase().includes('emergency') || r.reason?.toLowerCase().includes('urgent') ? 'emergency'
                    : 'sick';
                  if (rType !== lt.type) return sum;
                  const start = new Date(r.startDate + 'T00:00:00');
                  const end = new Date(r.endDate + 'T00:00:00');
                  return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                }, 0);
              const typePending = holidayRequests
                .filter((r) => r.status === 'pending')
                .reduce((sum, r) => {
                  const rType = r.reason?.toLowerCase().includes('sick') ? 'sick'
                    : r.reason?.toLowerCase().includes('vacation') || r.reason?.toLowerCase().includes('holiday') ? 'vacation'
                    : r.reason?.toLowerCase().includes('personal') ? 'personal'
                    : r.reason?.toLowerCase().includes('emergency') || r.reason?.toLowerCase().includes('urgent') ? 'emergency'
                    : 'sick';
                  if (rType !== lt.type) return sum;
                  const start = new Date(r.startDate + 'T00:00:00');
                  const end = new Date(r.endDate + 'T00:00:00');
                  return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                }, 0);
              const available = Math.max(0, lt.maxDays - typeUsed - typePending);
              const pct = Math.round((typeUsed / lt.maxDays) * 100);
              return (
                <div key={lt.type} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${lt.color}-100 dark:bg-${lt.color}-900/50`}>
                      <Icon className={`h-4 w-4 text-${lt.color}-600 dark:text-${lt.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{lt.label}</p>
                      <p className="text-[10px] text-gray-400">{lt.desc}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{available}<span className="text-xs font-normal text-gray-400">/{lt.maxDays}</span></span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all bg-${lt.color}-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                    <span>{typeUsed} used</span>
                    {typePending > 0 && <span className="text-amber-500">{typePending} pending</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Mini View with Leave Dots */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            Leave Calendar — {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((name) => (
              <div key={name} className="py-1 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {name}
              </div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`cal-empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getCalDateStr(day);
              const leaveStatus = leaveDateMap.get(dateStr);
              const isTodayCell = dateStr === getTodayStr();
              const leaveType = leaveStatus?.type;
              return (
                <div
                  key={`cal-day-${day}`}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                    isTodayCell
                      ? 'bg-emerald-100 ring-1 ring-emerald-300 font-bold text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="leading-none">{day}</span>
                  {leaveStatus && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${getLeaveDotColor(leaveStatus.status, leaveType)}`} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Approved
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Pending
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Rejected
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Sick
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              Vacation
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Personal
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Emergency
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </div>
            Leave History
          </CardTitle>
          <CardDescription>
            {holidayRequests.length === 0
              ? 'No leave requests yet'
              : `${holidayRequests.length} request${holidayRequests.length > 1 ? 's' : ''} total`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holidayRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle className="mb-2 h-10 w-10" />
              <p className="text-sm">No leave requests found</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {holidayRequests.map((req) => (
                <div
                  key={req.id}
                  className="glass-card rounded-lg p-4 transition-all hover:-translate-y-1 hover:shadow-lg duration-300"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDateShort(req.startDate)} — {formatDateShort(req.endDate)}
                        </span>
                        <Badge className={`${getStatusColor(req.status)} text-[10px]`}>
                          {capitalize(req.status)}
                        </Badge>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{req.reason}</p>
                      )}
                      {/* Status Timeline */}
                      <div className="mt-3">
                        <StatusTimeline
                          status={req.status}
                          createdAt={req.startDate}
                          reviewedAt={req.reviewedAt || undefined}
                          reviewerName={req.reviewedBy || undefined}
                        />
                      </div>
                    </div>
                    {req.reviewedAt && (
                      <div className="text-xs text-gray-400 shrink-0 mt-1 sm:mt-0">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Reviewed {formatDate(req.reviewedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-violet-600" />
              Request Leave
            </DialogTitle>
            <DialogDescription>
              Fill in the details to request time off ({availableDays} days available)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Request Type</Label>
                {/* Visual type selector with icons */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'sick', label: 'Sick Leave', icon: Thermometer, iconColor: 'text-rose-500', bgColor: 'bg-rose-50 border-rose-200', activeBg: 'bg-rose-100 border-rose-400 ring-rose-300', desc: 'Illness / Medical' },
                    { value: 'vacation', label: 'Vacation', icon: TreePalm, iconColor: 'text-sky-500', bgColor: 'bg-sky-50 border-sky-200', activeBg: 'bg-sky-100 border-sky-400 ring-sky-300', desc: 'Holiday / Travel' },
                    { value: 'personal', label: 'Personal', icon: User, iconColor: 'text-amber-500', bgColor: 'bg-amber-50 border-amber-200', activeBg: 'bg-amber-100 border-amber-400 ring-amber-300', desc: 'Personal matters' },
                    { value: 'emergency', label: 'Emergency', icon: AlertTriangle, iconColor: 'text-red-500', bgColor: 'bg-red-50 border-red-200', activeBg: 'bg-red-100 border-red-400 ring-red-300', desc: 'Urgent situations' },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = leaveType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setLeaveType(t.value)}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${isActive ? `${t.activeBg} ring-2` : `${t.bgColor} hover:opacity-80`}`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${t.iconColor}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700'} truncate`}>{t.label}</p>
                          <p className="text-[10px] text-gray-400 truncate">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dialog-leave-start" className="text-sm font-medium">Start Date</Label>
                  <Input
                    id="dialog-leave-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dialog-leave-end" className="text-sm font-medium">End Date</Label>
                  <Input
                    id="dialog-leave-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-leave-reason" className="text-sm font-medium">Reason</Label>
                <Textarea
                  id="dialog-leave-reason"
                  placeholder="Enter the reason for your leave request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLeaveDialogOpen(false)}
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-violet-600 text-white hover:bg-violet-700 gap-1.5"
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────── Fuel Log Page ────────────────────────────

interface FuelEntry {
  id: string;
  date: string;
  odometer: number;
  liters: number;
  costPerLiter: number;
  station: string;
  fuelType: string;
  notes: string;
}

function FuelLogPage({ crewName }: { crewName: string }) {
  const [entries, setEntries] = useState<FuelEntry[]>(() => {
    const now = new Date();
    const seed = simpleHash(crewName);
    const stations = ['HP Petrol Bunk, Indiranagar', 'Indian Oil, Silk Board', 'BPCL, Koramangala', 'Shell, Whitefield', 'IOC, Hebbal', 'HPCL, Electronic City', 'BP, Marathahalli'];
    const fuelTypes = ['Diesel', 'CNG', 'Electric'];
    return Array.from({ length: 9 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (i * 3 + (seed % 2)));
      const odo = 45000 + i * 350 + (seed % 100);
      const lit = 30 + ((seed + i * 7) % 30);
      const fType = fuelTypes[(seed + i) % 3];
      const cpl = fType === 'Diesel' ? 80 + ((seed + i * 3) % 10) : fType === 'CNG' ? 55 + ((seed + i * 3) % 5) : 15 + ((seed + i * 3) % 3);
      const notes = ['Regular refuel', 'After long trip', 'Before shift start', 'Night refuel', 'Full tank refill', 'Route refuel', 'Emergency top-up', 'Scheduled maintenance', 'End of day fill-up'];
      return {
        id: `fuel-${crewName}-${i}`,
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        odometer: odo,
        liters: lit,
        costPerLiter: parseFloat(cpl.toFixed(2)),
        station: stations[(seed + i) % stations.length],
        fuelType: fType,
        notes: notes[i % notes.length],
      };
    });
  });

  const [formDate, setFormDate] = useState(getTodayStr());
  const [formOdometer, setFormOdometer] = useState('');
  const [formLiters, setFormLiters] = useState('');
  const [formCostPerLiter, setFormCostPerLiter] = useState('');
  const [formStation, setFormStation] = useState('');
  const [formFuelType, setFormFuelType] = useState('Diesel');
  const [formNotes, setFormNotes] = useState('');
  const [sortField, setSortField] = useState<keyof FuelEntry>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const thisMonthEntries = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthEntries = entries.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const totalCostThisMonth = thisMonthEntries.reduce((s, e) => s + e.liters * e.costPerLiter, 0);
  const totalCostLastMonth = lastMonthEntries.reduce((s, e) => s + e.liters * e.costPerLiter, 0);

  const sortedByOdo = [...entries].sort((a, b) => a.odometer - b.odometer);
  const efficiencies: number[] = [];
  for (let i = 1; i < sortedByOdo.length; i++) {
    const dist = sortedByOdo[i].odometer - sortedByOdo[i - 1].odometer;
    const eff = dist > 0 && sortedByOdo[i].liters > 0 ? dist / sortedByOdo[i].liters : 0;
    if (eff > 0) efficiencies.push(eff);
  }
  const avgEfficiency = efficiencies.length > 0 ? efficiencies.reduce((s, e) => s + e, 0) / efficiencies.length : 0;
  const totalDistance = entries.length > 0 ? Math.max(...entries.map((e) => e.odometer)) - Math.min(...entries.map((e) => e.odometer)) : 0;
  const monthlyComparison = totalCostLastMonth > 0 ? ((totalCostThisMonth - totalCostLastMonth) / totalCostLastMonth) * 100 : 0;

  const sorted = [...entries].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
  });

  const trendVals: { date: string; eff: number }[] = [];
  for (let i = 1; i < sortedByOdo.length; i++) {
    const dist = sortedByOdo[i].odometer - sortedByOdo[i - 1].odometer;
    const eff = dist > 0 && sortedByOdo[i].liters > 0 ? parseFloat((dist / sortedByOdo[i].liters).toFixed(1)) : null;
    if (eff !== null) trendVals.push({ date: sortedByOdo[i].date, eff });
  }
  const last10 = trendVals.slice(-10);

  const handleAddEntry = () => {
    const odo = parseFloat(formOdometer);
    const lit = parseFloat(formLiters);
    const cpl = parseFloat(formCostPerLiter);
    if (!formDate || isNaN(odo) || isNaN(lit) || isNaN(cpl) || !formStation) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    const newEntry: FuelEntry = {
      id: `fuel-${Date.now()}`,
      date: formDate, odometer: odo, liters: lit, costPerLiter: cpl,
      station: formStation, fuelType: formFuelType, notes: formNotes,
    };
    setEntries((prev) => [newEntry, ...prev]);
    setShowForm(false);
    setFormOdometer(''); setFormLiters(''); setFormCostPerLiter('');
    setFormStation(''); setFormFuelType('Diesel'); setFormNotes('');
    toast({ title: 'Fuel Entry Added', description: `${lit}L ${formFuelType} logged successfully.` });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirmId(null);
    toast({ title: 'Entry Deleted', description: 'Fuel entry has been removed.' });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Odometer', 'Liters', 'Cost/Liter', 'Total Cost', 'Station', 'Fuel Type', 'Notes'];
    const rows = sorted.map((e) => [e.date, e.odometer, e.liters, e.costPerLiter, (e.liters * e.costPerLiter).toFixed(2), e.station, e.fuelType, e.notes]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fuel-log-${getTodayStr()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: 'Fuel log CSV has been downloaded.' });
  };

  const handleSort = (field: keyof FuelEntry) => {
    if (sortField === field) { setSortDir((p) => (p === 'asc' ? 'desc' : 'asc')); } else { setSortField(field); setSortDir('asc'); }
  };

  const chartW = 500; const chartH = 160;
  const padL = 50; const padR = 20; const padT = 20; const padB = 30;
  const plotW = chartW - padL - padR; const plotH = chartH - padT - padB;
  const vals = last10.map((d) => d.eff);
  const minEff = vals.length > 0 ? Math.min(...vals) * 0.9 : 0;
  const maxEff = vals.length > 0 ? Math.max(...vals) * 1.1 : 10;
  const getEffX = (i: number) => vals.length > 1 ? padL + (i / (vals.length - 1)) * plotW : padL + plotW / 2;
  const getEffY = (v: number) => padT + plotH - ((v - minEff) / (maxEff - minEff || 1)) * plotH;
  const effLinePath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getEffX(i)} ${getEffY(v)}`).join(' ');
  const effAreaPath = vals.length > 1 ? effLinePath + ` L ${getEffX(vals.length - 1)} ${padT + plotH} L ${padL} ${padT + plotH} Z` : '';
  const gridVals = [minEff, minEff + (maxEff - minEff) * 0.33, minEff + (maxEff - minEff) * 0.66, maxEff];

  const SortIcon = ({ field }: { field: keyof FuelEntry }) => (
    <ArrowUpDown className={`h-3 w-3 inline ml-0.5 ${sortField === field ? 'text-emerald-600' : 'text-gray-300'}`} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fuel Log</h2>
          <p className="text-sm text-gray-500">Track your fuel consumption and efficiency</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 h-9" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Entry'}
          </Button>
          <Button variant="outline" className="gap-1.5 h-9" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border-emerald-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Add Fuel Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date *</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Odometer (km) *</Label>
                <Input type="number" placeholder="e.g., 45200" value={formOdometer} onChange={(e) => setFormOdometer(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fuel Filled (L) *</Label>
                <Input type="number" placeholder="e.g., 40" value={formLiters} onChange={(e) => setFormLiters(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cost per Liter (₹) *</Label>
                <Input type="number" step="0.01" placeholder="e.g., 85.50" value={formCostPerLiter} onChange={(e) => setFormCostPerLiter(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fuel Station *</Label>
                <Input placeholder="e.g., HP Petrol Bunk" value={formStation} onChange={(e) => setFormStation(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fuel Type</Label>
                <Select value={formFuelType} onValueChange={setFormFuelType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="CNG">CNG</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label className="text-xs font-medium">Notes</Label>
                <Textarea placeholder="Optional notes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="h-16 resize-none" />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 h-9" onClick={handleAddEntry}>
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Fuel Summary Card */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 glass animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Fuel className="h-5 w-5 text-emerald-600" />
            Total Fuel — This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 p-3 text-center hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{thisMonthEntries.reduce((s, e) => s + e.liters, 0).toFixed(1)} L</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Total Liters</p>
            </div>
            <div className="glass-card rounded-lg bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 p-3 text-center hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
              <p className="text-lg font-bold text-sky-700 dark:text-sky-300">₹{totalCostThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Total Cost</p>
            </div>
            <div className="glass-card rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 p-3 text-center hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">₹{(thisMonthEntries.length > 0 ? (totalCostThisMonth / thisMonthEntries.reduce((s, e) => s + e.liters, 0)) : 0).toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Avg Cost/Liter</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SVG Bar Chart — Last 7 entries fuel amounts */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 animate-fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5 text-violet-600" />
            Fuel Amounts (Last {Math.min(7, entries.length)} Entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {entries.slice(0, 7).reverse().map((entry, i) => {
              const maxLit = Math.max(...entries.slice(0, 7).map((e) => e.liters));
              const pct = maxLit > 0 ? (entry.liters / maxLit) * 100 : 0;
              const barColor = entry.liters >= 45 ? 'bg-emerald-500' : entry.liters >= 35 ? 'bg-amber-500' : 'bg-red-400';
              const d = new Date(entry.date + 'T00:00:00');
              const label = `${d.getDate()}/${d.getMonth() + 1}`;
              return (
                <div key={entry.id} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-gray-500 font-semibold">{entry.liters}L</span>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-md relative" style={{ height: '100px' }}>
                    <div className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all ${barColor}`} style={{ height: `${Math.max(pct, 5)}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Fuel Cost (Month)', value: `₹${totalCostThisMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'emerald' },
          { label: 'Avg Efficiency', value: `${avgEfficiency.toFixed(1)} km/L`, icon: TrendingUp, color: 'sky' },
          { label: 'Total Distance', value: `${totalDistance.toLocaleString()} km`, icon: Navigation, color: 'amber' },
          { label: 'Monthly Change', value: `${monthlyComparison >= 0 ? '+' : ''}${monthlyComparison.toFixed(1)}%`, icon: monthlyComparison >= 0 ? ArrowUp : ArrowDown, color: monthlyComparison >= 0 ? 'red' : 'emerald' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl border p-3 bg-gradient-to-br from-${c.color}-50 to-white border-${c.color}-100`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3.5 w-3.5 text-${c.color}-500`} />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{c.label}</span>
              </div>
              <p className={`text-lg font-bold ${c.color === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Efficiency Trend Chart */}
      {vals.length > 1 && (
        <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Efficiency Trend (km/L)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
              <defs>
                <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {gridVals.map((v, i) => (
                <g key={i}>
                  <line x1={padL} y1={getEffY(v)} x2={chartW - padR} y2={getEffY(v)} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 4" />
                  <text x={padL - 5} y={getEffY(v) + 3} textAnchor="end" className="fill-gray-400 text-[9px]">{v.toFixed(1)}</text>
                </g>
              ))}
              {/* Target line at 8 km/L */}
              {8 >= minEff && 8 <= maxEff && (
                <line x1={padL} y1={getEffY(8)} x2={chartW - padR} y2={getEffY(8)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 4" />
              )}
              {8 >= minEff && 8 <= maxEff && (
                <text x={chartW - padR + 2} y={getEffY(8) + 3} className="fill-red-400 text-[8px] font-semibold">Target: 8</text>
              )}
              {effAreaPath && <path d={effAreaPath} fill="url(#effGrad)" />}
              <path d={effLinePath} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {vals.map((v, i) => {
                const barColor = v >= 8 ? '#10b981' : v >= 6 ? '#f59e0b' : '#ef4444';
                const dotColor = v >= 8 ? '#10b981' : v >= 6 ? '#f59e0b' : '#ef4444';
                return (
                  <g key={i}>
                    <circle cx={getEffX(i)} cy={getEffY(v)} r="6" fill={dotColor} fillOpacity="0.08" stroke="none" />
                    <circle cx={getEffX(i)} cy={getEffY(v)} r="4" fill="white" stroke={dotColor} strokeWidth="2" />
                    <title>{`${v.toFixed(1)} km/L${v >= 8 ? ' (Good)' : v >= 6 ? ' (Fair)' : ' (Poor)'}`}</title>
                    <text x={getEffX(i)} y={getEffY(v) - 10} textAnchor="middle" className={`fill-gray-600 text-[9px] font-semibold`}>{v.toFixed(1)}</text>
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>
      )}

      {/* Fuel Log Table */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Fuel className="h-5 w-5 text-gray-500" />
            Fuel Entries ({entries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { field: 'date' as const, label: 'Date' },
                    { field: 'odometer' as const, label: 'Odometer' },
                    { field: 'liters' as const, label: 'Liters' },
                    { field: 'costPerLiter' as const, label: 'Cost/L' },
                    { field: 'station' as const, label: 'Station' },
                    { field: 'fuelType' as const, label: 'Type' },
                  ].map((col) => (
                    <TableHead key={col.field} className="cursor-pointer select-none text-xs" onClick={() => handleSort(col.field)}>
                      <span className="flex items-center gap-0.5">{col.label}<SortIcon field={col.field} /></span>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs">Efficiency</TableHead>
                  <TableHead className="text-xs w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => {
                  const sortedIdx = sortedByOdo.findIndex((e) => e.id === entry.id);
                  let eff: number | null = null;
                  if (sortedIdx > 0) {
                    const dist = sortedByOdo[sortedIdx].odometer - sortedByOdo[sortedIdx - 1].odometer;
                    eff = dist > 0 && entry.liters > 0 ? parseFloat((dist / entry.liters).toFixed(1)) : null;
                  }
                  const effColor = eff !== null ? (eff >= 8 ? 'text-emerald-600' : eff >= 6 ? 'text-amber-600' : 'text-red-600') : '';
                  const typeColor = entry.fuelType === 'Diesel' ? 'bg-amber-100 text-amber-700'
                    : entry.fuelType === 'CNG' ? 'bg-sky-100 text-sky-700'
                    : 'bg-emerald-100 text-emerald-700';
                  const fuelPct = Math.min(100, Math.max(0, (entry.liters / 60) * 100));
                  const fuelLevelColor = fuelPct > 50 ? 'bg-emerald-500' : fuelPct >= 25 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <TableRow key={entry.id} className="transition-colors hover:shadow-[inset_3px_0_0_#10b981]">
                      <TableCell className="text-xs py-2">{formatDateShort(entry.date)}</TableCell>
                      <TableCell className="text-xs py-2 font-mono">{entry.odometer.toLocaleString()}</TableCell>
                      <TableCell className="text-xs py-2 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span>{entry.liters.toFixed(1)}</span>
                          <div className="w-8 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${fuelLevelColor}`} style={{ width: `${fuelPct}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-2 font-mono">₹{entry.costPerLiter.toFixed(2)}</TableCell>
                      <TableCell className="text-xs py-2 max-w-[120px] truncate">{entry.station}</TableCell>
                      <TableCell className="text-xs py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${typeColor}`}>{entry.fuelType}</span>
                      </TableCell>
                      <TableCell className="text-xs py-2 font-mono">{eff !== null ? <span className={effColor} title={eff >= 8 ? 'Good efficiency' : eff >= 6 ? 'Fair efficiency' : 'Poor efficiency'}>{eff} km/L</span> : '—'}</TableCell>
                      <TableCell className="text-xs py-2">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteClick(entry.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Fuel className="h-8 w-8 mb-2" />
              <p className="text-sm">No fuel entries yet</p>
              <p className="text-xs mt-1">Click &quot;Add Entry&quot; to log your first fuel fill</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Fuel Entry
            </DialogTitle>
            <DialogDescription>Are you sure you want to delete this fuel entry? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={() => deleteConfirmId && handleDeleteEntry(deleteConfirmId)}>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────── Profile Page ────────────────────────────

function ProfilePage({
  userId,
  token,
  crewProfile,
  assignments,
  loading,
  onRefresh,
}: {
  userId: string;
  token: string;
  crewProfile: CrewProfileData | null;
  assignments: AssignmentData[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editAvailability, setEditAvailability] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (crewProfile) {
      setEditName(crewProfile.profile.name);
      setEditLicense(crewProfile.licenseNo || '');
      setEditAvailability(crewProfile.availability);
    }
  }, [crewProfile]);

  // Generate performance history (last 7 days completion rate)
  const getPerformanceHistory = () => {
    const days: { label: string; completed: number; total: number; rate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayAssignments = assignments.filter((a) => a.schedule.date === dateStr);
      const completed = dayAssignments.filter((a) => a.status === 'completed').length;
      const total = dayAssignments.length;
      days.push({
        label: dayLabel,
        completed,
        total,
        rate: total > 0 ? (completed / total) * 100 : 0,
      });
    }
    return days;
  };

  // Skills/qualifications based on specialization
  const getSkills = () => {
    const baseSkills = crewProfile?.specialization === 'driver'
      ? ['Heavy Vehicle', 'Defensive Driving']
      : ['Ticketing', 'Passenger Relations'];
    const extraSkills = (crewProfile?.experienceYears ?? 0) >= 5 ? ['Senior Crew', 'Night Routes'] : [];
    const busSkills = crewProfile?.specialization === 'driver' ? ['AC Bus', 'City Routes', 'Highway Routes'] : ['Fare Collection', 'Multi-Language'];
    return [...baseSkills, ...busSkills.slice(0, 2), ...extraSkills];
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          userId,
          name: editName,
          availability: editAvailability,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Update failed', description: data.error || 'Failed to update profile.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setEditModalOpen(false);
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'An error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    if (crewProfile) {
      setEditName(crewProfile.profile.name);
      setEditPhone('');
      setEditLicense(crewProfile.licenseNo || '');
      setEditAvailability(crewProfile.availability);
    }
    setEditModalOpen(true);
  };

  if (loading) return <ProfileSkeleton />;

  if (!crewProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <User className="mb-2 h-10 w-10" />
        <p className="text-sm">Unable to load profile</p>
      </div>
    );
  }

  const perfHistory = getPerformanceHistory();
  const completedCount = assignments.filter((a) => a.status === 'completed').length;
  const totalAssignments = assignments.length;
  const skills = getSkills();

  return (
    <div className="space-y-6">
      {/* Cover Gradient Banner + Avatar (Social Media Style) */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-400 relative">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" className="absolute inset-0">
              <pattern id="profile-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#profile-pattern)" />
            </svg>
          </div>
        </div>
        <CardContent className="p-4 sm:p-6 -mt-14 sm:-mt-16 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar with animated gradient border */}
            <div className="relative shrink-0">
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-1 shadow-lg animate-spin-slow">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-gray-800 text-2xl sm:text-3xl font-bold text-amber-600">
                  {getInitials(crewProfile.profile.name)}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {crewProfile.profile.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <Badge className={getSpecializationColor(crewProfile.specialization)}>
                      {crewProfile.specialization === 'driver' ? (
                        <><Bus className="mr-1 h-3 w-3" />Driver</>
                      ) : (
                        <><User className="mr-1 h-3 w-3" />Conductor</>
                      )}
                    </Badge>
                    <Badge className={getAvailabilityColor(crewProfile.availability)}>
                      {capitalize(crewProfile.availability)}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={openEditModal}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Skills / Qualifications Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="bg-gradient-to-r from-gray-50 to-white border-gray-200 text-gray-600 text-xs px-2.5 py-1 hover:-translate-y-0.5 hover:shadow-sm hover:border-amber-300 hover:text-amber-700 transition-all duration-200"
              >
                <Award className="mr-1 h-3 w-3 text-amber-500" />
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row: Total Trips, Rating, Experience */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
              <Bus className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{completedCount}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Total Trips</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{crewProfile.performanceRating.toFixed(1)}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 mx-auto mb-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{crewProfile.experienceYears}yr</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Experience</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Scorecard */}
      <PerformanceScorecard crewName={crewProfile.profile?.name || ''} />

      {/* Certification Badges */}
      <CertificationBadges crewName={crewProfile.profile?.name || ''} />

      {/* Earnings Tracker */}
      <EarningsTracker crewName={crewProfile.profile?.name || ''} />

      {/* Overtime & Pay Calculator */}
      <OvertimePayCalculator crewName={crewProfile.profile?.name || ''} />

      {/* Performance History (Last 7 Days) */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            Performance History
          </CardTitle>
          <CardDescription>Completion rate over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {perfHistory.map((day) => (
              <div key={day.label} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] text-gray-400">{day.total > 0 ? `${Math.round(day.rate)}%` : '—'}</span>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-md relative" style={{ height: '80px' }}>
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all ${
                      day.rate === 100 ? 'bg-emerald-500' : day.rate > 0 ? 'bg-amber-400' : 'bg-gray-200'
                    }`}
                    style={{ height: `${Math.max(day.rate, day.total > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-500">{day.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            Activity Feed
          </CardTitle>
          <CardDescription>Your recent activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-300 via-amber-300 to-gray-200 dark:from-emerald-700 dark:via-amber-700 dark:to-gray-700" />
            <div className="space-y-0">
              {[
                { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40', desc: 'Completed trip on Route BLR-101', time: '2h ago', detail: 'Majestic → Electronic City' },
                { icon: Star, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/40', desc: 'Received 5-star rating from passenger', time: '4h ago', detail: 'Route BLR-101 morning shift' },
                { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40', desc: 'Leave request approved', time: '1d ago', detail: 'Aug 15-16, 2025 — Personal' },
                { icon: Fuel, color: 'text-sky-500 bg-sky-100 dark:bg-sky-900/40', desc: 'Fuel log submitted — 42L diesel', time: '1d ago', detail: 'Bus KA-01-F-4821' },
                { icon: AlertTriangle, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/40', desc: 'Reported 10-min delay on Route BLR-205', time: '2d ago', detail: 'Traffic congestion at Silk Board' },
                { icon: Award, color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/40', desc: 'Achieved 50 trips milestone this month', time: '3d ago', detail: 'Weekly performance: 94% on-time' },
                { icon: GraduationCap, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40', desc: 'Completed Defensive Driving refresher', time: '5d ago', detail: 'Certificate renewed until Mar 2027' },
                { icon: MessageSquare, color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/40', desc: 'Submitted daily shift report', time: '5d ago', detail: '8h 15m, 145 km, 6 trips' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-4 relative py-3">
                    {/* Icon dot */}
                    <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-gray-800 z-10 shadow-sm ${item.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.desc}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.detail}</p>
                    </div>
                    {/* Timestamp */}
                    <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{item.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card className="glass-card rounded-xl shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{crewProfile.profile.email}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">License No.</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{crewProfile.licenseNo || 'N/A'}</p>
            </div>
            {crewProfile.specialization === 'driver' && crewProfile.busNumber && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</p>
                <p className="text-sm text-gray-900 dark:text-gray-100">{crewProfile.busNumber}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assignments</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{totalAssignments}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Max Daily Hours</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{crewProfile.maxDailyHours}h</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</p>
              <Badge className={getAvailabilityColor(crewProfile.availability)}>
                {capitalize(crewProfile.availability)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-emerald-600" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal and professional information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your full name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-license" className="text-sm font-medium">License Number</Label>
              <Input
                id="edit-license"
                value={editLicense}
                onChange={(e) => setEditLicense(e.target.value)}
                placeholder="Enter your license number"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Availability</Label>
              <Select value={editAvailability} onValueChange={setEditAvailability}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
            >
              {saving ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────── Main Component ────────────────────────────

export default function CrewContent({ portal, userId, token }: Props) {
  const [crewProfile, setCrewProfile] = useState<CrewProfileData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  // Fetch crew profile — fetch all crew and find by profileId
  const fetchCrewProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/crew');
      if (!res.ok) return;
      const data = await res.json();
      const match = (data.crew || []).find(
        (c: CrewProfileData) => c.profileId === userId
      );
      if (match) {
        setCrewProfile(match);
      }
    } catch {
      // silently fail
    }
  }, [userId]);

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedules?crewId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.schedules || []);
      }
    } catch {
      // silently fail
    }
  }, [userId]);

  // Fetch holiday requests
  const fetchHolidays = useCallback(async () => {
    try {
      const res = await fetch(`/api/holidays?crewId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHolidayRequests(data.requests || []);
      }
    } catch {
      // silently fail
    }
  }, [userId]);

  // Load data on mount or when portal/user changes
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCrewProfile(), fetchAssignments(), fetchHolidays()]).finally(
      () => {
        setLoading(false);
      }
    );
  }, [fetchCrewProfile, fetchAssignments, fetchHolidays, portal, userId]);

  // Refresh function
  const refreshData = useCallback(() => {
    fetchCrewProfile();
    fetchAssignments();
    fetchHolidays();
  }, [fetchCrewProfile, fetchAssignments, fetchHolidays]);

  // Respond to assignment
  const handleRespond = async (assignmentId: string, status: string) => {
    setResponding(true);
    try {
      const res = await fetch('/api/crew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          assignmentId,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: 'Action failed', description: data.error || `Failed to ${status} assignment.`, variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: `Assignment ${status} successfully!` });
      fetchAssignments();
    } catch {
      toast({ title: 'Error', description: 'An error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setResponding(false);
    }
  };

  // Guard against rapid toggle availability clicks
  const toggleAvailRef = useRef(false);

  // Toggle availability from dashboard
  const handleToggleAvailability = async (available: boolean) => {
    if (toggleAvailRef.current) return;
    toggleAvailRef.current = true;
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          userId,
          name: crewProfile?.profile?.name || '',
          availability: available ? 'available' : 'unavailable',
        }),
      });

      if (res.ok) {
        toast({ title: 'Availability Updated', description: `You are now ${available ? 'available' : 'unavailable'}.` });
        fetchCrewProfile();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Update Failed', description: data.error || 'Failed to update availability.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update availability. Please try again.', variant: 'destructive' });
    } finally {
      toggleAvailRef.current = false;
    }
  };

  // Render the correct page based on portal
  switch (portal) {
    case 'dashboard':
      return (
        <DashboardPage
          userId={userId}
          token={token}
          crewProfile={crewProfile}
          assignments={assignments}
          onRespond={handleRespond}
          onToggleAvailability={handleToggleAvailability}
          loading={loading || responding}
        />
      );

    case 'assignments':
      return (
        <AssignmentsPage
          assignments={assignments}
          crewProfile={crewProfile}
          onRespond={handleRespond}
          loading={loading || responding}
        />
      );

    case 'calendar':
      return (
        <CalendarPage
          assignments={assignments}
          crewProfile={crewProfile}
          loading={loading}
        />
      );

    case 'holidays':
      return (
        <LeaveRequestsPage
          userId={userId}
          token={token}
          holidayRequests={holidayRequests}
          loading={loading}
          onRefresh={refreshData}
        />
      );

    case 'profile':
      return (
        <ProfilePage
          userId={userId}
          token={token}
          crewProfile={crewProfile}
          assignments={assignments}
          loading={loading}
          onRefresh={refreshData}
        />
      );

    case 'fuelLog':
      return (
        <FuelLogPage crewName={crewProfile?.profile?.name || ''} />
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertCircle className="mb-2 h-10 w-10" />
          <p className="text-sm">Unknown page</p>
        </div>
      );
  }
}
