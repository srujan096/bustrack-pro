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

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'accepted':
      return 'bg-blue-100 text-blue-800 border-blue-300';
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

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
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
  loading,
}: {
  userId: string;
  token: string;
  crewProfile: CrewProfileData | null;
  assignments: AssignmentData[];
  onRespond: (assignmentId: string, status: string) => void;
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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {crewProfile?.profile?.name || 'Crew Member'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s your overview for today — {formatDate(todayStr)}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {upcomingAssignments.length}
                </p>
                <p className="text-xs text-gray-500">Upcoming (7 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                <CheckCircle2 className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {completedCount}
                </p>
                <p className="text-xs text-gray-500">Completed (all time)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-gray-900">
                    {crewProfile?.performanceRating?.toFixed(1) || '—'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Performance Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Assignments */}
      <Card className="rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s Assignments</CardTitle>
          <CardDescription>
            {todayAssignments.length === 0
              ? 'No assignments scheduled for today'
              : `${todayAssignments.length} assignment${todayAssignments.length > 1 ? 's' : ''} for today`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAssignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <CalendarIcon className="mb-2 h-10 w-10" />
              <p className="text-sm">You&apos;re free today. Enjoy your day!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {todayAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Bus className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Route {assignment.schedule.route?.routeNumber || '—'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {assignment.schedule.route?.startLocation} → {assignment.schedule.route?.endLocation}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {assignment.schedule.departureTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getStatusColor(assignment.status)}
                    >
                      {capitalize(assignment.status)}
                    </Badge>
                    {assignment.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() =>
                            onRespond(assignment.id, 'accepted')
                          }
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() =>
                            onRespond(assignment.id, 'declined')
                          }
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
          )}
        </CardContent>
      </Card>

      {/* Performance Rating Card */}
      {crewProfile && (
        <Card className="rounded-xl shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={crewProfile.performanceRating} size={18} />
                  <span className="text-lg font-semibold text-gray-900">
                    {crewProfile.performanceRating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-1">Experience</p>
                <p className="text-lg font-semibold text-gray-900">
                  {crewProfile.experienceYears} {crewProfile.experienceYears === 1 ? 'year' : 'years'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-1">Availability</p>
                <Badge className={getStatusColor(crewProfile.availability === 'available' ? 'accepted' : crewProfile.availability === 'on_leave' ? 'pending' : 'declined')}>
                  {capitalize(crewProfile.availability)}
                </Badge>
              </div>
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

  const upcomingAssignments = assignments.filter((a) => {
    const isUpcoming =
      (a.status === 'pending' || a.status === 'accepted') &&
      isFutureDate(a.schedule.date);
    if (statusFilter === 'all') return isUpcoming;
    return isUpcoming && a.status === statusFilter;
  });

  const historyAssignments = assignments.filter(
    (a) => a.status === 'completed' || a.status === 'declined'
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
            Upcoming ({upcomingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({historyAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card className="rounded-xl shadow-sm bg-white">
            <CardContent className="p-4">
              {upcomingAssignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CalendarIcon className="mb-2 h-10 w-10" />
                  <p className="text-sm">No upcoming assignments</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead className="hidden sm:table-cell">Bus Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingAssignments.map((assignment) => (
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
                          <TableCell className="hidden sm:table-cell">
                            {crewProfile?.busNumber || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(assignment.status)}>
                              {capitalize(assignment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {assignment.status === 'pending' && (
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-7 bg-emerald-600 text-white hover:bg-emerald-700 px-2.5 text-xs"
                                  onClick={() =>
                                    onRespond(assignment.id, 'accepted')
                                  }
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-red-600 border-red-300 hover:bg-red-50 px-2.5 text-xs"
                                  onClick={() =>
                                    onRespond(assignment.id, 'declined')
                                  }
                                >
                                  Decline
                                </Button>
                              </div>
                            )}
                            {assignment.status === 'accepted' && (
                              <span className="text-xs text-gray-400">
                                Scheduled
                              </span>
                            )}
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
        <CardContent className="p-4">
          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between">
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
                className="py-2 text-center text-xs font-medium text-gray-500"
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
              const hasAssignments = assignmentMap.has(dateStr);
              const isTodayCell = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`
                    aspect-square relative flex flex-col items-center justify-center rounded-lg text-sm transition-all
                    ${isTodayCell
                      ? 'bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-300'
                      : isSelected
                        ? 'ring-2 ring-blue-400 bg-blue-50'
                        : hasAssignments
                          ? 'bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100'
                          : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span>{day}</span>
                  {hasAssignments && !isTodayCell && (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                  {hasAssignments && isTodayCell && (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-blue-100 ring-1 ring-blue-300" />
              Today
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300" />
              Has Assignments
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded ring-2 ring-blue-400" />
              Selected
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="rounded-xl shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg">
              Assignments for {formatDate(selectedDate)}
            </CardTitle>
            <CardDescription>
              {selectedAssignments.length === 0
                ? 'No assignments on this day'
                : `${selectedAssignments.length} assignment${selectedAssignments.length > 1 ? 's' : ''}`}
            </CardDescription>
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
                    className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Bus className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Route {assignment.schedule.route?.routeNumber || '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignment.schedule.route?.startLocation} → {assignment.schedule.route?.endLocation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {assignment.schedule.departureTime}
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
      <Card className="rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-gray-500" />
            Submit New Request
          </CardTitle>
          <CardDescription>
            Fill in the details to request time off
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leave-start">Start Date</Label>
                <Input
                  id="leave-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-end">End Date</Label>
                <Input
                  id="leave-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Reason</Label>
              <Textarea
                id="leave-reason"
                placeholder="Enter the reason for your leave request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
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

      {/* My Requests Table */}
      <Card className="rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">My Requests</CardTitle>
          <CardDescription>
            {holidayRequests.length === 0
              ? 'No leave requests yet'
              : `${holidayRequests.length} request${holidayRequests.length > 1 ? 's' : ''} total`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {holidayRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <AlertCircle className="mb-2 h-10 w-10" />
              <p className="text-sm">No leave requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidayRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        {formatDateShort(req.startDate)}
                      </TableCell>
                      <TableCell>
                        {formatDateShort(req.endDate)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                        {req.reason || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(req.status)}>
                          {capitalize(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">
                        {req.reviewedAt
                          ? formatDate(req.reviewedAt)
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
  );
}

// ──────────────────────────── Profile Page ────────────────────────────

function ProfilePage({
  userId,
  token,
  crewProfile,
  loading,
  onRefresh,
}: {
  userId: string;
  token: string;
  crewProfile: CrewProfileData | null;
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProfile',
          token,
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

      {/* Profile Info Card */}
      <Card className="rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-gray-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Full Name</p>
              {editMode ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="max-w-xs"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {crewProfile.profile.name}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">
                {crewProfile.profile.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Specialization</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {crewProfile.specialization === 'driver' ? (
                    <Bus className="mr-1 h-3 w-3" />
                  ) : (
                    <User className="mr-1 h-3 w-3" />
                  )}
                  {capitalize(crewProfile.specialization)}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">License Number</p>
              <p className="text-sm font-medium text-gray-900">
                {crewProfile.licenseNo || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info Card */}
      <Card className="rounded-xl shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            Professional Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Experience</p>
              <p className="text-sm font-medium text-gray-900">
                {crewProfile.experienceYears} {crewProfile.experienceYears === 1 ? 'year' : 'years'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Performance Rating</p>
              <div className="flex items-center gap-2">
                <StarRating rating={crewProfile.performanceRating} size={16} />
                <span className="text-sm font-medium text-gray-900">
                  {crewProfile.performanceRating.toFixed(1)} / 5.0
                </span>
              </div>
            </div>
            {crewProfile.specialization === 'driver' && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Bus Number</p>
                <p className="text-sm font-medium text-gray-900">
                  {crewProfile.busNumber || 'Not assigned'}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Availability</p>
              {editMode ? (
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  className={getStatusColor(
                    crewProfile.availability === 'available'
                      ? 'accepted'
                      : crewProfile.availability === 'on_leave'
                        ? 'pending'
                        : 'declined'
                  )}
                >
                  {capitalize(crewProfile.availability)}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">Max Daily Hours</p>
              <p className="text-sm font-medium text-gray-900">
                {crewProfile.maxDailyHours} hours
              </p>
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

  // Fetch crew profile
  const fetchCrewProfile = useCallback(async () => {
    try {
      // Try fetching as driver first, then conductor
      const specializations = ['driver', 'conductor'];
      for (const spec of specializations) {
        const res = await fetch(`/api/crew?specialization=${spec}`);
        if (!res.ok) continue;
        const data = await res.json();
        const match = (data.crew || []).find(
          (c: CrewProfileData) => c.profileId === userId
        );
        if (match) {
          setCrewProfile(match);
          return;
        }
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
