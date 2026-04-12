import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');
  const unresolved = searchParams.get('unresolved');

  try {
    const where: Record<string, unknown> = {};
    if (routeId) where.routeId = routeId;
    if (unresolved === 'true') where.resolvedAt = null;

    const alerts = await db.trafficAlert.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { route: true, reporter: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Traffic GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch traffic alerts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'create') {
      const { routeId, reporterId, type, severity, delayMinutes, message } = body;
      const alert = await db.trafficAlert.create({
        data: { routeId, reporterId, type, severity, delayMinutes, message: message || `Traffic ${type} reported` },
      });

      // Notify customers with planned journeys on this route
      const plannedJourneys = await db.journey.findMany({
        where: { routeId, status: 'planned' },
        select: { customerId: true },
      });
      const uniqueCustomerIds = [...new Set(plannedJourneys.map(j => j.customerId))];
      for (const customerId of uniqueCustomerIds.slice(0, 20)) {
        await db.notification.create({
          data: {
            userId: customerId,
            type: 'warning',
            title: 'Traffic Alert',
            message: `Traffic ${type} (${severity}) on your route. Expected delay: ${delayMinutes} min.`,
          },
        });
      }

      return NextResponse.json({ alert });
    }

    if (body.action === 'resolve') {
      const { id } = body;
      const alert = await db.trafficAlert.update({
        where: { id },
        data: { resolvedAt: new Date() },
      });
      return NextResponse.json({ alert });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Traffic POST error:', error);
    return NextResponse.json({ error: 'Failed to process traffic request' }, { status: 500 });
  }
}
