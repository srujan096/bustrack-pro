import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const routeId = searchParams.get('routeId');
  const date = searchParams.get('date');
  const status = searchParams.get('status');
  const crewId = searchParams.get('crewId');

  try {
    if (id) {
      const schedule = await db.schedule.findUnique({
        where: { id },
        include: { route: true, crewAssignments: { include: { crew: true } } },
      });
      return NextResponse.json({ schedule });
    }

    const where: Record<string, unknown> = {};
    if (routeId) where.routeId = routeId;
    if (date) where.date = date;
    if (status) where.status = status;

    if (crewId) {
      const assignments = await db.crewAssignment.findMany({
        where: { crewId },
        include: { schedule: { include: { route: true } } },
        orderBy: { assignedAt: 'desc' },
      });
      return NextResponse.json({ schedules: assignments });
    }

    const schedules = await db.schedule.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { route: true },
      orderBy: [{ date: 'desc' }, { departureTime: 'asc' }],
      take: 200,
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Schedules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // GENERATE SCHEDULES - Greedy Time-Slot Assignment with Constraint Propagation
    if (body.action === 'generate') {
      const startTime = Date.now();
      const targetDate = body.date || new Date().toISOString().split('T')[0];

      const routes = await db.route.findMany({
        where: { autoScheduleEnabled: true },
      });

      let schedulesCreated = 0;
      let duplicatesSkipped = 0;

      for (const route of routes) {
        const startH = parseInt(route.startTime.split(':')[0]);
        const endH = parseInt(route.endTime.split(':')[0]);
        const freq = route.frequencyMinutes;

        for (let hour = startH; hour < endH; hour++) {
          for (let min = 0; min < 60; min += freq) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

            // Check for duplicates - constraint propagation
            const existing = await db.schedule.findFirst({
              where: { routeId: route.id, date: targetDate, departureTime: timeStr },
            });

            if (existing) {
              duplicatesSkipped++;
              continue;
            }

            await db.schedule.create({
              data: {
                routeId: route.id,
                date: targetDate,
                departureTime: timeStr,
                status: 'scheduled',
              },
            });
            schedulesCreated++;
          }
        }
      }

      const executionTimeMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        schedulesCreated,
        duplicatesSkipped,
        executionTimeMs,
        message: `Generated ${schedulesCreated} schedules for ${targetDate}, skipped ${duplicatesSkipped} duplicates`,
      });
    }

    // CANCEL SCHEDULE
    if (body.action === 'cancel') {
      const { id } = body;
      const schedule = await db.schedule.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return NextResponse.json({ schedule });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Schedules POST error:', error);
    return NextResponse.json({ error: 'Failed to process schedule request' }, { status: 500 });
  }
}
