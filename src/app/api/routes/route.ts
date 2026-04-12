import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const city = searchParams.get('city');
  const search = searchParams.get('search');
  const startLocation = searchParams.get('startLocation');
  const endLocation = searchParams.get('endLocation');
  const mapAvailable = searchParams.get('mapAvailable');
  const autoSchedule = searchParams.get('autoSchedule');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    if (id) {
      const route = await db.route.findUnique({ where: { id } });
      return NextResponse.json({ route });
    }

    const where: Record<string, unknown> = {};
    if (city && city !== 'all') where.city = city;
    if (mapAvailable === 'true') where.mapAvailable = true;
    if (autoSchedule === 'true') where.autoScheduleEnabled = true;
    if (startLocation && endLocation) {
      where.OR = [
        { startLocation: { contains: startLocation }, endLocation: { contains: endLocation } },
        { startLocation: { contains: endLocation }, endLocation: { contains: startLocation } },
      ];
    } else if (search) {
      where.OR = [
        { routeNumber: { contains: search } },
        { startLocation: { contains: search } },
        { endLocation: { contains: search } },
      ];
    }

    const [routes, total] = await Promise.all([
      db.route.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { routeNumber: 'asc' },
      }),
      db.route.count({ where: Object.keys(where).length > 0 ? where : undefined }),
    ]);

    // Get unique locations for search dropdowns
    const allRoutes = await db.route.findMany({ select: { startLocation: true, endLocation: true, city: true } });
    const locations = new Set<string>();
    allRoutes.forEach(r => { locations.add(r.startLocation); locations.add(r.endLocation); });
    const cities = [...new Set(allRoutes.map(r => r.city))];

    return NextResponse.json({ routes, total, locations: [...locations].sort(), cities });
  } catch (error) {
    console.error('Routes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { routeNumber, startLocation, endLocation, stopsJson, distanceKm, durationMin, fare, trafficLevel, autoScheduleEnabled, startTime, endTime, frequencyMinutes, busRegistration, city, mapAvailable } = body;

      // Check for duplicate route number
      const existing = await db.route.findUnique({ where: { routeNumber } });
      if (existing) {
        return NextResponse.json({ error: 'Route number already exists' }, { status: 400 });
      }

      const route = await db.route.create({
        data: { routeNumber, startLocation, endLocation, stopsJson: stopsJson || '[]', distanceKm, durationMin, fare, trafficLevel, autoScheduleEnabled: autoScheduleEnabled ?? false, startTime, endTime, frequencyMinutes, busRegistration, city, mapAvailable: mapAvailable ?? true },
      });

      return NextResponse.json({ route });
    }

    if (action === 'update') {
      const { id, ...data } = body;
      const route = await db.route.update({ where: { id }, data });
      return NextResponse.json({ route });
    }

    if (action === 'delete') {
      const { id } = body;
      await db.route.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    if (action === 'toggleSchedule') {
      const { id, autoScheduleEnabled } = body;
      const route = await db.route.update({ where: { id }, data: { autoScheduleEnabled } });
      return NextResponse.json({ route });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Routes POST error:', error);
    return NextResponse.json({ error: 'Failed to process route request' }, { status: 500 });
  }
}
