// Held-out validation dataset (seed=99). Do not use for algorithm training.
// Deterministic PRNG (Lehmer/Park-Miller) — ensures reproducible seed data
const _prngSeed = { value: 99 };
function seededRandom(): number {
  _prngSeed.value = (_prngSeed.value * 16807) % 2147483647;
  return (_prngSeed.value - 1) / 2147483646;
}

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

function randomBetween(min: number, max: number) {
  return min + Math.floor(seededRandom() * (max - min + 1));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

async function main() {
  console.log("🔬 Generating held-out validation TrafficAlert dataset (seed=99)...");

  // Read existing route IDs from the database (do not create new routes/users)
  const routes = await db.route.findMany({
    select: { id: true, routeNumber: true },
  });

  if (routes.length === 0) {
    console.log("⚠️  No routes found in database. Please run main seed first.");
    process.exit(1);
  }

  // Read existing crew profiles for reporter IDs
  const crew = await db.profile.findMany({
    where: { role: { in: ['driver', 'admin'] } },
    select: { id: true },
  });

  if (crew.length === 0) {
    console.log("⚠️  No crew/admin profiles found in database. Please run main seed first.");
    process.exit(1);
  }

  const alertTypes = ["congestion", "accident", "road_closure", "weather"];
  const severities = ["low", "medium", "high", "critical"];
  const congestionMessages = [
    "Heavy traffic congestion reported on this route during peak hours.",
    "Slow-moving traffic due to road work and lane restrictions.",
    "Unusual congestion caused by nearby event traffic.",
    "Traffic backed up due to signal failure at major junction.",
    "Persistent congestion on highway stretch, expect delays.",
  ];
  const accidentMessages = [
    "Minor accident involving two vehicles on the roadside. Lane partially blocked.",
    "Vehicle breakdown in the middle lane causing traffic buildup.",
    "Multi-vehicle collision reported. Emergency services on scene.",
    "Two-wheeler accident near bus stop. Traffic diverted to alternate route.",
    "Truck tire burst causing temporary lane closure.",
  ];
  const roadClosureMessages = [
    "Road closed for maintenance work between stops. Diversion in effect.",
    "Water pipeline repair causing full road closure on this segment.",
    "Bridge inspection underway. One-way traffic only.",
    "Road subsidence detected. Route closed until further notice.",
    "Flyway repair work. Lower-level roads being used as alternate.",
  ];
  const weatherMessages = [
    "Heavy rainfall reducing visibility and road grip. Drive carefully.",
    "Waterlogging reported at low-lying stretch. Bus may be delayed.",
    "Fog conditions reducing visibility to under 50 meters.",
    "Thunderstorm warning issued for this route. Expect delays.",
    "High wind alert. Overhead wire checks underway.",
  ];

  const messageByType: Record<string, string[]> = {
    congestion: congestionMessages,
    accident: accidentMessages,
    road_closure: roadClosureMessages,
    weather: weatherMessages,
  };

  let totalAlertsCreated = 0;
  const alertsPerRoute = 6;

  for (const route of routes) {
    for (let i = 0; i < alertsPerRoute; i++) {
      const type = pickRandom(alertTypes);
      const severity = pickRandom(severities);
      const reporter = pickRandom(crew);
      const messages = messageByType[type];
      const message = pickRandom(messages);

      // Delay based on severity
      let delayMin: number;
      switch (severity) {
        case 'critical':
          delayMin = randomBetween(30, 60);
          break;
        case 'high':
          delayMin = randomBetween(20, 45);
          break;
        case 'medium':
          delayMin = randomBetween(10, 30);
          break;
        default:
          delayMin = randomBetween(5, 15);
      }

      // Spread alerts across last 30 days
      const daysAgo = randomBetween(0, 30);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      // 60% chance of being resolved, with resolution time 1-12 hours after creation
      const resolvedAt = seededRandom() > 0.4
        ? new Date(createdAt.getTime() + randomBetween(1, 12) * 3600000)
        : null;

      await db.trafficAlert.create({
        data: {
          routeId: route.id,
          reporterId: reporter.id,
          type,
          severity,
          delayMinutes: delayMin,
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} on ${route.routeNumber}: ${message}`,
          createdAt,
          resolvedAt,
        },
      });

      totalAlertsCreated++;
    }
  }

  console.log(`✅ ${totalAlertsCreated} validation TrafficAlert records created`);
  console.log(`   - ${routes.length} routes × ${alertsPerRoute} alerts per route`);
  console.log(`   - Types: congestion, accident, road_closure, weather`);
  console.log(`   - Spread across last 30 days`);
  console.log(`   - ~60% resolved, ~40% open`);
  console.log("\n🔬 Validation dataset ready for algorithm evaluation.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
