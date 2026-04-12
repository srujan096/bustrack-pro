import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple Exponential Smoothing with Time-of-Day Heuristics
// Base: Sₜ = α × Actualₜ₋₁ + (1-α) × Sₜ₋₁  (α=0.3)
// Adjust: Multiply by time-of-day factor (peak=1.4, off-peak=0.8)
// Fallback: Route median delay if <5 historical points
// Complexity: O(1) per prediction after warm-up

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');

  if (!routeId) {
    return NextResponse.json({ error: 'routeId is required' }, { status: 400 });
  }

  try {
    // Fetch historical traffic alerts for this route (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const alerts = await db.trafficAlert.findMany({
      where: {
        routeId,
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (alerts.length < 3) {
      // Fallback: use route's traffic level as base estimate
      const route = await db.route.findUnique({ where: { id: routeId } });
      const baseDelay = route?.trafficLevel === 'high' ? 25 : route?.trafficLevel === 'medium' ? 12 : 5;
      return NextResponse.json({
        routeId,
        predictedDelayMin: baseDelay,
        confidence: 0.3,
        method: 'fallback_traffic_level',
        historicalDataPoints: alerts.length,
        timeOfDayFactor: 1.0,
      });
    }

    // Group by date and calculate daily average delay
    const dailyDelays: Map<string, number[]> = new Map();
    for (const alert of alerts) {
      const day = alert.createdAt.toISOString().split('T')[0];
      if (!dailyDelays.has(day)) dailyDelays.set(day, []);
      dailyDelays.get(day)!.push(alert.delayMinutes);
    }

    const sortedDays = [...dailyDelays.keys()].sort();
    const dailyAverages = sortedDays.map(day => {
      const delays = dailyDelays.get(day)!;
      return delays.reduce((s, d) => s + d, 0) / delays.length;
    });

    // Simple Exponential Smoothing (α=0.3)
    const alpha = 0.3;
    let smoothed = dailyAverages[0];
    for (let i = 1; i < dailyAverages.length; i++) {
      smoothed = alpha * dailyAverages[i] + (1 - alpha) * smoothed;
    }

    // Time-of-Day Heuristics
    const currentHour = new Date().getHours();
    let timeOfDayFactor = 1.0;
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)) {
      timeOfDayFactor = 1.4; // Peak hours
    } else if (currentHour >= 10 && currentHour <= 16) {
      timeOfDayFactor = 0.8; // Off-peak
    }

    const predictedDelay = Math.round(smoothed * timeOfDayFactor);
    const confidence = Math.min(0.95, 0.5 + (dailyAverages.length / 30) * 0.45);

    return NextResponse.json({
      routeId,
      predictedDelayMin: predictedDelay,
      confidence: Math.round(confidence * 100) / 100,
      method: 'exponential_smoothing_tod',
      historicalDataPoints: alerts.length,
      timeOfDayFactor,
      smoothedBase: Math.round(smoothed * 10) / 10,
    });
  } catch (error) {
    console.error('Traffic prediction error:', error);
    return NextResponse.json({ error: 'Prediction failed' }, { status: 500 });
  }
}
