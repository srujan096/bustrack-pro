'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      return 'bg-gray-100 text-gray-800 border-gray-300';
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
      return 'bg-gray-100 text-gray-800 border-gray-300';
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
      return 'bg-gray-100 text-gray-700 border-gray-300';
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
    <Card className="rounded-xl shadow-sm bg-white">
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
        <svg viewBox={`0 0 ${chartWidth} ${totalChartHeight}`} className="w-full" preserveAspectRatio="none">
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
            className={`rounded-xl shadow-sm cursor-pointer border transition-all ${colors.bg} ${colors.hover}`}
            onClick={() => toast({ title: action.message, description: `${action.label} action triggered.` })}
          >
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.iconBg}`}>
                <Icon className={`h-5 w-5 ${colors.iconText}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
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
      <span className="absolute text-sm font-bold text-gray-900">{Math.round(value)}%</span>
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
          <div className="flex-1 border-t border-dashed border-gray-200" />
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            R{routeNumber}
          </Badge>
          <div className="flex-1 border-t border-dashed border-gray-200" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-gray-600 truncate">{end}</span>
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ status, createdAt, reviewedAt }: { status: string; createdAt?: string; reviewedAt?: string }) {
  const steps = [
    { label: 'Submitted', done: true, date: createdAt },
    { label: 'Under Review', done: status === 'approved' || status === 'rejected', date: null },
    { label: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Decision', done: status === 'approved' || status === 'rejected', date: reviewedAt },
  ];

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center min-w-0">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
              step.done
                ? status === 'rejected' && step.label === 'Rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-500 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {step.done ? (
                status === 'rejected' && step.label === 'Rejected' ? (
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
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 mt-[-12px] ${step.done ? 'bg-emerald-400' : 'bg-gray-200'}`} />
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
      {/* Welcome Card */}
      <Card className="rounded-xl shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white text-lg font-bold shrink-0">
                {getInitials(crewProfile?.profile?.name || '')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {crewProfile?.profile?.name || 'Crew Member'}
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-gray-500">
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
            <div className="flex items-center gap-3 rounded-lg bg-white/80 border border-emerald-200 px-4 py-2.5">
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
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <CalendarIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {todayAssignments.length}
                </p>
                <p className="text-xs text-gray-500">Today&apos;s Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {upcomingAssignments.length}
                </p>
                <p className="text-xs text-gray-500">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {completedCount}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                <Star className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  {crewProfile?.performanceRating?.toFixed(1) || '—'}
                </span>
                <p className="text-xs text-gray-500">Performance Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Route Preview */}
      {todayAssignments.length > 0 && (
        <Card className="rounded-xl shadow-sm bg-white">
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
        <Card className="rounded-xl shadow-sm bg-white">
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
        <Card className="rounded-xl shadow-sm bg-white">
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
                <p className="mt-3 text-sm font-semibold text-gray-900">
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
                <p className="mt-3 text-2xl font-bold text-gray-900">
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
                <p className="mt-3 text-2xl font-bold text-gray-900">
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <QuickActions />
      </div>

      {/* Upcoming Assignments Timeline */}
      {upcomingAssignments.length > 0 && (
        <Card className="rounded-xl shadow-sm bg-white">
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
                  className="flex gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
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
                      <p className="font-medium text-sm text-gray-900">
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

  const AssignmentCard = ({ assignment }: { assignment: AssignmentData }) => (
    <div className="rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-gray-200 hover:shadow-sm">
      <div className="flex flex-col gap-3">
        <RouteMiniVisualization
          start={assignment.schedule.route?.startLocation || 'Unknown'}
          end={assignment.schedule.route?.endLocation || 'Unknown'}
          routeNumber={assignment.schedule.route?.routeNumber || '—'}
        />
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
          <span className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {formatDateShort(assignment.schedule.date)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 pt-2">
          <Badge className={getStatusColor(assignment.status)}>
            {capitalize(assignment.status)}
          </Badge>
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
                className="h-7 text-red-600 border-red-300 hover:bg-red-50 px-3 text-xs"
                onClick={() => onRespond(assignment.id, 'declined')}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Decline
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
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
            <Card className="rounded-xl shadow-sm bg-white">
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
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Today</h3>
                    <span className="text-xs text-gray-400">({todayUpcoming.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filterGroup(todayUpcoming).map((a) => (
                      <AssignmentCard key={a.id} assignment={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow */}
              {filterGroup(tomorrowUpcoming).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Tomorrow</h3>
                    <span className="text-xs text-gray-400">({tomorrowUpcoming.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filterGroup(tomorrowUpcoming).map((a) => (
                      <AssignmentCard key={a.id} assignment={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* This Week */}
              {filterGroup(thisWeekUpcoming).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">This Week</h3>
                    <span className="text-xs text-gray-400">({thisWeekUpcoming.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filterGroup(thisWeekUpcoming).map((a) => (
                      <AssignmentCard key={a.id} assignment={a} />
                    ))}
                  </div>
                </div>
              )}

              {/* Later */}
              {filterGroup(laterUpcoming).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400 text-white">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700">Later</h3>
                    <span className="text-xs text-gray-400">({laterUpcoming.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filterGroup(laterUpcoming).map((a) => (
                      <AssignmentCard key={a.id} assignment={a} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-xl shadow-sm bg-white">
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
    </div>
  );
}

// ──────────────────────────── Calendar Page ────────────────────────────

function CalendarPage({
  assignments,
  loading,
}: {
  assignments: AssignmentData[];
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

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          View your assignments on a monthly calendar
        </p>
      </div>

      <Card className="rounded-xl shadow-sm bg-white">
        <CardContent className="p-4 sm:p-6">
          {/* Month Navigation */}
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map((name) => (
              <div
                key={name}
                className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {name}
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = getDateStr(day);
              const dayAssignments = assignmentMap.get(dateStr) || [];
              const count = dayAssignments.length;
              const isTodayCell = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`
                    aspect-square relative flex flex-col items-center justify-center rounded-lg text-sm transition-all cursor-pointer
                    ${isSelected
                      ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                      : isTodayCell
                        ? 'bg-emerald-100 text-emerald-800 font-bold ring-1 ring-emerald-300'
                        : count > 0
                          ? 'bg-gray-50 text-gray-700 font-medium hover:bg-gray-100'
                          : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="leading-none">{day}</span>
                  {count > 0 && (
                    <span className={`mt-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[10px] font-bold leading-none px-1 ${
                      isSelected || isTodayCell
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
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
              <span className="h-3 w-3 rounded bg-gray-100 ring-1 ring-gray-300" />
              Has Assignments
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-emerald-500" />
              Selected
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="rounded-xl shadow-sm bg-white border-emerald-100">
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
            {selectedAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <CalendarIcon className="mb-2 h-8 w-8" />
                <p className="text-sm">No assignments scheduled</p>
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

  // Build leave date map for calendar dots
  const leaveDateMap = new Map<string, string>();
  holidayRequests.forEach((r) => {
    const start = new Date(r.startDate + 'T00:00:00');
    const end = new Date(r.endDate + 'T00:00:00');
    const current = new Date(start);
    while (current <= end) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      leaveDateMap.set(dateStr, r.status);
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

  const getLeaveDotColor = (status: string): string => {
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
          reason,
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
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
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

      {/* Leave Balance Card */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
              <CalendarIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700">{availableDays}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Available Days</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-700">{pendingDays}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Pending Days</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-rose-50 to-white border-rose-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 mx-auto mb-2">
              <CheckCircle2 className="h-5 w-5 text-rose-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-rose-700">{usedDays}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Used Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Mini View with Leave Dots */}
      <Card className="rounded-xl shadow-sm bg-white">
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
              return (
                <div
                  key={`cal-day-${day}`}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                    isTodayCell
                      ? 'bg-emerald-100 ring-1 ring-emerald-300 font-bold text-emerald-800'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="leading-none">{day}</span>
                  {leaveStatus && (
                    <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${getLeaveDotColor(leaveStatus)}`} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
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
          </div>
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card className="rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            My Requests
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
                  className="rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: Date range + reason */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatDateShort(req.startDate)} — {formatDateShort(req.endDate)}
                        </span>
                        <Badge className={`${getStatusColor(req.status)} text-[10px]`}>
                          {capitalize(req.status)}
                        </Badge>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.reason}</p>
                      )}
                      {/* Status Timeline */}
                      <div className="mt-3">
                        <StatusTimeline
                          status={req.status}
                          createdAt={req.startDate}
                          reviewedAt={req.reviewedAt || undefined}
                        />
                      </div>
                    </div>
                    {/* Right: Reviewed info */}
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
    const extraSkills = crewProfile?.experienceYears >= 5 ? ['Senior Crew', 'Night Routes'] : [];
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
      <Card className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="h-32 sm:h-40 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 relative">
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
            {/* Avatar with gradient border */}
            <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-1 shadow-lg shrink-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-2xl sm:text-3xl font-bold text-emerald-600">
                {getInitials(crewProfile.profile.name)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
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
                className="bg-gradient-to-r from-gray-50 to-white border-gray-200 text-gray-600 text-xs px-2.5 py-1"
              >
                <Award className="mr-1 h-3 w-3 text-emerald-500" />
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
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Total Trips</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{crewProfile.performanceRating.toFixed(1)}</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-gradient-to-br from-violet-50 to-white border-violet-100">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 mx-auto mb-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{crewProfile.experienceYears}yr</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Experience</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance History (Last 7 Days) */}
      <Card className="rounded-xl shadow-sm bg-white">
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
                <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: '80px' }}>
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

      {/* Professional Details */}
      <Card className="rounded-xl shadow-sm bg-white">
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
              <p className="text-sm text-gray-900">{crewProfile.profile.email}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">License No.</p>
              <p className="text-sm text-gray-900">{crewProfile.licenseNo || 'N/A'}</p>
            </div>
            {crewProfile.specialization === 'driver' && crewProfile.busNumber && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Number</p>
                <p className="text-sm text-gray-900">{crewProfile.busNumber}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Assignments</p>
              <p className="text-sm text-gray-900">{totalAssignments}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Max Daily Hours</p>
              <p className="text-sm text-gray-900">{crewProfile.maxDailyHours}h</p>
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

  // Toggle availability from dashboard
  const handleToggleAvailability = async (available: boolean) => {
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
        fetchCrewProfile();
      }
    } catch {
      // silently fail
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

    default:
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <AlertCircle className="mb-2 h-10 w-10" />
          <p className="text-sm">Unknown page</p>
        </div>
      );
  }
}
