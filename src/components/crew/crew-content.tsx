'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowRight,
  Power,
  Shield,
  Briefcase,
  FileText,
  Timer,
} from 'lucide-react';

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

// ──────────────────────────── Reusable Visual Components ────────────────────────────

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      window.alert('Please select both start and end dates.');
      return;
    }

    if (endDate < startDate) {
      window.alert('End date cannot be before start date.');
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
        window.alert(data.error || 'Failed to submit leave request.');
        return;
      }

      window.alert('Leave request submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      onRefresh();
    } catch {
      window.alert('An error occurred. Please try again.');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit and track your leave requests
        </p>
      </div>

      {/* Submit New Request */}
      <Card className="rounded-xl shadow-sm bg-white border-violet-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Send className="h-4 w-4 text-violet-600" />
            </div>
            Submit New Request
          </CardTitle>
          <CardDescription>
            Fill in the details to request time off
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leave-start" className="text-sm font-medium">Start Date</Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-end" className="text-sm font-medium">End Date</Label>
                <Input
                  id="leave-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason" className="text-sm font-medium">Reason</Label>
              <Textarea
                id="leave-reason"
                placeholder="Enter the reason for your leave request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {submitting ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
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
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [availability, setAvailability] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (crewProfile) {
      setName(crewProfile.profile.name);
      setAvailability(crewProfile.availability);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          userId,
          name,
          availability,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        window.alert(data.error || 'Failed to update profile.');
        return;
      }

      window.alert('Profile updated successfully!');
      setEditMode(false);
      onRefresh();
    } catch {
      window.alert('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your crew profile
          </p>
        </div>
        {!editMode && (
          <Button
            variant="outline"
            onClick={() => setEditMode(true)}
            className="gap-1.5"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Card with Avatar */}
      <Card className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardContent className="p-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white border-4 border-white shadow-lg text-2xl font-bold text-emerald-600 shrink-0">
              {getInitials(crewProfile.profile.name)}
            </div>
            <div className="flex-1 min-w-0">
              {editMode ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="max-w-xs h-9 text-lg font-bold"
                />
              ) : (
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {crewProfile.profile.name}
                </h2>
              )}
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
                {crewProfile.licenseNo && (
                  <span className="text-xs text-gray-400">
                    <Shield className="inline h-3 w-3 mr-0.5" />
                    {crewProfile.licenseNo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{crewProfile.performanceRating.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Rating</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 mx-auto mb-2">
              <Briefcase className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{crewProfile.experienceYears}</p>
            <p className="text-xs text-gray-500">Years Exp.</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 mx-auto mb-2">
              <Timer className="h-5 w-5 text-rose-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">{crewProfile.maxDailyHours}h</p>
            <p className="text-xs text-gray-500">Max Daily</p>
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

      {/* Editable Details */}
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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</p>
              {editMode ? (
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getAvailabilityColor(crewProfile.availability)}>
                  {capitalize(crewProfile.availability)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Save Button */}
      {editMode && (
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
          >
            {saving ? (
              <>
                <span className="mr-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditMode(false);
              if (crewProfile) {
                setName(crewProfile.profile.name);
                setAvailability(crewProfile.availability);
              }
            }}
          >
            Cancel
          </Button>
        </div>
      )}
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
        window.alert(data.error || `Failed to ${status} assignment.`);
        return;
      }

      window.alert(`Assignment ${status} successfully!`);
      fetchAssignments();
    } catch {
      window.alert('An error occurred. Please try again.');
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
