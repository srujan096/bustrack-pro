import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── Connecting Routes Types ────────────────────────────────────────────────

interface RouteLeg {
  routeNumber: string;
  from: string;
  to: string;
  durationMin: number;
  fare: number;
}

interface ConnectingRoute {
  leg1: RouteLeg;
  leg2: RouteLeg;
  transferPoint: string;
  totalDurationMin: number;
  totalFare: number;
}

// ─── Helper: parse stopsJson into an array of stop names ────────────────────

function parseStopNames(stopsJson: string, startLocation: string, endLocation: string): string[] {
  try {
    const parsed = JSON.parse(stopsJson || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      const names = parsed
        .map((s: Record<string, unknown>) => (typeof s.name === 'string' ? s.name : String(s)))
        .filter(Boolean);
      // Deduplicate with start/end included
      const all = [startLocation, ...names, endLocation];
      return [...new Set(all)];
    }
  } catch {
    // JSON parse failed, fall back to start/end only
  }
  return [startLocation, endLocation];
}

// ─── Connecting Routes Algorithm ────────────────────────────────────────────

function findConnectingRoutes(
  outgoingRoutes: { id: string; routeNumber: string; startLocation: string; endLocation: string; stopsJson: string; durationMin: number; fare: number }[],
  incomingRoutes: { id: string; routeNumber: string; startLocation: string; endLocation: string; stopsJson: string; durationMin: number; fare: number }[],
  from: string,
  to: string,
): ConnectingRoute[] {
  const results = new Map<string, ConnectingRoute>(); // key: "leg1RouteId-leg2RouteId"

  for (const outgoing of outgoingRoutes) {
    const stopsO = parseStopNames(outgoing.stopsJson, outgoing.startLocation, outgoing.endLocation);

    for (const incoming of incomingRoutes) {
      // Skip the same route
      if (outgoing.id === incoming.id) continue;

      const stopsI = parseStopNames(incoming.stopsJson, incoming.startLocation, incoming.endLocation);
      const fromLower = from.toLowerCase();
      const toLower = to.toLowerCase();

      // Check for common stops (excluding the original from/to to avoid trivial matches)
      for (const stopO of stopsO) {
        const stopOLower = stopO.toLowerCase();
        if (stopOLower === fromLower || stopOLower === toLower) continue;

        for (const stopI of stopsI) {
          if (stopO.toLowerCase() === stopI.toLowerCase()) {
            const key = `${outgoing.id}-${incoming.id}`;
            if (!results.has(key)) {
              results.set(key, {
                leg1: {
                  routeNumber: outgoing.routeNumber,
                  from: outgoing.startLocation,
                  to: outgoing.endLocation,
                  durationMin: outgoing.durationMin,
                  fare: outgoing.fare,
                },
                leg2: {
                  routeNumber: incoming.routeNumber,
                  from: incoming.startLocation,
                  to: incoming.endLocation,
                  durationMin: incoming.durationMin,
                  fare: incoming.fare,
                },
                transferPoint: stopO,
                totalDurationMin: outgoing.durationMin + incoming.durationMin + 10, // 10 min transfer time
                totalFare: outgoing.fare + incoming.fare,
              });
            }
            break; // Only need one transfer point per route pair
          }
        }
      }
    }
  }

  // Sort by total duration (shortest first) and limit to 5
  return [...results.values()]
    .sort((a, b) => a.totalDurationMin - b.totalDurationMin)
    .slice(0, 5);
}

// ─── GET Handler ────────────────────────────────────────────────────────────

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
        { startLocation: { contains: startLocation, mode: 'insensitive' }, endLocation: { contains: endLocation, mode: 'insensitive' } },
        { startLocation: { contains: endLocation, mode: 'insensitive' }, endLocation: { contains: startLocation, mode: 'insensitive' } },
      ];
    } else if (search) {
      where.OR = [
        { routeNumber: { contains: search, mode: 'insensitive' } },
        { startLocation: { contains: search, mode: 'insensitive' } },
        { endLocation: { contains: search, mode: 'insensitive' } },
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

    // ── Connecting Routes (when startLocation and endLocation are both provided) ──
    if (startLocation && endLocation) {
      // Find connecting routes: routes starting at `from` and routes ending at `to`
      const [outgoingRoutes, incomingRoutes] = await Promise.all([
        db.route.findMany({
          where: { startLocation: { contains: startLocation, mode: 'insensitive' } },
        }),
        db.route.findMany({
          where: { endLocation: { contains: endLocation, mode: 'insensitive' } },
        }),
      ]);

      const connecting = findConnectingRoutes(
        outgoingRoutes,
        incomingRoutes,
        startLocation,
        endLocation,
      );

      return NextResponse.json({
        direct: routes,
        connecting,
        total,
        locations: [...locations].sort(),
        cities,
      });
    }

    return NextResponse.json({ routes, total, locations: [...locations].sort(), cities });
  } catch (error) {
    console.error('Routes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

// ─── POST Handler ───────────────────────────────────────────────────────────

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
