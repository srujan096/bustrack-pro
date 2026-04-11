'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

interface Props {
  portal: string;
  userId: string;
  token: string;
  setPortal: (p: string) => void;
}

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
/*  Star rating component                                              */
/* ------------------------------------------------------------------ */
function StarRating({ rating }: { rating: number }) {
  const stars = [];
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

  useEffect(() => {
    (async () => {
      try {
        const [analyticsData, alertsData] = await Promise.all([
          apiFetch('/api/analytics'),
          apiFetch('/api/traffic?unresolved=true'),
        ]);
        setAnalytics(analyticsData);
        setAlerts(alertsData);
      } catch {
        // Fallback demo data
        setAnalytics({
          totalRoutes: 128,
          totalCrew: 256,
          todaySchedules: 64,
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
        alert('Schedules generated successfully!');
      } else if (action === 'autoAssign') {
        await apiFetch('/api/crew', {
          method: 'POST',
          body: JSON.stringify({ action: 'autoAssign', date: todayStr() }),
        });
        alert('Crew auto-assigned successfully!');
      }
    } catch (err: unknown) {
      alert(`Action failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading('');
    }
  };

  const stats = analytics
    ? [
        {
          label: 'Total Routes',
          value: analytics.totalRoutes ?? 0,
          icon: Route,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
        },
        {
          label: 'Total Crew',
          value: analytics.totalCrew ?? 0,
          icon: Users,
          color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50',
        },
        {
          label: "Today's Schedules",
          value: analytics.todaySchedules ?? 0,
          icon: Calendar,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
        },
        {
          label: 'Active Alerts',
          value: analytics.activeAlerts ?? 0,
          icon: AlertTriangle,
          color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
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
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                      {typeof s.value === 'number'
                        ? s.value.toLocaleString()
                        : s.value}
                    </p>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Play className="size-5" /> Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleAction('generate')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'generate' ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Calendar className="size-4" />
            )}
            Generate Schedules
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction('autoAssign')}
            disabled={!!actionLoading}
          >
            {actionLoading === 'autoAssign' ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <UserCheck className="size-4" />
            )}
            Auto Assign Crew
          </Button>
        </CardContent>
      </Card>

      {/* Recent Traffic Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="size-5 text-amber-500" /> Recent
                Traffic Alerts
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
            <TableSkeleton rows={4} cols={5} />
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 size-10 opacity-20" />
              <p>No active traffic alerts</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.slice(0, 10).map((alert: any) => (
                    <TableRow key={alert.id ?? alert._id}>
                      <TableCell className="font-medium">
                        {alert.routeNumber ?? alert.route ?? '—'}
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
                      <TableCell className="text-muted-foreground">
                        {alert.createdAt
                          ? formatDateTime(alert.createdAt)
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

/* ------------------------------------------------------------------ */
/*  Severity Badge helper                                              */
/* ------------------------------------------------------------------ */
function SeverityBadge({ severity }: { severity?: string }) {
  const s = (severity ?? '').toLowerCase();
  const map: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    high: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
    critical: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200',
  };
  return (
    <Badge variant="outline" className={map[s] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
      {severity ?? 'unknown'}
    </Badge>
  );
}

/* ================================================================== */
/*  Page: Routes                                                       */
/* ================================================================== */
function RoutesPage({ token }: { token: string }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

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
    } catch (err: unknown) {
      alert(`Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setToggling(null);
    }
  };

  const cities = ['BLR', 'DEL', 'MUM', 'HYD', 'CHN', 'KOL', 'PUN', 'JAI'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Route className="size-5" /> Routes Management
          </CardTitle>
          <CardDescription>
            View and manage bus routes across cities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-1.5">Search</Label>
              <Input
                placeholder="Search by route number or name..."
                value={city === '' ? '' : city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Label className="mb-1.5">City</Label>
              <Select value={city} onValueChange={(v) => { setCity(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <TableSkeleton rows={10} cols={7} />
          ) : routes.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Route className="mx-auto mb-2 size-10 opacity-20" />
              <p>No routes found</p>
            </div>
          ) : (
            <>
              <div className="max-h-[500px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route #</TableHead>
                      <TableHead>Start → End</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Fare</TableHead>
                      <TableHead>Traffic</TableHead>
                      <TableHead>Auto-Schedule</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((r: any) => {
                      const id = r.id ?? r._id;
                      return (
                        <TableRow key={id}>
                          <TableCell className="font-medium">
                            {r.routeNumber ?? r.number ?? '—'}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 text-sm">
                              {r.startPoint ?? r.from ?? '—'}
                              <Navigation className="size-3 text-muted-foreground" />
                              {r.endPoint ?? r.to ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {r.distance != null ? `${r.distance} km` : '—'}
                          </TableCell>
                          <TableCell>
                            {r.fare != null ? `₹${r.fare}` : '—'}
                          </TableCell>
                          <TableCell>
                            <TrafficLevelBadge level={r.trafficLevel ?? r.traffic} />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={!!r.autoScheduleEnabled}
                              disabled={toggling === id}
                              onCheckedChange={(checked) => toggleSchedule(id, checked)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
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
    </div>
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
    <Badge variant="outline" className={map[l] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
      {level ?? 'unknown'}
    </Badge>
  );
}

/* ================================================================== */
/*  Page: Schedules                                                    */
/* ================================================================== */
function SchedulesPage({ token }: { token: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const today = todayStr();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/api/schedules?date=${today}`);
      setSchedules(Array.isArray(data) ? data : data.schedules ?? data.data ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await apiFetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify({ action: 'generate', date: today }),
      });
      alert("Today's schedules generated successfully!");
      fetchSchedules();
    } catch (err: unknown) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="size-5" /> Today&apos;s Schedules
              </CardTitle>
              <CardDescription className="mt-1">
                Schedules for{' '}
                <span className="font-medium text-foreground">
                  {formatDate(today)}
                </span>
              </CardDescription>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Play className="size-4" />
              )}
              Generate Today&apos;s Schedules
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={4} />
          ) : schedules.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 size-10 opacity-20" />
              <p>No schedules for today</p>
              <p className="text-sm">Click &quot;Generate&quot; to create schedules</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
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
                  {schedules.map((s: any) => (
                    <TableRow key={s.id ?? s._id}>
                      <TableCell className="font-medium">
                        {s.routeNumber ?? s.route ?? '—'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-muted-foreground" />
                          {s.departureTime ?? s.time ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.busNumber ?? s.bus ?? '—'}
                      </TableCell>
                      <TableCell>
                        <ScheduleStatusBadge status={s.status} />
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

function ScheduleStatusBadge({ status }: { status?: string }) {
  const s = (status ?? '').toLowerCase();
  const map: Record<string, string> = {
    scheduled: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300',
  };
  return (
    <Badge variant="outline" className={map[s] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
      {status ?? 'unknown'}
    </Badge>
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
  const today = todayStr();

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
      alert('Crew auto-assigned successfully!');
      fetchCrew();
    } catch (err: unknown) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            <Button onClick={handleAutoAssign} disabled={assigning}>
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
          {/* Assignment results */}
          {assignResult && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <h4 className="mb-2 font-semibold text-emerald-700 dark:text-emerald-300">
                Assignment Results
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {assignResult.fairnessIndex != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Jain&apos;s Fairness Index</p>
                    <p className="text-lg font-bold">{assignResult.fairnessIndex}</p>
                  </div>
                )}
                {assignResult.assignmentsCreated != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Assignments Created</p>
                    <p className="text-lg font-bold">{assignResult.assignmentsCreated}</p>
                  </div>
                )}
                {assignResult.executionTime != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Execution Time</p>
                    <p className="text-lg font-bold">{assignResult.executionTime}ms</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : crew.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-2 size-10 opacity-20" />
              <p>No crew members found</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
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
                  {crew.map((c: any) => (
                    <TableRow key={c.id ?? c._id}>
                      <TableCell className="font-medium">
                        {c.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            (c.specialization ?? c.role ?? '').toLowerCase() === 'driver'
                              ? 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300'
                              : 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300'
                          }
                        >
                          {c.specialization ?? c.role ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={c.rating ?? 0} />
                      </TableCell>
                      <TableCell>{c.busNumber ?? c.bus ?? '—'}</TableCell>
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
          )}
        </CardContent>
      </Card>
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
      alert('Please fill in all required fields');
      return;
    }
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
      alert('Alert created successfully!');
      setDialogOpen(false);
      setFormData({ routeId: '', type: '', severity: '', delayMinutes: '' });
      fetchData();
    } catch (err: unknown) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    } catch (err: unknown) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setResolving(null);
    }
  };

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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Traffic Alert</DialogTitle>
                  <DialogDescription>
                    Report a new traffic incident on a route
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Route</Label>
                    <Select
                      value={formData.routeId}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, routeId: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((r: any) => {
                          const id = r.id ?? r._id;
                          return (
                            <SelectItem key={id} value={String(id)}>
                              {r.routeNumber ?? r.number ?? id} — {r.startPoint ?? r.from ?? ''} → {r.endPoint ?? r.to ?? ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, type: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="congestion">Congestion</SelectItem>
                        <SelectItem value="road_work">Road Work</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, severity: v }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delay (minutes)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.delayMinutes}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, delayMinutes: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create Alert</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <AlertTriangle className="mx-auto mb-2 size-10 opacity-20" />
              <p>No unresolved traffic alerts</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a: any) => {
                    const id = a.id ?? a._id;
                    const isResolved =
                      (a.status ?? '').toLowerCase() === 'resolved';
                    return (
                      <TableRow key={id} className={isResolved ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          {a.routeNumber ?? a.route ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {a.type ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={a.severity} />
                        </TableCell>
                        <TableCell>
                          {a.delayMinutes != null
                            ? `${a.delayMinutes} min`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isResolved
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            }
                          >
                            {isResolved ? 'Resolved' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.createdAt ? formatDateTime(a.createdAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {!isResolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={resolving === id}
                              onClick={() => handleResolve(id)}
                            >
                              {resolving === id ? (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              Resolve
                            </Button>
                          )}
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

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any>('/api/holidays?status=pending');
      setHolidays(Array.isArray(data) ? data : data.holidays ?? data.data ?? []);
    } catch {
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

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
      alert(`Holiday request ${status} successfully!`);
      // Remove from list after short delay
      setTimeout(() => {
        setHolidays((prev) => prev.filter((h) => (h.id ?? h._id) !== id));
      }, 500);
    } catch (err: unknown) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setReviewing(null);
    }
  };

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
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : holidays.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 size-10 opacity-20" />
              <p>No pending holiday requests</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crew Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((h: any) => {
                    const id = h.id ?? h._id;
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-medium">
                          {h.crewName ?? h.name ?? '—'}
                        </TableCell>
                        <TableCell>{formatDate(h.startDate)}</TableCell>
                        <TableCell>{formatDate(h.endDate)}</TableCell>
                        <TableCell>
                          {(() => {
                            try {
                              const diff =
                                (new Date(h.endDate).getTime() -
                                  new Date(h.startDate).getTime()) /
                                (1000 * 60 * 60 * 24);
                              return `${Math.max(1, Math.round(diff) + 1)}`;
                            } catch {
                              return '—';
                            }
                          })()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {h.reason ?? '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                              disabled={reviewing === id}
                              onClick={() => handleReview(id, 'approved')}
                            >
                              {reviewing === id ? (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50"
                              disabled={reviewing === id}
                              onClick={() => handleReview(id, 'rejected')}
                            >
                              {reviewing === id ? (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <XCircle className="size-3.5" />
                              )}
                              Reject
                            </Button>
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
    </div>
  );
}

/* ================================================================== */
/*  Page: Analytics                                                    */
/* ================================================================== */
function AnalyticsPage({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await apiFetch<any>('/api/analytics?days=7');
        setData(result);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const summaryCards = data
    ? [
        {
          label: 'Total Revenue',
          value: `₹${((data.totalRevenue ?? 0) / 1000).toFixed(1)}K`,
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
        },
        {
          label: 'Avg Completion Rate',
          value: `${(data.avgCompletionRate ?? 0).toFixed(1)}%`,
          icon: TrendingUp,
          color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50',
        },
        {
          label: 'Avg Delay',
          value: `${(data.avgDelay ?? 0).toFixed(1)} min`,
          icon: Timer,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50',
        },
        {
          label: 'Total Journeys',
          value: (data.totalJourneys ?? 0).toLocaleString(),
          icon: Navigation,
          color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50',
        },
      ]
    : [];

  const dailyTrends: { date: string; revenue: number; journeys: number }[] = data?.dailyTrends ?? [];
  const cityBreakdown: { city: string; revenue: number; journeys: number; completionRate: number }[] =
    data?.cityBreakdown ?? [];

  const maxRevenue = Math.max(...dailyTrends.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
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
            <Card key={s.label}>
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

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="size-5" /> Daily Revenue Trend (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              ))}
            </div>
          ) : dailyTrends.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <BarChart3 className="mx-auto mb-2 size-10 opacity-20" />
              <p>No trend data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyTrends.map((d, i) => {
                const pct = (d.revenue / maxRevenue) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm text-muted-foreground">
                      {formatDate(d.date)}
                    </span>
                    <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-muted">
                      <div
                        className="h-full rounded-md bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium text-white mix-blend-difference">
                        ₹{d.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
          ) : cityBreakdown.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No city breakdown data</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded-md border">
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
                  {cityBreakdown.map((c: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{c.city}</TableCell>
                      <TableCell>₹{c.revenue.toLocaleString()}</TableCell>
                      <TableCell>{c.journeys.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${c.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{c.completionRate.toFixed(1)}%</span>
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

  return (
    <div className="space-y-6">
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
            <div className="py-12 text-center text-muted-foreground">
              <Wrench className="mx-auto mb-2 size-10 opacity-20" />
              <p>No maintenance records found</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bus Registration</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Next Service</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r: any) => (
                    <TableRow key={r.id ?? r._id}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <Bus className="size-4 text-muted-foreground" />
                          {r.busRegistration ?? r.registration ?? r.busNumber ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {r.serviceType ?? r.type ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(r.date ?? r.serviceDate)}</TableCell>
                      <TableCell>
                        {r.cost != null ? `₹${r.cost.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell>
                        {r.nextServiceDate
                          ? formatDate(r.nextServiceDate)
                          : '—'}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-muted-foreground">
                        {r.notes ?? '—'}
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

  switch (portal) {
    case 'dashboard':
      return <DashboardPage token={token} setPortal={setPortal} />;
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
    default:
      return <DashboardPage token={token} setPortal={setPortal} />;
  }
}
