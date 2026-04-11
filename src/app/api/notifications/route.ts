import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const unread = searchParams.get('unread');

  try {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (unread === 'true') where.isRead = false;

    const notifications = await db.notification.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = userId ? await db.notification.count({
      where: { userId, isRead: false },
    }) : 0;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'markRead') {
      const { id } = body;
      await db.notification.update({ where: { id }, data: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'markAllRead') {
      const { userId } = body;
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'create') {
      const { userId, type, title, message } = body;
      const notification = await db.notification.create({
        data: { userId, type, title: title || 'Notification', message: message || '' },
      });
      return NextResponse.json({ notification });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: 'Failed to process notification request' }, { status: 500 });
  }
}
