# BusTrack Pro — Bus Company Integration Guide

A comprehensive guide for any bus transit company looking to use BusTrack Pro to manage their fleet, routes, schedules, crew, and passenger bookings.

---

## 1. Introduction

**BusTrack Pro** is a full-featured bus transit management system built with modern web technologies. It provides end-to-end management capabilities including:

- **Route Management** — Define bus routes with stops, distances, fares, and real GPS coordinates
- **Schedule Generation** — Auto-generate daily schedules with configurable frequency and time windows
- **Crew Management** — Assign drivers and conductors to schedules with fairness-based allocation
- **Passenger Bookings** — Journey booking with ratings, feedback, and spending tracking
- **Traffic Prediction** — ML-inspired delay prediction using Exponential Smoothing
- **Analytics Dashboard** — Revenue, completion rates, delay analytics per route
- **Maintenance Tracking** — Bus service records, inspection schedules, and cost tracking
- **Live Maps** — Route visualization using Leaflet + OpenStreetMap with OSRM road-following polylines
- **Multi-role Access** — Admin, Driver, Conductor, and Customer portals
- **Notifications** — Real-time alerts for delays, schedule changes, and trip updates

---

## 2. System Requirements

| Requirement | Minimum |
|-------------|---------|
| **Node.js** | 18+ |
| **Bun runtime** | Latest stable (https://bun.sh) |
| **Database** | SQLite (built-in — no external database server needed) |
| **RAM** | 2 GB minimum |
| **Disk Space** | ~500 MB for the project and database |
| **OS** | Linux, macOS, or Windows (with WSL) |

No external database server (PostgreSQL, MySQL, etc.) is required out of the box. The system uses SQLite, which stores everything in a single file.

---

## 3. Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd bustrack-pro

# Install dependencies
bun install

# Create database tables from schema
bun run db:push

# Seed the database with demo data (optional)
bunx prisma db seed

# Start the development server
bun run dev
```

The application will be available at `http://localhost:3000` (or the port shown in the terminal).

---

## 4. Customizing for Your Bus Company

All seed data is defined in `prisma/seed.ts`. This section explains how to customize each aspect.

### 4.1 Adding Your Cities

Edit the `CITIES` object in `prisma/seed.ts`:

```typescript
const CITIES: Record<string, { lat: number; lng: number }> = {
  BLR: { lat: 12.9716, lng: 77.5946 },
  YOUR_CITY: { lat: YOUR_LAT, lng: YOUR_LNG },
  // ...
};
```

### 4.2 Adding Your Routes (Bus Stops / Landmarks)

Replace the location arrays with your actual bus stops. Each location needs a `name`, `lat`, and `lng`:

```typescript
const YOUR_CITY_LOCATIONS = [
  { name: "Central Bus Stand", lat: 12.97, lng: 77.59 },
  { name: "Airport Road", lat: 12.95, lng: 77.66 },
  { name: "Railway Station", lat: 12.98, lng: 77.60 },
  { name: "Tech Park", lat: 12.93, lng: 77.68 },
  { name: "Market Square", lat: 12.96, lng: 77.58 },
  // Add as many stops as you need
];
```

Then add a loop to generate routes from these locations:

```typescript
// YOUR_CITY routes (e.g., 25 routes)
for (let i = 0; i < 25; i++) {
  const result = await createCityRoutes(YOUR_CITY_LOCATIONS, "YOUR_CITY", 1);
  if (result) allRoutes.push({ id: (await result).id, city: "YOUR_CITY" });
}
```

Update the `generateRouteNumber` function to include your city prefix:

```typescript
function generateRouteNumber(city: string, index: number): string {
  const prefixes: Record<string, string> = {
    BLR: "KIA", MUM: "BEST", DEL: "DTC", CHN: "MTC",
    intercity: "RTC",
    YOUR_CITY: "YOUR_PREFIX",  // Add your prefix here
  };
  return `${prefixes[city] || "BUS"}-${String(index).padStart(3, "0")}`;
}
```

### 4.3 Adjusting Fares

Fares are calculated in the `createCityRoutes` function. The default formula:

- **City routes**: `Math.round(20 + adjustedDistance * 2)` — ₹20 base + ₹2 per km
- **Inter-city routes**: `Math.round(200 + distance * 3)` — ₹200 base + ₹3 per km

To change fares, modify these formulas in the seed script. For flat-rate pricing:

```typescript
const fare = 25;  // Flat ₹25 for all city routes
```

For tiered pricing based on distance brackets:

```typescript
function calculateFare(distanceKm: number): number {
  if (distanceKm <= 5) return 15;
  if (distanceKm <= 15) return 30;
  if (distanceKm <= 30) return 50;
  return 75;
}
```

### 4.4 Adjusting Schedules

Schedule generation depends on three route parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `startTime` | `"05:00"` to `"08:00"` | Earliest departure |
| `endTime` | `"20:00"` to `"23:00"` | Latest departure |
| `frequencyMinutes` | 15, 20, 30, 45, or 60 | Minutes between departures |

To change defaults, modify in the `createCityRoutes` function:

```typescript
const startTime = "04:00";        // Start earlier
const endTime = "00:00";          // Run until midnight
const frequency = 10;             // Every 10 minutes
```

### 4.5 Adding Real GPS Coordinates

BusTrack uses real coordinates for map display. To get accurate GPS coordinates for your bus stops:

1. Open [Google Maps](https://maps.google.com) or [OpenStreetMap](https://www.openstreetmap.org)
2. Find your bus stop on the map
3. Right-click and copy the coordinates
4. Paste them into the location array:

```typescript
{ name: "Your Bus Stop", lat: 13.0123, lng: 77.5678 },
```

The map feature uses Leaflet + OpenStreetMap (free, no API key needed) and OSRM for road-following route polylines.

### 4.6 Configuring Bus Registration Numbers

Edit the `BUS_PREFIXES` array to match your region's vehicle registration format:

```typescript
const BUS_PREFIXES = [
  "KA-01", "KA-02",  // Karnataka (Bangalore)
  "MH-01", "MH-02",  // Maharashtra (Mumbai)
  "DL-01",           // Delhi
  "TN-01",           // Tamil Nadu (Chennai)
  // Add your region's RTO codes
  "AP-01",           // Andhra Pradesh
  "TS-01",           // Telangana
];
```

Bus numbers are generated in the format: `{PREFIX}-{LETTER}{4DIGITS}`, e.g., `KA-01-F4521`.

### 4.7 Customizing Crew Data

**Number of drivers and conductors** — change the loop bounds:

```typescript
// Change from 60 drivers to 30
for (let i = 1; i <= 30; i++) { ... }

// Change from 44 conductors to 20
for (let i = 1; i <= 20; i++) { ... }
```

**Name pools** — replace the name arrays:

```typescript
const YOUR_FIRST_NAMES_M = ["YourName1", "YourName2", ...];
const YOUR_LAST_NAMES = ["YourSurname1", "YourSurname2", ...];
```

### 4.8 Changing Account Credentials

The universal password is set in the seed script:

```typescript
password: await hashPassword("password123"),
```

Change `"password123"` to your desired default password. For production use, consider generating unique passwords per account.

---

## 5. API Reference

All API endpoints are prefixed with `/api/`. Authentication is handled via JWT tokens returned by the login endpoint.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth` | Login with email/password. Returns JWT token and user profile. |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routes` | List all routes. Supports filtering by city, search by name. |
| POST | `/api/routes` | Create a new route (admin only). |
| GET | `/api/routes/:id` | Get details for a specific route. |
| PUT | `/api/routes/:id` | Update route details (admin only). |
| DELETE | `/api/routes/:id` | Delete a route (admin only). |

### Schedules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | List schedules. Filter by route, date, status. |
| POST | `/api/schedules` | Generate schedules for routes (admin). Uses greedy time-slot assignment algorithm. |

### Crew
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crew` | List all crew members with profiles. |
| POST | `/api/crew` | Auto-assign crew to schedules. Uses Jain's Fairness Index for equitable distribution. |

### Journeys (Bookings)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journeys` | List journeys. Filter by customer, status, route. |
| POST | `/api/journeys` | Book a new journey (customer). |

### Traffic
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/traffic-predict` | Predict traffic delays using Exponential Smoothing (α=0.3) with peak hour heuristics (7–9 AM, 5–7 PM). |
| GET | `/api/traffic-alerts` | List current traffic alerts. |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get aggregated analytics: revenue, completion rates, delays, journey counts. |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export` | Export data as CSV (routes, schedules, journeys, crew). |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications for the authenticated user. |
| PUT | `/api/notifications/:id` | Mark notification as read. |

### Leave / Holidays
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays` | List holiday/leave requests. |
| POST | `/api/holidays` | Submit a leave request (crew). |
| PUT | `/api/holidays/:id` | Approve/reject a leave request (admin). |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | List bus maintenance records. |
| POST | `/api/maintenance` | Add a maintenance record (admin). |

### Support Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/support-tickets` | List support tickets. |
| POST | `/api/support-tickets` | Create a support ticket (any user). |
| PUT | `/api/support-tickets/:id` | Update ticket status/admin response. |

---

## 6. Database Schema Overview

The database is defined in `prisma/schema.prisma`. Here are the key models:

| Model | Description |
|-------|-------------|
| **Profile** | User accounts with email, password, role (admin/driver/conductor/customer), name, phone |
| **CrewProfile** | Extended profile for crew: license number, experience, performance rating, availability, bus number |
| **CrewNote** | Daily notes/logs per crew member |
| **Route** | Bus routes with stops (JSON), distance, duration, fare, traffic level, schedule config, city |
| **Schedule** | Specific date + time instances of route runs with status (scheduled/in_progress/completed/cancelled) |
| **CrewAssignment** | Links crew members to schedules (driver + conductor per schedule) |
| **Journey** | Customer bookings linked to a schedule and route, with cost, rating, feedback |
| **TrafficAlert** | Reports of congestion, accidents, road closures, weather on routes |
| **Notification** | User notifications (info, warning, success, error) |
| **HolidayRequest** | Crew leave requests with approval workflow |
| **BusMaintenance** | Bus service records (routine, repair, inspection) with costs |
| **RouteAnalytics** | Daily metrics per route: completion rate, revenue, delay, journey count |
| **SupportTicket** | Customer support tickets with category, status, priority |
| **Announcement** | System-wide announcements targeted by role |
| **AuditLog** | Tracks all admin actions in the system |

### Entity Relationships
- A **Profile** can have one **CrewProfile** (for drivers/conductors)
- A **Route** has many **Schedules**
- A **Schedule** has many **CrewAssignments** (typically 1 driver + 1 conductor)
- A **Schedule** has many **Journeys** (customer bookings)
- A **Profile** can have many **Journeys** (as customer), **Notifications**, **TrafficAlerts** (as reporter), **HolidayRequests**, **SupportTickets**

---

## 7. User Roles

### Admin
- Full system access to all features
- Manage routes (create, edit, delete)
- Generate and manage schedules
- Auto-assign crew to schedules
- Approve/reject holiday requests
- View analytics dashboards
- Manage maintenance records
- Respond to support tickets
- Create announcements

### Driver
- View assigned schedules and shift details
- Shift timer (start/end shift)
- Trip manifest (view passengers)
- Pre-trip checklist
- View earnings summary
- Submit holiday/leave requests
- Receive notifications (schedule changes, delays)

### Conductor
- Similar access to drivers
- Ticketing-focused interface
- View passenger list for assigned trips
- Submit holiday/leave requests
- Receive notifications

### Customer
- Search and browse routes
- Book journeys/tickets
- View journey history (completed and planned)
- Rate completed rides (3–5 stars)
- Submit feedback
- Track spending
- Submit support tickets
- Receive notifications (trip updates, delays)

---

## 8. Map Integration

BusTrack Pro includes a fully functional map feature for route visualization:

- **Map Library**: Leaflet + OpenStreetMap tiles (free, no API key required)
- **Routing**: OSRM (Open Source Routing Machine) for road-following polylines between stops
- **Markers**: Route start, end, and intermediate stops displayed as map markers
- **Interactivity**: Click on stops to see details, hover for popup information

### How Coordinates Are Used
1. Each route's `stopsJson` contains an array of `{name, lat, lng}` objects
2. These coordinates are sent to the OSRM API to generate road-following polylines
3. The polylines are displayed on the Leaflet map alongside stop markers

### Adding Accurate Coordinates
For the best map experience, use real GPS coordinates from Google Maps or OpenStreetMap for all your bus stops. The seed data includes approximate coordinates for demo purposes — replace them with actual surveyed coordinates for production use.

---

## 9. Real-Time Features

### Traffic Delay Prediction
- Uses **Exponential Smoothing** (α = 0.3) for weighted average of historical delays
- **Peak hour heuristics**: 7–9 AM and 5–7 PM add 10–15 minute delay estimates
- Traffic levels (low/medium/high) affect base delay calculations
- Returns estimated delay in minutes for any route

### Schedule Generation
- **Greedy time-slot assignment** algorithm fills available slots without overlap
- Respects route start/end times and frequency intervals
- ~30% of possible slots are skipped (to simulate realistic gaps)
- Status auto-detection: past slots → completed/cancelled, current → in_progress, future → scheduled

### Crew Auto-Assignment
- Uses **Jain's Fairness Index** to ensure equitable workload distribution
- Considers crew availability, max daily hours, and existing assignments
- Assigns one driver + one conductor per schedule
- Prevents double-booking and respects leave status

---

## 10. Deployment

### Development
```bash
bun run dev    # Starts dev server with hot reload
```

### Production Build
```bash
bun run build  # Creates optimized production build
bun run start  # Starts production server
```

### Database Persistence
The SQLite database is stored at `db/bustrack.db`. To persist data across deployments:
1. Copy `db/bustrack.db` to your production server
2. Ensure the `db/` directory exists and is writable
3. Set the `DATABASE_URL` environment variable: `file:./db/bustrack.db`

### Scaling to PostgreSQL
For larger fleets or multi-server deployments, migrate to PostgreSQL:

1. Install PostgreSQL and create a database
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` in your `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/bustrack"
   ```
4. Run:
   ```bash
   bunx prisma db push
   bunx prisma db seed
   ```

### Hosting Options
- **Vercel** — Works with serverless functions (use PostgreSQL instead of SQLite)
- **Railway** — Simple deployment with built-in PostgreSQL
- **Docker** — Use the included Dockerfile (if available) or create one:
  ```dockerfile
  FROM oven/bun:latest
  WORKDIR /app
  COPY . .
  RUN bun install
  RUN bun run build
  EXPOSE 3000
  CMD ["bun", "run", "start"]
  ```

---

## 11. Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `db/bustrack.db` not found | Run `bun run db:push` to create the database |
| Login fails | Ensure you've run `bunx prisma db seed` and use credentials from `CREDENTIALS.txt` |
| Maps not loading | Check internet connection (OSRM API is online); coordinates must be valid |
| Seed fails midway | Delete `db/bustrack.db`, run `bun run db:push`, then `bunx prisma db seed` |

### Key Files Reference

| File | Purpose |
|------|---------|
| `prisma/seed.ts` | All demo data generation — modify to customize |
| `prisma/schema.prisma` | Database schema — modify to add/remove tables |
| `CREDENTIALS.txt` | Auto-generated list of all login emails (regenerated on each seed) |
| `SEED-DATA-SUMMARY.md` | Detailed breakdown of all seeded data |
| `SEED-FILE-LOCATION.md` | Quick reference for seed file locations |
| `.env` | Environment variables (DATABASE_URL, JWT_SECRET, etc.) |

### Reproducibility
All seed data is **100% deterministic** (PRNG seed = 42). Running the seed on any machine produces identical data, making it easy to share demo environments and reproduce issues.
