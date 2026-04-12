import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const records = await db.busMaintenance.findMany({
      orderBy: { date: 'desc' },
      take: 50,
    });

    const upcomingServices = await db.busMaintenance.findMany({
      where: {
        nextServiceDate: { gte: new Date().toISOString().split('T')[0] },
      },
      orderBy: { nextServiceDate: 'asc' },
      take: 20,
    });

    return NextResponse.json({ records, upcomingServices });
  } catch (error) {
    console.error('Maintenance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { busRegistration, serviceType, date, cost, nextServiceDate, notes } = body;

    const record = await db.busMaintenance.create({
      data: { busRegistration, serviceType, date, cost, nextServiceDate: nextServiceDate || '', notes: notes || '' },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Maintenance POST error:', error);
    return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 });
  }
}
