import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'analytics';

  try {
    let csv = '';
    let filename = 'export.csv';

    if (type === 'analytics') {
      const analytics = await db.routeAnalytics.findMany({
        orderBy: [{ date: 'desc' }, { revenue: 'desc' }],
        take: 500,
        include: { route: { select: { routeNumber: true, startLocation: true, endLocation: true, city: true } } },
      });

      csv = 'Date,Route,Start,End,City,Completion Rate,Revenue,Delay (min),Total Journeys\n';
      for (const a of analytics) {
        csv += `${a.date},${a.route?.routeNumber || ''},${a.route?.startLocation || ''},${a.route?.endLocation || ''},${a.route?.city || ''},${a.completionRate},${a.revenue},${a.delayMin},${a.totalJourneys}\n`;
      }
      filename = 'route-analytics-export.csv';
    } else if (type === 'routes') {
      const routes = await db.route.findMany({ orderBy: { routeNumber: 'asc' } });
      csv = 'Route Number,Start,End,Distance (km),Duration (min),Fare,Traffic,Auto-Schedule,City\n';
      for (const r of routes) {
        csv += `${r.routeNumber},${r.startLocation},${r.endLocation},${r.distanceKm},${r.durationMin},${r.fare},${r.trafficLevel},${r.autoScheduleEnabled},${r.city}\n`;
      }
      filename = 'routes-export.csv';
    } else if (type === 'crew') {
      const crew = await db.crewProfile.findMany({
        include: { profile: { select: { name: true, email: true } } },
        orderBy: { performanceRating: 'desc' },
      });
      csv = 'Name,Email,Specialization,License,Experience (yrs),Rating,Availability,Bus\n';
      for (const c of crew) {
        csv += `"${c.profile?.name || ''}","${c.profile?.email || ''}",${c.specialization},${c.licenseNo},${c.experienceYears},${c.performanceRating},${c.availability},${c.busNumber}\n`;
      }
      filename = 'crew-export.csv';
    } else if (type === 'journeys') {
      const journeys = await db.journey.findMany({
        orderBy: { bookingDate: 'desc' },
        take: 500,
        include: {
          customer: { select: { name: true, email: true } },
          route: { select: { routeNumber: true, startLocation: true, endLocation: true } },
          schedule: { select: { date: true, departureTime: true, status: true } },
        },
      });
      csv = 'Booking Date,Customer,Route,Start,End,Schedule Date,Departure,Status,Cost ($),Rating,Feedback\n';
      for (const j of journeys) {
        const feedback = (j.feedback || '').replace(/"/g, '""');
        csv += `${j.bookingDate.toISOString().split('T')[0]},"${j.customer?.name || ''}",${j.route?.routeNumber || ''},${j.route?.startLocation || ''},${j.route?.endLocation || ''},${j.schedule?.date || ''},${j.schedule?.departureTime || ''},${j.status},${j.cost},${j.rating || ''},"${feedback}"\n`;
      }
      filename = 'journeys-export.csv';
    } else {
      return NextResponse.json({ error: 'Invalid export type. Use: analytics, routes, crew, journeys' }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
