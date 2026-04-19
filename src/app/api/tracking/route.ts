import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Deterministic hash from string to number (0-1)
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10000) / 10000;
}

// Deterministic seed that changes slowly over time (updates every ~2 min)
function timeSeed(): number {
  return Math.floor(Date.now() / 120000);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'getLiveBuses') {
      const routeIdFilter = body.routeId || null;

      // Fetch routes from database
      const routes = await db.route.findMany({
        take: routeIdFilter ? undefined : 50,
        ...(routeIdFilter ? { where: { id: routeIdFilter } } : {}),
        orderBy: { routeNumber: 'asc' },
      });

      if (!routes || routes.length === 0) {
        return NextResponse.json({ buses: [] });
      }

      const ts = timeSeed();

      // Generate ~20 active buses across different routes
      const buses = routes.slice(0, 25).map((route, idx) => {
        const rHash = hashStr(route.id);
        const routeSeed = (ts * 7 + idx * 13) % 10000 / 10000;

        // Parse stops from JSON
        let stops: { name: string }[] = [];
        try {
          stops = JSON.parse(route.stopsJson || '[]');
        } catch {
          // fallback
        }

        // If no stops, generate from start/end
        if (stops.length < 2) {
          const midCount = Math.max(2, Math.min(6, Math.floor((route.distanceKm || 10) / 5)));
          stops = [{ name: route.startLocation }];
          for (let i = 1; i <= midCount; i++) {
            stops.push({ name: `Stop ${i}` });
          }
          stops.push({ name: route.endLocation });
        }

        // Deterministic current position
        const progress = Math.round(rHash * 70 + routeSeed * 30) % 101;
        const currentStopIdx = Math.floor((progress / 100) * (stops.length - 1));
        const nextStopIdx = Math.min(currentStopIdx + 1, stops.length - 1);

        // Delay: most buses on time, some delayed
        const delaySeed = (rHash * 100 + ts * 3) % 100;
        let delay = 0;
        if (delaySeed > 85) delay = Math.round((delaySeed - 85) * 1.5); // 1-22 min
        if (delaySeed > 95) delay = Math.round((delaySeed - 85) * 2.5); // 25+ min

        // Speed based on traffic level
        const baseSpeeds: Record<string, number[]> = {
          low: [30, 45],
          moderate: [20, 35],
          high: [10, 25],
          severe: [5, 15],
        };
        const traffic = (route.trafficLevel || 'low').toLowerCase();
        const [minSpd, maxSpd] = baseSpeeds[traffic] || baseSpeeds.low;
        const speed = Math.round(minSpd + rHash * (maxSpd - minSpd) + (routeSeed % 1) * 10);

        // Passenger count based on route popularity hash
        const passengers = Math.round(8 + rHash * 30 + routeSeed * 5);

        // Bus number
        const busNumber = `BUS-${String(1000 + idx * 37 + Math.round(rHash * 500)).slice(0, 4)}`;

        return {
          id: `live-${route.id}-${ts}`,
          routeId: route.id,
          routeNumber: route.routeNumber,
          routeName: `${route.startLocation} → ${route.endLocation}`,
          busNumber,
          currentStop: stops[currentStopIdx]?.name || route.startLocation,
          currentStopIndex: currentStopIdx,
          nextStop: stops[nextStopIdx]?.name || route.endLocation,
          nextStopIndex: nextStopIdx,
          totalStops: stops.length,
          progress,
          delay,
          speed: Math.max(0, speed),
          passengers: Math.max(0, Math.min(40, passengers)),
          lastUpdated: new Date().toISOString(),
          city: route.city || 'BLR',
        };
      });

      return NextResponse.json({ buses });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Tracking API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
