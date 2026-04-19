import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // CREATE — Save a new broadcast message
    if (action === 'create') {
      const { token, message, type, targetRole } = body;

      if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 });
      }

      const tokenData = verifyToken(token);
      if (!tokenData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!message || !message.trim()) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }

      const validTypes = ['info', 'warning', 'urgent', 'maintenance'];
      const messageType = validTypes.includes(type) ? type : 'info';

      const validRoles = ['all', 'admin', 'driver', 'conductor', 'customer'];
      const messageTargetRole = validRoles.includes(targetRole) ? targetRole : 'all';

      // Look up sender name
      const sender = await db.profile.findUnique({
        where: { id: tokenData.userId },
        select: { name: true },
      });

      const broadcast = await db.broadcastMessage.create({
        data: {
          message: message.trim(),
          type: messageType,
          targetRole: messageTargetRole,
          senderId: tokenData.userId,
          senderName: sender?.name || null,
        },
      });

      return NextResponse.json({ success: true, broadcast });
    }

    // LIST — Return recent broadcast messages (last 50)
    if (action === 'list') {
      const { token } = body;

      if (!token) {
        return NextResponse.json({ error: 'Token required' }, { status: 400 });
      }

      const tokenData = verifyToken(token);
      if (!tokenData) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const broadcasts = await db.broadcastMessage.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return NextResponse.json({ broadcasts });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
