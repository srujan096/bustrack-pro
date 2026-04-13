import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const search = searchParams.get('search');

  try {
    const where: Record<string, unknown> = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const profiles = await db.profile.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        crewProfile: {
          select: {
            id: true,
            specialization: true,
            licenseNo: true,
            experienceYears: true,
            performanceRating: true,
            availability: true,
            busNumber: true,
          },
        },
        _count: {
          select: {
            crewAssignments: true,
            journeys: true,
            trafficReports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users: profiles, total: profiles.length });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, approvalStatus } = body;

    if (!userId || !approvalStatus) {
      return NextResponse.json({ error: 'userId and approvalStatus are required' }, { status: 400 });
    }

    const validStatuses = ['approved', 'pending', 'rejected'];
    if (!validStatuses.includes(approvalStatus)) {
      return NextResponse.json({ error: 'Invalid approvalStatus. Must be approved, pending, or rejected' }, { status: 400 });
    }

    const profile = await db.profile.update({
      where: { id: userId },
      data: { approvalStatus },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
      },
    });

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user approval status' }, { status: 500 });
  }
}
