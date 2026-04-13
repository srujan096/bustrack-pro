import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  try {
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const tickets = await db.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Support tickets GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, category, priority } = body;

    if (!userId || !title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'userId, title, and description are required' },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.create({
      data: {
        userId,
        title: title.trim(),
        description: description.trim(),
        category: category || 'general',
        priority: priority || 'normal',
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Support tickets POST error:', error);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, status } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'ticketId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const ticket = await db.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Support tickets PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update support ticket' }, { status: 500 });
  }
}
