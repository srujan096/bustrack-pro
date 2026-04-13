import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Pre-seed announcements if none exist
async function ensureSeedData() {
  const count = await db.announcement.count();
  if (count === 0) {
    await db.announcement.createMany({
      data: [
        {
          title: 'System Maintenance Notice',
          message: 'BusTrack Pro will undergo scheduled maintenance on Saturday from 2:00 AM to 4:00 AM IST. Services may be briefly unavailable.',
          type: 'warning',
          role: 'all',
          active: true,
        },
        {
          title: 'New Route Launched: R-200 Express',
          message: 'We are excited to announce the launch of R-200 Express connecting Electronic City to Whitefield via Varthur. Check the routes section for schedules.',
          type: 'success',
          role: 'all',
          active: true,
        },
        {
          title: 'Crew Safety Training Mandatory',
          message: 'All drivers and conductors must complete the updated safety training module by end of this month. Contact your supervisor for details.',
          type: 'urgent',
          role: 'driver',
          active: true,
        },
        {
          title: 'Fare Update Effective Next Week',
          message: 'Due to revised operational costs, route fares will be updated starting next Monday. Current bookings remain unaffected.',
          type: 'info',
          role: 'customer',
          active: true,
        },
      ],
    });
    console.log('[Announcements] Seeded 4 default announcements');
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const activeOnly = searchParams.get('active') !== 'false';

    const where: Record<string, unknown> = {};
    if (activeOnly) where.active = true;
    if (role && role !== 'all') {
      where.OR = [
        { role: 'all' },
        { role },
      ];
    } else {
      where.role = 'all';
    }

    const announcements = await db.announcement.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Announcements GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Dismiss action — hides an announcement for the session (client-side)
    if (body.action === 'dismiss') {
      // Dismiss is handled client-side by storing dismissed IDs in localStorage
      // This endpoint confirms the dismiss for analytics purposes
      return NextResponse.json({ success: true, dismissed: body.id });
    }

    // Toggle active status (admin only)
    if (body.action === 'toggle') {
      const { id } = body;
      const announcement = await db.announcement.findUnique({ where: { id } });
      if (!announcement) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
      }
      const updated = await db.announcement.update({
        where: { id },
        data: { active: !announcement.active },
      });
      return NextResponse.json({ announcement: updated });
    }

    // Create new announcement (admin only)
    if (body.action === 'create') {
      const { title, message, type, role, active } = body;

      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
      }

      const validTypes = ['info', 'warning', 'success', 'urgent'];
      if (type && !validTypes.includes(type)) {
        return NextResponse.json({ error: 'Invalid type. Must be: info, warning, success, urgent' }, { status: 400 });
      }

      const validRoles = ['all', 'admin', 'driver', 'conductor', 'customer'];
      if (role && !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role. Must be: all, admin, driver, conductor, customer' }, { status: 400 });
      }

      const announcement = await db.announcement.create({
        data: {
          title,
          message,
          type: type || 'info',
          role: role || 'all',
          active: active !== false,
        },
      });

      return NextResponse.json({ announcement });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Announcements POST error:', error);
    return NextResponse.json({ error: 'Failed to process announcement request' }, { status: 500 });
  }
}
