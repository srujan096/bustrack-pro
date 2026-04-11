import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');
  const days = parseInt(searchParams.get('days') || '7');

  try {
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    const where: Record<string, unknown> = {
      date: { gte: startDate },
    };
    if (routeId) where.routeId = routeId;

    const analytics = await db.routeAnalytics.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { route: { select: { routeNumber: true, startLocation: true, endLocation: true, city: true } } },
      orderBy: [{ date: 'desc' }, { revenue: 'desc' }],
      take: 200,
    });

    // Aggregate stats
    const totalRevenue = analytics.reduce((sum, a) => sum + a.revenue, 0);
    const avgCompletionRate = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.completionRate, 0) / analytics.length
      : 0;
    const avgDelay = analytics.length > 0
      ? Math.round(analytics.reduce((sum, a) => sum + a.delayMin, 0) / analytics.length)
      : 0;
    const totalJourneys = analytics.reduce((sum, a) => sum + a.totalJourneys, 0);

    // Daily trend for charts
    const dailyTrend = analytics.reduce((acc, a) => {
      const existing = acc.find(d => d.date === a.date);
      if (existing) {
        existing.revenue += a.revenue;
        existing.completionRate = (existing.completionRate + a.completionRate) / 2;
        existing.journeys += a.totalJourneys;
        existing.delay = (existing.delay + a.delayMin) / 2;
      } else {
        acc.push({
          date: a.date,
          revenue: a.revenue,
          completionRate: a.completionRate,
          journeys: a.totalJourneys,
          delay: a.delayMin,
        });
      }
      return acc;
    }, [] as { date: string; revenue: number; completionRate: number; journeys: number; delay: number }[]);

    // City-wise breakdown
    const cityBreakdown = analytics.reduce((acc, a) => {
      const city = a.route?.city || 'other';
      if (!acc[city]) acc[city] = { revenue: 0, journeys: 0, routes: new Set<string>() };
      acc[city].revenue += a.revenue;
      acc[city].journeys += a.totalJourneys;
      acc[city].routes.add(a.routeId);
      return acc;
    }, {} as Record<string, { revenue: number; journeys: number; routes: Set<string> }>);

    const cityStats = Object.entries(cityBreakdown).map(([city, data]) => ({
      city,
      revenue: data.revenue,
      journeys: data.journeys,
      routeCount: data.routes.size,
    }));

    // Dashboard overview stats
    const todayStr = new Date().toISOString().split('T')[0];
    const [totalRoutes, totalCrew, activeSchedules, activeAlerts] = await Promise.all([
      db.route.count(),
      db.profile.count({ where: { role: { in: ['driver', 'conductor'] } } }),
      db.schedule.count({ where: { date: todayStr } }),
      db.trafficAlert.count({ where: { resolvedAt: null } }),
    ]);

    return NextResponse.json({
      analytics,
      summary: { totalRevenue, avgCompletionRate, avgDelay, totalJourneys },
      dailyTrend,
      cityStats,
      dashboard: { totalRoutes, totalCrew, activeSchedules, activeAlerts },
    });
  } catch (error) {
    console.error('Route analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
