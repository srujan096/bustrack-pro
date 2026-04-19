import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// Holt's Double Exponential Smoothing with Time-of-Day Heuristics
// Level: Lₜ = α × d[t] + (1 - α) × (Lₜ₋₁ + Tₜ₋₁)
// Trend: Tₜ = β × (Lₜ - Lₜ₋₁) + (1 - β) × Tₜ₋₁
// Forecast: F = L + T (α=0.3, β=0.1)
// Adjust: Multiply by time-of-day factor (peak=1.4, off-peak=0.8)
// Fallback: Route median delay if <3 historical points
// Complexity: O(n) for n daily averages

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get('routeId');
  const token = searchParams.get('token') || '';

  // Rate limit: max 5 calls per 10 seconds per token
  const rateLimitResult = rateLimit(token, 'traffic-predict', 5, 10000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests, please wait.' },
      { status: 429 }
    );
  }

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
        trendComponent: 0,
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

    // Holt's Double Exponential Smoothing (α=0.3, β=0.1)
    let L = dailyAverages[0];
    let T = 0;
    const alpha = 0.3;
    const beta = 0.1;

    for (let i = 1; i < dailyAverages.length; i++) {
      const L_new = alpha * dailyAverages[i] + (1 - alpha) * (L + T);
      const T_new = beta * (L_new - L) + (1 - beta) * T;
      L = L_new;
      T = T_new;
    }

    const smoothed = L + T;

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
      method: 'holt_des',
      historicalDataPoints: alerts.length,
      timeOfDayFactor,
      smoothedBase: Math.round(L * 10) / 10,
      trendComponent: Math.round(T * 10) / 10,
    });
  } catch (error) {
    console.error('Traffic prediction error:', error);
    return NextResponse.json({ error: 'Prediction failed' }, { status: 500 });
  }
}
