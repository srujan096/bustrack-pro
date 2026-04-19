import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const specialization = searchParams.get('specialization');
  const availability = searchParams.get('availability');

  try {
    const where: Record<string, unknown> = {};
    if (specialization) where.specialization = specialization;
    if (availability) where.availability = availability;

    const crewProfiles = await db.crewProfile.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { profile: true },
      orderBy: { performanceRating: 'desc' },
    });

    return NextResponse.json({ crew: crewProfiles });
  } catch (error) {
    console.error('Crew GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch crew' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // AUTO-ASSIGN CREW - Greedy Multi-Criteria Scoring with Jain's Fairness Index
    if (body.action === 'autoAssign') {
      // Rate limit: max 5 calls per 10 seconds per token
      const rateLimitResult = rateLimit(body.token, 'autoAssign', 5, 10000);
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many requests, please wait.' },
          { status: 429 }
        );
      }

      const startTime = Date.now();
      const targetDate = body.date || new Date().toISOString().split('T')[0];

      // Get unassigned schedules
      const schedules = await db.schedule.findMany({
        where: { date: targetDate, status: 'scheduled' },
        include: { route: true, crewAssignments: true },
      });

      const unassignedSchedules = schedules.filter(s => s.crewAssignments.length === 0);
      if (unassignedSchedules.length === 0) {
        return NextResponse.json({
          success: true,
          assignmentsCreated: 0,
          jainsIndex: 1.0,
          avgExperienceScore: 0,
          maxHoursViolations: 0,
          executionTimeMs: Date.now() - startTime,
          message: 'No unassigned schedules found',
        });
      }

      // Get available crew (include experienceYears in query)
      const drivers = await db.crewProfile.findMany({
        where: { specialization: 'driver', availability: 'available' },
        select: {
          id: true,
          profileId: true,
          specialization: true,
          licenseNo: true,
          experienceYears: true,
          performanceRating: true,
          availability: true,
          maxDailyHours: true,
          busNumber: true,
          profile: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      const conductors = await db.crewProfile.findMany({
        where: { specialization: 'conductor', availability: 'available' },
        select: {
          id: true,
          profileId: true,
          specialization: true,
          licenseNo: true,
          experienceYears: true,
          performanceRating: true,
          availability: true,
          maxDailyHours: true,
          busNumber: true,
          profile: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      // Get existing assignments for the date to track hours
      const existingAssignments = await db.crewAssignment.findMany({
        where: {
          schedule: { date: targetDate },
          status: { in: ['accepted', 'pending'] },
        },
      });

      // Count assignments per crew member for Jain's fairness
      const assignmentCounts = new Map<string, number>();
      existingAssignments.forEach(a => {
        assignmentCounts.set(a.crewId, (assignmentCounts.get(a.crewId) || 0) + 1);
      });

      // Track experience scores for averaging
      const allExperienceScores: number[] = [];

      // Calculate Jain's Fairness Index
      function calculateJainsIndex(counts: number[]): number {
        if (counts.length === 0) return 1.0;
        const n = counts.length;
        const sum = counts.reduce((a, b) => a + b, 0);
        const sumSquares = counts.reduce((a, b) => a + b * b, 0);
        if (sum === 0 || sumSquares === 0) return 1.0;
        return (sum * sum) / (n * sumSquares);
      }

      let assignmentsCreated = 0;
      let maxHoursViolations = 0;

      for (const schedule of unassignedSchedules) {
        const routeDurationH = (schedule.route?.durationMin || 60) / 60;

        // Assign driver
        // Score(c) = 0.5 × Fairness(c) + 0.3 × Performance(c) + 0.2 × Experience(c)
        // where Experience(c) = Math.min(experienceYears / 10, 1.0)
        const driverCounts = drivers.map(d => assignmentCounts.get(d.profileId) || 0);
        const driverScores = drivers.map(d => {
          const count = assignmentCounts.get(d.profileId) || 0;
          const fairnessScore = count === Math.min(...driverCounts) ? 1.0 : 0.3;
          const perfScore = d.performanceRating / 5.0;
          const expScore = Math.min(d.experienceYears / 10, 1.0);
          allExperienceScores.push(expScore);
          return 0.5 * fairnessScore + 0.3 * perfScore + 0.2 * expScore;
        });

        const bestDriverIdx = driverScores.indexOf(Math.max(...driverScores));
        if (bestDriverIdx >= 0) {
          const driver = drivers[bestDriverIdx];
          const driverHours = (assignmentCounts.get(driver.profileId) || 0) * 2 + routeDurationH;
          if (driverHours <= driver.maxDailyHours) {
            await db.crewAssignment.create({
              data: {
                scheduleId: schedule.id,
                crewId: driver.profileId,
                status: 'accepted',
              },
            });
            assignmentCounts.set(driver.profileId, (assignmentCounts.get(driver.profileId) || 0) + 1);
            assignmentsCreated++;
          } else {
            maxHoursViolations++;
          }
        }

        // Assign conductor
        // Score(c) = 0.5 × Fairness(c) + 0.3 × Performance(c) + 0.2 × Experience(c)
        const conductorCounts = conductors.map(c => assignmentCounts.get(c.profileId) || 0);
        const conductorScores = conductors.map(c => {
          const count = assignmentCounts.get(c.profileId) || 0;
          const fairnessScore = count === Math.min(...conductorCounts) ? 1.0 : 0.3;
          const perfScore = c.performanceRating / 5.0;
          const expScore = Math.min(c.experienceYears / 10, 1.0);
          allExperienceScores.push(expScore);
          return 0.5 * fairnessScore + 0.3 * perfScore + 0.2 * expScore;
        });

        const bestConductorIdx = conductorScores.indexOf(Math.max(...conductorScores));
        if (bestConductorIdx >= 0) {
          const conductor = conductors[bestConductorIdx];
          const conductorHours = (assignmentCounts.get(conductor.profileId) || 0) * 2 + routeDurationH;
          if (conductorHours <= conductor.maxDailyHours) {
            await db.crewAssignment.create({
              data: {
                scheduleId: schedule.id,
                crewId: conductor.profileId,
                status: 'accepted',
              },
            });
            assignmentCounts.set(conductor.profileId, (assignmentCounts.get(conductor.profileId) || 0) + 1);
            assignmentsCreated++;
          } else {
            maxHoursViolations++;
          }
        }
      }

      const finalCounts = [...assignmentCounts.values()].filter(c => c > 0);
      const jainsIndex = calculateJainsIndex(finalCounts);
      const avgExperienceScore = allExperienceScores.length > 0
        ? allExperienceScores.reduce((a, b) => a + b, 0) / allExperienceScores.length
        : 0;
      const executionTimeMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        assignmentsCreated,
        jainsIndex: Math.round(jainsIndex * 1000) / 1000,
        avgExperienceScore: Math.round(avgExperienceScore * 1000) / 1000,
        maxHoursViolations,
        executionTimeMs,
        message: `Assigned crew for ${unassignedSchedules.length} schedules. Jain's Index: ${jainsIndex.toFixed(3)}, Avg Exp Score: ${avgExperienceScore.toFixed(3)}`,
      });
    }

    // ACCEPT/DECLINE ASSIGNMENT
    if (body.action === 'respond') {
      const { assignmentId, status } = body;
      const updateData: Record<string, unknown> = { status };
      if (status === 'completed') updateData.completedAt = new Date();

      const assignment = await db.crewAssignment.update({
        where: { id: assignmentId },
        data: updateData,
      });
      return NextResponse.json({ assignment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Crew POST error:', error);
    return NextResponse.json({ error: 'Failed to process crew request' }, { status: 500 });
  }
}
