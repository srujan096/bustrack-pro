import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const status = searchParams.get('status');

  try {
    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const journeys = await db.journey.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { route: true, schedule: true },
      orderBy: { bookingDate: 'desc' },
      take: 100,
    });

    // Get customer spending stats
    let spendingStats: { totalSpent: number; totalTrips: number; avgRating: number } | null = null;
    if (customerId) {
      const completed = await db.journey.findMany({
        where: { customerId, status: 'completed' },
        select: { cost: true, rating: true },
      });
      const totalSpent = completed.reduce((sum, j) => sum + j.cost, 0);
      const rated = completed.filter(j => j.rating);
      const avgRating = rated.length > 0
        ? rated.reduce((sum, j) => sum + (j.rating || 0), 0) / rated.length
        : 0;
      spendingStats = { totalSpent, totalTrips: completed.length, avgRating };
    }

    return NextResponse.json({ journeys, spendingStats });
  } catch (error) {
    console.error('Journeys GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'book') {
      const { customerId, routeId, scheduleId } = body;

      const route = await db.route.findUnique({ where: { id: routeId } });
      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      const existing = await db.journey.findFirst({
        where: { customerId, scheduleId, status: 'planned' },
      });
      if (existing) {
        return NextResponse.json({ error: 'Already booked this schedule' }, { status: 400 });
      }

      const journey = await db.journey.create({
        data: {
          customerId,
          routeId,
          scheduleId,
          status: 'planned',
          cost: route.fare,
        },
      });

      // Create notification
      await db.notification.create({
        data: {
          userId: customerId,
          type: 'success',
          title: 'Booking Confirmed',
          message: `Your journey on route ${route.routeNumber} (${route.startLocation} → ${route.endLocation}) has been booked!`,
        },
      });

      return NextResponse.json({ journey });
    }

    if (body.action === 'cancel') {
      const { id } = body;
      const journey = await db.journey.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return NextResponse.json({ journey });
    }

    if (body.action === 'rate') {
      const { id, rating, feedback } = body;
      const journey = await db.journey.update({
        where: { id },
        data: { rating, feedback: feedback || '' },
      });
      return NextResponse.json({ journey });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Journeys POST error:', error);
    return NextResponse.json({ error: 'Failed to process journey request' }, { status: 500 });
  }
}
