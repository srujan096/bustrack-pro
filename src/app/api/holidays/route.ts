import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const crewId = searchParams.get('crewId');
  const status = searchParams.get('status');

  try {
    const where: Record<string, unknown> = {};
    if (crewId) where.crewId = crewId;
    if (status) where.status = status;

    const requests = await db.holidayRequest.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { crew: { select: { id: true, name: true, email: true } } },
      orderBy: { startDate: 'asc' },
      take: 100,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Holidays GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch holiday requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'create') {
      const { crewId, startDate, endDate, reason } = body;

      // Check for overlapping requests
      const overlapping = await db.holidayRequest.findFirst({
        where: {
          crewId,
          status: { in: ['pending', 'approved'] },
          OR: [
            { startDate: { lte: endDate }, endDate: { gte: startDate } },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json({ error: 'Overlapping holiday request exists' }, { status: 400 });
      }

      const request = await db.holidayRequest.create({
        data: { crewId, startDate, endDate, reason: reason || '' },
      });

      return NextResponse.json({ request });
    }

    if (body.action === 'review') {
      const { id, status, reviewedBy } = body;
      if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const request = await db.holidayRequest.update({
        where: { id },
        data: { status, reviewedBy, reviewedAt: new Date() },
      });

      // Update crew availability if approved
      if (status === 'approved') {
        const holidayReq = await db.holidayRequest.findUnique({ where: { id } });
        if (holidayReq) {
          await db.crewProfile.update({
            where: { profileId: holidayReq.crewId },
            data: { availability: 'on_leave' },
          });

          await db.notification.create({
            data: {
              userId: holidayReq.crewId,
              type: status === 'approved' ? 'success' : 'warning',
              title: `Holiday Request ${status}`,
              message: `Your holiday request from ${holidayReq.startDate} to ${holidayReq.endDate} has been ${status}.`,
            },
          });
        }
      }

      return NextResponse.json({ request });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Holidays POST error:', error);
    return NextResponse.json({ error: 'Failed to process holiday request' }, { status: 500 });
  }
}
