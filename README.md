# BusTrack Pro

> A comprehensive bus dispatch and crew management system built with Next.js 16.

BusTrack Pro is a full-featured transit management platform designed for Indian cities. It provides three role-based portals — **Admin**, **Crew** (Driver/Conductor), and **Customer** — each packed with data visualizations, real-time tracking, automated scheduling, and intelligent crew assignment. The system ships with 205 demo users, 115 real routes across 5 cities, and 3,654+ pre-generated schedules.

---

## Features

### Admin Portal

- **Dashboard** — Live fleet tracker SVG with animated bus dots orbiting concentric route circles, passenger analytics area chart (24-hour timeline), system health panel (API, Database, Uptime), quick stats ribbon, broadcast messaging with priority & audience targeting
- **Route Management** — Full CRUD with city filtering, route detail expansion with stop timeline and amenities, toggle auto-scheduling, duplicate detection
- **Schedule Generation** — Greedy time-slot assignment with constraint propagation; generates schedules across all auto-enabled routes for a target date, skips duplicates
- **Crew Auto-Assignment** — Multi-criteria scoring with Jain's Fairness Index (Score = 0.6 × Fairness + 0.4 × Performance); assigns drivers and conductors with max daily hours enforcement
- **Traffic Alerts** — Create, resolve, and monitor traffic incidents (congestion, accident, road closure, weather) with severity levels; auto-notifies affected customers
- **AI Delay Prediction** — Simple Exponential Smoothing (α=0.3) + time-of-day heuristics (peak 1.4×, off-peak 0.8×) for per-route delay forecasting
- **Holiday/Leave Management** — Review/approve/reject crew leave requests with overlap detection; auto-updates crew availability on approval
- **Analytics** — Revenue summary cards, top performing routes, route performance heatmap (8 routes × 7 days), color-coded performance matrix across cities, weekly bar charts
- **Maintenance Tracking** — Log and track bus service records (routine, repair, inspection) with upcoming service alerts
- **System Settings** — General, notification, display, and API settings persisted via localStorage; danger zone with reset/export
- **CSV Data Export** — Download analytics, routes, crew, or journeys as CSV files
- **Scroll Progress Indicator** — Emerald gradient progress bar on scroll
- **Command Palette** — `Ctrl+K` / `Cmd+K` global search across all portal pages with glass-morphism UI

### Crew Portal (Driver/Conductor)

- **Dashboard** — Digital trip manifest (ticket-style card with route progress visualization and passenger count), circular SVG shift timer (idle/running/paused states with color-coded thresholds), weekly on-time rate bar chart, quick action buttons (Start/End Shift, Report Issue, View Pay)
- **Assignments** — Time-grouped assignment list with pre-trip checklist (7 interactive items: vehicle inspection, fuel, tires, lights, first aid, fire extinguisher, ticket machine), quick communication presets (Running late, Arrived, Emergency, Break request)
- **Calendar** — Monthly calendar view with assignment count badges; shift summary cards (morning/evening) with overtime indicator on date selection; leave dots (approved/pending/rejected)
- **Leave Requests** — Leave balance tracking (available/pending/used from 20-day allowance), create requests via dialog, status timeline view
- **Profile** — Gradient cover banner, avatar with stats (trips/rating/experience), skills tags, edit profile dialog, earnings tracker with 6-month SVG line chart and summary cards (This Month, Last Month, YTD, Average)

### Customer Portal

- **Dashboard** — Spending analytics donut chart (Bus Fares / Season Pass / Other), spending stats cards, upcoming journeys, favorite routes, route comparison CTA cards
- **Route Search** — Search by location/route number with city filter; results expand to show stop timeline, bus amenities (WiFi, AC, capacity), and Book Now action
- **Interactive Map** — Leaflet + OSRM integration with road-following polylines, color-coded markers, route selector, fallback for unmapped routes
- **Journey Receipts** — Ticket-style receipt cards with tear-line effect, deterministic QR code pattern, seat assignment, status badges, download receipt action
- **Journey History** — Date range filtering with filtered stats (avg fare, total distance), star rating distribution chart (5★ to 1★), rate & feedback
- **Fare Calculator** — Quick fare estimation for route planning
- **Route Comparison** — Select 2–3 routes for side-by-side comparison
- **Favorites** — Save preferred routes to localStorage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui + CSS design system |
| Database | Prisma ORM + SQLite |
| State | Zustand + TanStack Query |
| Auth | Custom token-based with SHA-256 hashing |
| Maps | Leaflet + react-leaflet + OSRM routing |
| Icons | Lucide React |
| Animations | Framer Motion + CSS keyframe animations |
| Forms | React Hook Form + Zod |
| Utilities | date-fns, clsx, tailwind-merge |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **npm**, **yarn**, or **bun** package manager

### Installation

```bash
cd /home/z/my-project
bun install
```

### Database Setup

```bash
# Push schema to SQLite database
bun run db:push

# Seed with demo data
#   205 users (1 admin, 60 drivers, 44 conductors, 100 customers)
#   115 routes (50 BLR, 20 MUM, 15 DEL, 15 CHN, 15 inter-city)
#   3,654 schedules, 4,356 crew assignments, 81 journeys
bunx tsx prisma/seed.ts
```

### Development

```bash
# Start development server on port 3000
bun run dev

# Production build
bun run build
bun run start
```

### Lint

```bash
bun run lint
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bus.com` | `password123` |
| Driver | `driver1@bus.com` | `password123` |
| Conductor | `conductor1@bus.com` | `password123` |
| Customer | `customer1@bus.com` | `password123` |

Quick-access demo buttons are also available on the login screen.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main app (login + app shell + portal routing)
│   ├── globals.css           # Global styles + CSS design system
│   ├── layout.tsx            # Root layout with providers
│   └── api/
│       ├── auth/             # Authentication (login/logout/verify)
│       ├── routes/           # Route CRUD + search
│       ├── schedules/        # Schedule management + generation
│       ├── crew/             # Crew management + auto-assignment
│       ├── journeys/         # Journey booking/tracking/rating
│       ├── traffic/          # Traffic alert management
│       ├── traffic-predict/  # AI delay prediction (SES)
│       ├── holidays/         # Leave/holiday requests
│       ├── notifications/    # Notification system
│       ├── analytics/        # Analytics data + dashboard stats
│       ├── maintenance/      # Bus maintenance records
│       └── export/           # CSV data export
├── components/
│   ├── admin/
│   │   └── admin-content.tsx   # Admin portal (9 pages, ~3,600 lines)
│   ├── crew/
│   │   └── crew-content.tsx    # Crew portal (5 pages, ~3,200 lines)
│   ├── customer/
│   │   └── customer-content.tsx # Customer portal (5 pages, ~2,500 lines)
│   └── ui/                     # shadcn/ui components
├── lib/
│   └── db.ts                   # Prisma database client
├── hooks/
│   └── use-toast.ts            # Toast notification hook
├── types/
│   └── index.ts               # TypeScript type definitions
prisma/
├── schema.prisma              # Database schema (12 tables)
└── seed.ts                    # Demo data seed script
```

---

## Database Schema (12 Tables)

| Table | Description |
|-------|-------------|
| `Profile` | User accounts with role (admin/driver/conductor/customer), email, hashed password |
| `CrewProfile` | Crew details: specialization, license, experience, performance rating, availability |
| `Route` | Bus routes: number, locations, stops (JSON), distance, fare, schedule config, city |
| `Schedule` | Time-slot schedules linked to routes with date, departure time, status |
| `CrewAssignment` | Links crew to schedules with acceptance status and timestamps |
| `HolidayRequest` | Crew leave requests with date range, reason, review status |
| `Journey` | Customer bookings linked to route + schedule with cost, rating, feedback |
| `TrafficAlert` | Traffic incidents with type, severity, delay estimate, resolution tracking |
| `Notification` | In-app notifications per user with type, read status |
| `AuditLog` | System audit trail with table, action, user, details |
| `BusMaintenance` | Vehicle service records with type, cost, next service date |
| `RouteAnalytics` | Daily per-route metrics: completion rate, revenue, delay, journey count |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | POST | Login, logout, verify token, list users, update profile |
| `/api/routes` | GET | List/search routes with city/filter/pagination support |
| `/api/routes` | POST | Create, update, delete routes; toggle auto-scheduling |
| `/api/schedules` | GET | List schedules with route/date/status/crew filters |
| `/api/schedules` | POST | Generate schedules (greedy algorithm), cancel schedule |
| `/api/crew` | GET | List crew profiles with specialization/availability filters |
| `/api/crew` | POST | Auto-assign crew (Jain's fairness), accept/decline assignment |
| `/api/journeys` | GET | List journeys with spending stats per customer |
| `/api/journeys` | POST | Book journey, cancel journey, rate & feedback |
| `/api/traffic` | GET | List traffic alerts with route/unresolved filters |
| `/api/traffic` | POST | Create alert (with customer notifications), resolve alert |
| `/api/traffic-predict` | GET | Predict delay for a route (SES + time-of-day heuristics) |
| `/api/holidays` | GET | List leave requests with crew/status filters |
| `/api/holidays` | POST | Create leave request, review (approve/reject) |
| `/api/notifications` | GET | List notifications with unread count |
| `/api/notifications` | POST | Mark read, mark all read, create notification |
| `/api/analytics` | GET | Route analytics with daily trends, city breakdown, dashboard stats |
| `/api/maintenance` | GET | List maintenance records and upcoming services |
| `/api/maintenance` | POST | Create maintenance record |
| `/api/export` | GET | Export data as CSV (analytics, routes, crew, journeys) |

---

## Key Algorithms

### Schedule Generation — Greedy Time-Slot Assignment with Constraint Propagation

Iterates over all routes with auto-scheduling enabled. For each route, generates time slots from `startTime` to `endTime` at `frequencyMinutes` intervals. Each slot is checked against existing schedules for the same route + date + time (constraint propagation) to prevent duplicates. Skips conflicts and reports counts.

**Complexity:** O(n × m) where n = routes, m = time slots per route.

### Crew Auto-Assignment — Multi-Criteria Scoring with Jain's Fairness Index

For each unassigned schedule, scores all available drivers and conductors using a weighted formula:

```
Score = 0.6 × FairnessComponent + 0.4 × PerformanceRating
```

The fairness component prioritizes crew with fewer existing assignments. Max daily hours are enforced per crew member. After all assignments, Jain's Fairness Index is computed:

```
J(n) = (Σ xᵢ)² / (n × Σ xᵢ²)
```

A value closer to 1.0 indicates more equitable distribution.

### Traffic Delay Prediction — Simple Exponential Smoothing

Uses historical traffic alert data from the last 30 days:

1. Group alerts by date and compute daily average delay
2. Apply Simple Exponential Smoothing: `Sₜ = α × Actualₜ + (1 − α) × Sₜ₋₁` with α = 0.3
3. Multiply by time-of-day factor: **1.4×** for peak hours (7–9 AM, 5–7 PM), **0.8×** for off-peak (10 AM–4 PM)
4. Fallback to route traffic level if fewer than 3 data points

**Complexity:** O(1) per prediction after warm-up.

---

## App Shell Features

- **Animated login screen** with SVG bus icon, bus route background animation, version badge, "Remember me" checkbox
- **Collapsible sidebar** with role-based navigation, section dividers (MAIN, MANAGEMENT, SETTINGS), mobile overlay with hamburger animation
- **Header** with breadcrumbs, live IST clock, notification bell with unread count (30s polling), online status indicator
- **Command palette** (Ctrl+K) for quick page navigation
- **Footer** with IST date, system health status, route/crew counts, version info
- **Scroll progress bar** (admin portal)
- **Toast notifications** across all portals (22+ alert() replacements)

---

## License

MIT
