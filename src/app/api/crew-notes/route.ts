import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const crewId = searchParams.get('crewId');
  const date = searchParams.get('date');

  if (!crewId || !date) {
    return NextResponse.json({ error: 'crewId and date are required' }, { status: 400 });
  }

  try {
    const note = await db.crewNote.findUnique({
      where: { crewId_date: { crewId, date } },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('CrewNotes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch crew note' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { crewId, date, content } = body;

    if (!crewId || !date || content === undefined) {
      return NextResponse.json({ error: 'crewId, date, and content are required' }, { status: 400 });
    }

    const note = await db.crewNote.upsert({
      where: { crewId_date: { crewId, date } },
      update: { content },
      create: { crewId, date, content },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('CrewNotes POST error:', error);
    return NextResponse.json({ error: 'Failed to save crew note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || content === undefined) {
      return NextResponse.json({ error: 'id and content are required' }, { status: 400 });
    }

    const note = await db.crewNote.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error('CrewNotes PUT error:', error);
    return NextResponse.json({ error: 'Failed to update crew note' }, { status: 500 });
  }
}
