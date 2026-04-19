# BusTrack Pro — Detailed Technical Explanation

> **Comprehensive Bus Route & Crew Management System**
> Built with Next.js 16 · Prisma ORM · SQLite · TypeScript · Tailwind CSS 4 · shadcn/ui

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Routes](#4-api-routes)
5. [Algorithms](#5-algorithms)
6. [Portal Pages and Features](#6-portal-pages-and-features)
7. [Key Components and UI Features](#7-key-components-and-ui-features)
8. [Authentication System](#8-authentication-system)
9. [Seed Data](#9-seed-data)
10. [File Structure](#10-file-structure)

---

## 1. Project Overview

**BusTrack Pro** is a comprehensive Bus Route & Crew Management System designed to simulate real-world public transport operations across India. The system provides end-to-end management of bus routes, crew (drivers and conductors), scheduling, customer bookings, traffic monitoring, and fleet maintenance.

### Key Highlights

| Feature | Detail |
|---|---|
| **User Roles** | 4 dedicated roles: Admin, Driver, Conductor, Customer |
| **Cities Covered** | 5 Indian cities — Bangalore, Mumbai, Delhi, Chennai, and Inter-city routes |
| **Total Routes** | 115 bus routes across all cities |
| **User Accounts** | 205 pre-seeded accounts (1 Admin + 60 Drivers + 44 Conductors + 100 Customers) |
| **Scheduling** | Automated schedule generation with constraint propagation |
| **Crew Assignment** | Multi-criteria scoring with Jain's Fairness Index |
| **Notifications** | Real-time notification system for all user types |
| **Maps** | Interactive Leaflet maps with OSRM road-following polylines |
| **Analytics** | Revenue tracking, on-time rates, route performance matrices |

### Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BusTrack Pro (Next.js 16)                   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Admin   │  │  Driver  │  │ Conductor  │  │   Customer   │  │
│  │  Portal  │  │  Portal  │  │   Portal   │  │    Portal    │  │
│  │  (9 pg)  │  │  (6 pg)  │  │   (6 pg)   │  │    (6 pg)    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └──────┬───────┘  │
│       │              │              │                 │          │
│       └──────────────┴──────┬───────┴─────────────────┘          │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │   API Routes    │                           │
│                    │   (14 endpoints)│                           │
│                    └────────┬────────┘                           │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │   Prisma ORM    │                           │
│                    └────────┬────────┘                           │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │     SQLite      │                           │
│                    │  (custom.db)    │                           │
│                    └─────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

Each technology was selected for specific technical reasons that benefit the project's requirements.

### 2.1 Core Framework

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **Next.js 16** | 16.x | Full-stack React framework | Modern React framework with server-side rendering (SSR), API routes, file-based routing, and built-in optimizations. The App Router provides better code splitting, React Server Components, and streaming — reducing Time-to-First-Byte (TTFB) and improving perceived performance. |
| **TypeScript** | 5.x | Type-safe JavaScript | Strongly typed language that catches errors at compile time rather than runtime. Provides superior IDE support with auto-completion, refactoring tools, and inline documentation. Essential for maintaining a large codebase (~11,600+ lines) across multiple developers. |
| **Prisma ORM** | 6.x | Database ORM | Type-safe database access with auto-generated TypeScript types based on the schema. Provides migration management, declarative data seeding, and intuitive query syntax that eliminates raw SQL errors. The `prisma generate` command creates fully-typed client code. |

### 2.2 Database

| Technology | Purpose | Why Chosen |
|---|---|---|
| **SQLite** | Embedded relational database | Zero-configuration embedded database — perfect for demo/development environments. No separate database server process is needed. All data is stored in a single file (`custom.db`), making the project portable and easy to set up. Supports full SQL features including transactions, indexes, and foreign keys. For production, this could be swapped to PostgreSQL with zero Prisma query changes. |

### 2.3 Styling and UI

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **Tailwind CSS 4** | 4.x | Utility-first CSS framework | Enables rapid UI development without writing custom CSS files. Provides a consistent design system with responsive utilities (`sm:`, `md:`, `lg:`, `xl:`), color palettes, spacing scales, and dark mode support. Tailwind 4 introduces CSS-first configuration and improved performance. |
| **shadcn/ui** | latest | Pre-built UI components | Pre-built, accessible React components based on Radix UI primitives. The copy-paste approach (not an npm dependency) means full code ownership — components live in `src/components/ui/` and can be freely modified. Uses the **New York** style variant for a modern, professional look. Includes 40+ components (Button, Dialog, Table, Card, Calendar, etc.). |
| **Lucide React** | latest | Icon library | Consistent, beautiful icon library with tree-shaking support (only ships icons you use). Lightweight and MIT licensed. Provides 1000+ icons including transport-relevant ones (Bus, MapPin, Clock, Users, Shield, etc.). |

### 2.4 Maps and Routing

| Technology | Purpose | Why Chosen |
|---|---|---|
| **React Leaflet** | Interactive map rendering | The most popular open-source map library for React. Wraps Leaflet.js with React component patterns. Supports custom markers, polylines, popups, tile layers, and responsive map containers. Free and open-source with no API key required. |
| **OSRM** (Open Source Routing Machine) | Road-following route polylines | Provides accurate road-following polylines instead of straight-line connections between stops. OSRM's public demo server (`router.project-osrm.org`) is free to use and returns GeoJSON polylines that follow actual road networks. |

### 2.5 Animation and Interactivity

| Technology | Purpose | Why Chosen |
|---|---|---|
| **Framer Motion** | Animation library | Production-ready animation library for React. Used for smooth page transitions, hover effects, micro-interactions (card flips, list stagger), and animated SVG charts. Provides declarative animation API with `animate`, `transition`, and `variants` props. |

### 2.6 Utilities

| Technology | Purpose | Why Chosen |
|---|---|---|
| **next-themes** | Dark mode support | Provides dark mode with system preference detection (`prefers-color-scheme`). Zero-flash on load (injects script into `<head>` before React hydration). Simple `ThemeProvider` wrapper with no configuration needed. |
| **date-fns** | Date manipulation | Lightweight, modular date library — import only the functions you need (`format`, `addDays`, `isAfter`, etc.). Consistent function naming, immutable operations, and excellent TypeScript support. Tree-shakeable for minimal bundle size. |
| **zod** | Schema validation | TypeScript-first schema validation library. Used for form validation and API input validation. Provides `z.string().email()`, `z.number().min()`, `z.enum()`, etc. Auto-infers TypeScript types from schemas. |
| **zustand** | Client state management | Lightweight state management with minimal boilerplate (no providers, no context). Used for client-side global state like notification bell state, sidebar collapse, and user preferences. Simpler API than Redux with comparable functionality. |
| **TanStack Query** | Server state management | Manages server state with automatic caching, background refetching, stale-while-revalidate, and optimistic updates. Eliminates manual loading/error state tracking. Provides `useQuery` and `useMutation` hooks for declarative data fetching. |

---

## 3. Database Schema

The database consists of **12 tables** defined in Prisma schema (`prisma/schema.prisma`). All relationships use SQLite foreign keys with cascading deletes where appropriate.

### Entity-Relationship Overview

```
Profile ──┬── CrewProfile
          ├── Journey (as customer)
          ├── CrewAssignment
          ├── HolidayRequest
          ├── TrafficAlert (as reporter)
          ├── Notification
          └── AuditLog

Route ──┬── Schedule
        ├── Journey
        ├── TrafficAlert
        ├── RouteAnalytics
        └── BusMaintenance

Schedule ──┬── CrewAssignment
           └── Journey
```

### 3.1 Profile (User Accounts)

The central user table. Stores authentication credentials and basic profile information.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `email` | `String` | `@unique` | Login email address |
| `password` | `String` | — | SHA-256 hashed password |
| `role` | `String` | — | User role: `admin`, `driver`, `conductor`, `customer` |
| `name` | `String` | — | Display name |
| `token` | `String?` | `@unique` | Session token (nullable when logged out) |
| `createdAt` | `DateTime` | `@default(now())` | Account creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

**Relations:**
- `crewProfile` → `CrewProfile` (one-to-one, for drivers/conductors)
- `journeys` → `Journey[]` (one-to-many, as customer)
- `crewAssignments` → `CrewAssignment[]` (one-to-many, as assigned crew)
- `holidayRequests` → `HolidayRequest[]` (one-to-many, as requesting crew)
- `trafficAlerts` → `TrafficAlert[]` (one-to-many, as reporter)
- `notifications` → `Notification[]` (one-to-many)
- `auditLogs` → `AuditLog[]` (one-to-many, as acting user)

### 3.2 CrewProfile

Extended profile for drivers and conductors with professional details.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `profileId` | `Int` | `@unique`, FK → Profile | Reference to user account |
| `specialization` | `String` | — | `driver` or `conductor` |
| `licenseNo` | `String` | — | Driving license number |
| `experienceYears` | `Int` | — | Years of experience |
| `performanceRating` | `Float` | — | Rating 0.0 – 5.0 |
| `availability` | `String` | `@default("available")` | `available` or `on_leave` |
| `maxDailyHours` | `Int` | `@default(8)` | Maximum shift hours per day |
| `busNumber` | `String?` | — | Assigned bus registration number |

**Relations:**
- `profile` → `Profile` (many-to-one)
- `assignments` → `CrewAssignment[]` (one-to-many)

### 3.3 Route

Bus route definitions with stops, timing, and metadata.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `routeNumber` | `String` | `@unique` | Route identifier (e.g., `BLR-001`) |
| `startLocation` | `String` | — | Origin stop name |
| `endLocation` | `String` | — | Destination stop name |
| `stopsJson` | `String` | — | JSON array of intermediate stop names |
| `distanceKm` | `Float` | — | Total route distance in kilometers |
| `durationMin` | `Int` | — | Estimated duration in minutes |
| `fare` | `Float` | — | Base fare in INR |
| `trafficLevel` | `String` | `@default("medium")` | `low`, `medium`, or `high` |
| `autoScheduleEnabled` | `Boolean` | `@default(false)` | Enable auto-schedule generation |
| `startTime` | `String` | — | First departure time (HH:MM) |
| `endTime` | `String` | — | Last departure time (HH:MM) |
| `frequencyMinutes` | `Int` | — | Minutes between departures |
| `busRegistration` | `String` | — | Vehicle registration number |
| `city` | `String` | — | City: `Bangalore`, `Mumbai`, `Delhi`, `Chennai`, `Inter-city` |
| `mapAvailable` | `Boolean` | `@default(false)` | Whether OSRM map polyline is available |

**Relations:**
- `schedules` → `Schedule[]` (one-to-many)
- `journeys` → `Journey[]` (one-to-many)
- `trafficAlerts` → `TrafficAlert[]` (one-to-many)
- `analytics` → `RouteAnalytics[]` (one-to-many)
- `maintenance` → `BusMaintenance[]` (one-to-many)

### 3.4 Schedule

Timetabled departures generated from route configurations.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `routeId` | `Int` | FK → Route | Associated route |
| `date` | `String` | — | Date string (YYYY-MM-DD) |
| `departureTime` | `String` | — | Scheduled departure time (HH:MM) |
| `status` | `String` | `@default("scheduled")` | `scheduled`, `cancelled`, `completed` |

**Relations:**
- `route` → `Route` (many-to-one)
- `crewAssignments` → `CrewAssignment[]` (one-to-many)
- `journeys` → `Journey[]` (one-to-many)

### 3.5 CrewAssignment

Links crew members to scheduled departures.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `scheduleId` | `Int` | FK → Schedule | Associated schedule |
| `crewId` | `Int` | FK → Profile | Assigned crew member |
| `status` | `String` | `@default("assigned")` | `assigned`, `accepted`, `declined`, `completed` |
| `assignedAt` | `DateTime` | `@default(now())` | When assigned |
| `completedAt` | `DateTime?` | — | When marked complete |

**Relations:**
- `schedule` → `Schedule` (many-to-one)
- `crew` → `Profile` (many-to-one)

### 3.6 HolidayRequest

Crew leave/vacation requests with approval workflow.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `crewId` | `Int` | FK → Profile | Requesting crew member |
| `startDate` | `String` | — | Leave start date (YYYY-MM-DD) |
| `endDate` | `String` | — | Leave end date (YYYY-MM-DD) |
| `reason` | `String` | — | Reason for leave |
| `status` | `String` | `@default("pending")` | `pending`, `approved`, `rejected` |
| `reviewedBy` | `Int?` | FK → Profile | Admin who reviewed |
| `reviewedAt` | `DateTime?` | — | Review timestamp |

**Relations:**
- `crew` → `Profile` (many-to-one)
- `reviewer` → `Profile` (many-to-one, optional)

### 3.7 Journey

Customer bus journey bookings.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `customerId` | `Int` | FK → Profile | Booking customer |
| `routeId` | `Int` | FK → Route | Booked route |
| `scheduleId` | `Int` | FK → Schedule | Booked schedule |
| `status` | `String` | `@default("confirmed")` | `confirmed`, `completed`, `cancelled` |
| `cost` | `Float` | — | Fare amount paid |
| `rating` | `Int?` | — | Customer rating (1–5 stars) |
| `feedback` | `String?` | — | Text feedback |
| `bookingDate` | `DateTime` | `@default(now())` | When booked |

**Relations:**
- `customer` → `Profile` (many-to-one)
- `route` → `Route` (many-to-one)
- `schedule` → `Schedule` (many-to-one)

### 3.8 TrafficAlert

Traffic incident reports created by drivers or admins.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `routeId` | `Int` | FK → Route | Affected route |
| `reporterId` | `Int` | FK → Profile | Reporter (driver/admin) |
| `type` | `String` | — | Alert type (accident, congestion, roadwork, weather, breakdown) |
| `severity` | `String` | — | `low`, `medium`, `high`, `critical` |
| `delayMinutes` | `Int` | — | Estimated delay in minutes |
| `message` | `String` | — | Description of the incident |
| `createdAt` | `DateTime` | `@default(now())` | Report timestamp |
| `resolvedAt` | `DateTime?` | — | Resolution timestamp |

**Relations:**
- `route` → `Route` (many-to-one)
- `reporter` → `Profile` (many-to-one)

### 3.9 Notification

User notifications for various system events.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `userId` | `Int` | FK → Profile | Target user |
| `type` | `String` | — | Notification type (assignment, alert, holiday, system) |
| `title` | `String` | — | Notification title |
| `message` | `String` | — | Notification body text |
| `isRead` | `Boolean` | `@default(false)` | Read status |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |

**Relations:**
- `user` → `Profile` (many-to-one)

### 3.10 AuditLog

System audit trail tracking all significant actions.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `tableName` | `String` | — | Affected database table |
| `action` | `String` | — | Action performed (CREATE, UPDATE, DELETE) |
| `userId` | `Int?` | FK → Profile | User who performed action |
| `details` | `String` | — | JSON string with action details |
| `timestamp` | `DateTime` | `@default(now())` | Action timestamp |

**Relations:**
- `user` → `Profile` (many-to-one, optional)

### 3.11 BusMaintenance

Vehicle servicing and maintenance records.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `busRegistration` | `String` | — | Vehicle registration number |
| `serviceType` | `String` | — | `routine`, `repair`, `inspection` |
| `date` | `String` | — | Service date (YYYY-MM-DD) |
| `cost` | `Float` | — | Service cost in INR |
| `nextServiceDate` | `String` | — | Next scheduled service date |
| `notes` | `String` | — | Additional notes |

**Relations:**
- `route` → `Route` (many-to-one, via busRegistration)

### 3.12 RouteAnalytics

Daily performance metrics per route.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `Int` | `@id @default(autoincrement())` | Primary key |
| `routeId` | `Int` | FK → Route | Associated route |
| `date` | `String` | — | Date string (YYYY-MM-DD) |
| `completionRate` | `Float` | — | Percentage of completed trips (0–100) |
| `revenue` | `Float` | — | Total revenue for the day |
| `delayMin` | `Int` | — | Average delay in minutes |
| `totalJourneys` | `Int` | — | Number of passenger journeys |

**Relations:**
- `route` → `Route` (many-to-one)

---

## 4. API Routes

The application exposes **14 API endpoint groups** via Next.js App Router API routes. All endpoints return JSON and use standard HTTP status codes.

### 4.1 POST `/api/auth`

Authentication and user management.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| `login` | POST | `{ action: "login", email, password }` | `{ user, token }` | Validates email/password with SHA-256 hash comparison. Returns user object and session token. |
| `register` | POST | `{ action: "register", email, password, name, role }` | `{ user, token }` | Creates new account with any role. Auto-generates UUID token. |
| `verify` | POST | `{ action: "verify", token }` | `{ user }` | Validates session token against stored tokens. Returns user if valid. |
| `logout` | POST | `{ action: "logout", token }` | `{ success }` | Removes token from user record, invalidating session. |
| `users` | POST | `{ action: "users", role? }` | `{ users[] }` | Lists all users. Optionally filter by role. Admin access for sensitive data. |
| `updateProfile` | POST | `{ action: "updateProfile", token, name, availability? }` | `{ user }` | Updates user name and/or availability status. |

### 4.2 GET/POST `/api/routes`

Bus route CRUD operations.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List routes | GET | `?city=&search=&routeNumber=` | `{ routes[], locations[], cities[] }` | Search/filter routes by city, location keyword, or route number. Returns location and city lists for dropdowns. |
| Create route | POST | `{ action: "create", routeNumber, startLocation, ... }` | `{ route }` | Creates a new bus route with all fields. |
| Update route | POST | `{ action: "update", id, ...fields }` | `{ route }` | Updates existing route fields. |
| Delete route | POST | `{ action: "delete", id }` | `{ success }` | Deletes a route by ID. |
| Toggle auto-schedule | POST | `{ action: "toggleAutoSchedule", id }` | `{ route }` | Enables/disables auto-schedule generation for a route. |

### 4.3 GET/POST `/api/schedules`

Schedule generation and management.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List schedules | GET | `?routeId=&date=&status=&crewId=` | `{ schedules[] }` | Lists schedules with optional filters. |
| Generate | POST | `{ action: "generate", date, startTime?, endTime?, frequency? }` | `{ created, skipped, time }` | Runs Greedy Time-Slot Assignment algorithm. Returns stats. |
| Cancel | POST | `{ action: "cancel", id }` | `{ success }` | Cancels a schedule, updating its status. |

### 4.4 GET/POST `/api/crew`

Crew management and assignment.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List crew | GET | `?specialization=&availability=` | `{ crew[] }` | Lists crew profiles with filters for specialization and availability. |
| Auto-assign | POST | `{ action: "autoAssign", date }` | `{ assignments[], fairnessIndex }` | Runs Multi-Criteria Scoring with Jain's Fairness Index. Returns assignments and fairness metric. |
| Respond | POST | `{ action: "respond", assignmentId, status }` | `{ assignment }` | Crew accepts or declines an assignment. |

### 4.5 GET/POST `/api/journeys`

Customer journey/bookings management.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List journeys | GET | `?customerId=&status=` | `{ journeys[] }` | Lists journeys with optional customer and status filters. |
| Spending stats | GET | `?action=spending&customerId=` | `{ total, avg, count }` | Returns spending statistics for a customer. |
| Book journey | POST | `{ action: "book", customerId, routeId, scheduleId }` | `{ journey }` | Creates a new booking. Sets cost from route fare. |
| Cancel journey | POST | `{ action: "cancel", id }` | `{ success }` | Cancels a booking, updating status. |
| Rate & feedback | POST | `{ action: "rate", id, rating, feedback }` | `{ journey }` | Adds star rating and text feedback to a journey. |

### 4.6 GET/POST `/api/traffic`

Traffic alert management.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List alerts | GET | `?routeId=&unresolved=true` | `{ alerts[] }` | Lists traffic alerts with optional filters. |
| Create alert | POST | `{ action: "create", routeId, reporterId, type, severity, delayMinutes, message }` | `{ alert, notified }` | Creates alert and **auto-notifies** affected customers who have bookings on the route. |
| Resolve alert | POST | `{ action: "resolve", id }` | `{ alert }` | Marks alert as resolved with timestamp. |

### 4.7 GET `/api/analytics`

Route analytics and dashboard statistics.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| Analytics data | GET | `?routeId=&city=&days=30` | `{ analytics[], summary }` | Returns route analytics with optional filters. |
| Daily trends | GET | `?action=trends&days=7` | `{ trends[] }` | Daily revenue and completion trends. |
| City breakdown | GET | `?action=cities` | `{ cities[] }` | Revenue and performance breakdown by city. |
| Dashboard overview | GET | `?action=dashboard` | `{ totalRoutes, activeSchedules, ... }` | Aggregated dashboard statistics. |

### 4.8 GET/POST `/api/holidays`

Holiday/leave request management.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List requests | GET | `?crewId=&status=` | `{ requests[] }` | Lists leave requests with optional filters. |
| Create request | POST | `{ action: "create", crewId, startDate, endDate, reason }` | `{ request }` | Creates leave request. **Checks for overlapping dates** before creating. |
| Review request | POST | `{ action: "review", id, status, reviewerId }` | `{ request }` | Approves or rejects request. **Auto-updates** crew availability on approval. Sends notification to crew member. |

### 4.9 GET/POST `/api/notifications`

Notification management.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List notifications | GET | `?userId=` | `{ notifications[] }` | Lists all notifications for a user. |
| Count unread | GET | `?action=count&userId=` | `{ count }` | Returns unread notification count. |
| Mark read | POST | `{ action: "markRead", id }` | `{ success }` | Marks a single notification as read. |
| Mark all read | POST | `{ action: "markAllRead", userId }` | `{ success }` | Marks all notifications for a user as read. |
| Create notification | POST | `{ action: "create", userId, type, title, message }` | `{ notification }` | Programmatically creates a notification. |

### 4.10 GET/POST `/api/maintenance`

Bus maintenance records.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List records | GET | `?busRegistration=` | `{ records[] }` | Lists maintenance records. Optionally filter by bus. |
| Upcoming services | GET | `?action=upcoming` | `{ records[] }` | Lists services with `nextServiceDate` in the future. |
| Create record | POST | `{ action: "create", busRegistration, serviceType, date, cost, nextServiceDate, notes }` | `{ record }` | Creates a new maintenance record. |

### 4.11 GET `/api/export`

CSV data export endpoint.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| Export data | GET | `?type=analytics\|routes\|crew\|journeys` | CSV file download | Returns CSV with `Content-Disposition: attachment` header. Different types export different data sets with appropriate column headers. |

### 4.12 GET `/api/traffic-predict`

Traffic delay prediction using historical data.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| Predict delay | GET | `?routeId=&hour=` | `{ predictedDelay, confidence, method }` | Runs Simple Exponential Smoothing algorithm with Time-of-Day Heuristics. Returns predicted delay in minutes and confidence score. |

### 4.13 GET `/api/route`

Catch-all route API (legacy/support).

### 4.14 WebSocket Notifications (Notification Service)

A standalone WebSocket server (`mini-services/notification-service/index.ts`) provides real-time notification streaming for the **Notification Ticker** feature visible on the customer dashboard.

---

## 5. Algorithms

### 5.1 Schedule Generation — Greedy Time-Slot Assignment with Constraint Propagation

This algorithm generates daily bus schedules from route configurations.

#### Algorithm Description

```
FUNCTION generateSchedules(date, globalStartTime?, globalEndTime?, globalFrequency?):
    startTime = performance.now()
    createdCount = 0
    skippedCount = 0

    FOR EACH route WHERE autoScheduleEnabled = true:
        routeStart = globalStartTime ?? route.startTime
        routeEnd   = globalEndTime   ?? route.endTime
        frequency  = globalFrequency ?? route.frequencyMinutes

        // Generate time slots from start to end at configured frequency
        currentSlot = parseTime(routeStart)
        endSlot     = parseTime(routeEnd)

        WHILE currentSlot <= endSlot:
            timeStr = formatTime(currentSlot)

            // CONSTRAINT PROPAGATION: Check for duplicate schedules
            existing = await prisma.schedule.findFirst({
                WHERE: { routeId: route.id, date, departureTime: timeStr }
            })

            IF existing NOT found:
                CREATE Schedule {
                    routeId: route.id,
                    date: date,
                    departureTime: timeStr,
                    status: "scheduled"
                }
                createdCount++
            ELSE:
                skippedCount++   // Skip duplicate to avoid conflicts

            currentSlot = addMinutes(currentSlot, frequency)

    endTime = performance.now()
    RETURN { created: createdCount, skipped: skippedCount, time: endTime - startTime }
```

#### Key Features
- **Constraint Propagation**: Before creating each schedule slot, checks for existing entries to prevent duplicates
- **Global Overrides**: Admin can override start time, end time, and frequency for bulk generation
- **Route Filtering**: Only processes routes with `autoScheduleEnabled = true`
- **Performance Tracking**: Returns creation count, skip count, and execution time in milliseconds

#### Complexity
- **Time**: O(R × S) where R = number of auto-schedule-enabled routes, S = average slots per route
- **Space**: O(N) where N = number of new schedules created

---

### 5.2 Crew Assignment — Multi-Criteria Scoring with Jain's Fairness Index

This algorithm automatically assigns the best driver and conductor to each unassigned schedule.

#### Algorithm Description

```
FUNCTION autoAssignCrew(date):
    unassignedSchedules = SELECT schedules
                          WHERE date = date
                          AND status = "scheduled"
                          AND NOT EXISTS (crewAssignment)

    // Track assignment counts for fairness calculation
    assignmentCounts = MAP<crewId, count>
    hoursWorked      = MAP<crewId, totalHours>

    assignments = []

    FOR EACH schedule IN unassignedSchedules:
        route = schedule.route

        // Find best DRIVER
        bestDriver = findBestCrew(
            specialization: "driver",
            schedule: schedule,
            assignmentCounts: assignmentCounts,
            hoursWorked: hoursWorked
        )

        // Find best CONDUCTOR
        bestConductor = findBestCrew(
            specialization: "conductor",
            schedule: schedule,
            assignmentCounts: assignmentCounts,
            hoursWorked: hoursWorked
        )

        IF bestDriver AND bestConductor:
            CREATE CrewAssignment { schedule, crew: bestDriver, status: "assigned" }
            CREATE CrewAssignment { schedule, crew: bestConductor, status: "assigned" }
            UPDATE assignmentCounts[bestDriver.id]++
            UPDATE assignmentCounts[bestConductor.id]++
            UPDATE hoursWorked[bestDriver.id] += route.durationMin
            UPDATE hoursWorked[bestConductor.id] += route.durationMin
            assignments.push({ schedule, driver: bestDriver, conductor: bestConductor })

    // Calculate Jain's Fairness Index
    counts = VALUES(assignmentCounts)
    fairnessIndex = jainsFairnessIndex(counts)

    RETURN { assignments, fairnessIndex }


FUNCTION findBestCrew(specialization, schedule, assignmentCounts, hoursWorked):
    candidates = SELECT crewProfiles
                 WHERE specialization = specialization
                 AND availability = "available"
                 AND hoursWorked[crewId] + schedule.route.durationMin <= crew.maxDailyHours

    IF candidates IS empty: RETURN null

    minAssignments = MIN(assignmentCounts[c.id] FOR c IN candidates)

    scoredCandidates = candidates MAP c => {
        // Fairness component (weight: 0.6)
        fairness = (assignmentCounts[c.id] == minAssignments) ? 1.0 : 0.3

        // Performance component (weight: 0.4)
        performance = c.performanceRating / 5.0    // Normalize to 0-1

        // Combined score
        score = 0.6 × fairness + 0.4 × performance

        RETURN { crew: c, score }
    }

    RETURN scoredCandidates.SORT BY score DESC[0].crew


FUNCTION jainsFairnessIndex(values):
    n   = LENGTH(values)
    sum = SUM(values)
    sumSq = SUM(v² FOR v IN values)
    J = (sum)² / (n × sumSq)
    RETURN J
```

#### Scoring Formula

```
┌─────────────────────────────────────────────────┐
│          Score = 0.6 × Fairness + 0.4 × Perf    │
│                                                   │
│  Fairness = 1.0  if crew has MINIMUM assignments  │
│           = 0.3  otherwise                        │
│                                                   │
│  Performance = crew.performanceRating / 5.0       │
│              (normalized to 0–1 scale)             │
└─────────────────────────────────────────────────┘
```

#### Jain's Fairness Index

```
┌─────────────────────────────────────────────────┐
│                  (Σ xᵢ)²                        │
│        J = ─────────────────                    │
│               n × Σ xᵢ²                        │
│                                                   │
│  where xᵢ = assignment count for crew member i   │
│  Range: [1/n, 1.0]                               │
│  1.0  = perfectly fair distribution              │
│  1/n  = maximally unfair (one person gets all)   │
└─────────────────────────────────────────────────┘
```

#### Constraints Enforced
- **Max Daily Hours**: Crew members are excluded if adding the route duration would exceed their `maxDailyHours` limit
- **Availability**: Only crew with `availability = "available"` are considered
- **Specialization**: Drivers assigned as drivers, conductors as conductors
- **No Double Assignment**: Each schedule gets exactly one driver and one conductor

---

### 5.3 Traffic Delay Prediction — Simple Exponential Smoothing

This algorithm predicts traffic delays based on historical alert data.

#### Algorithm Description

```
FUNCTION predictDelay(routeId, hour):
    // Fetch historical traffic alerts for this route
    alerts = SELECT trafficAlerts
             WHERE routeId = routeId
             AND resolvedAt IS NOT NULL
             ORDER BY createdAt DESC
             LIMIT 30

    // Group by date and compute daily average delays
    dailyDelays = MAP<date, avgDelay>
    FOR EACH alert IN alerts:
        date = alert.createdAt.toDateString()
        dailyDelays[date] = AVG(all delays for this date)

    IF dailyDelays.size < 3:
        // Insufficient data — fall back to route's traffic level
        RETURN {
            predictedDelay: routeBasedEstimate(route.trafficLevel),
            confidence: 0.5,
            method: "fallback_traffic_level"
        }

    // Simple Exponential Smoothing (α = 0.3)
    α = 0.3
    sortedDates = SORT(dailyDelays.keys)
    S = dailyDelays[sortedDates[0]]   // Initialize with first value

    FOR i = 1 TO sortedDates.length - 1:
        actual = dailyDelays[sortedDates[i]]
        S = α × actual + (1 - α) × S

    // Apply time-of-day heuristic multiplier
    timeMultiplier = getTimeMultiplier(hour)
    predictedDelay = S × timeMultiplier

    // Confidence score based on data point count
    confidence = MIN(0.95, MAX(0.5, dailyDelays.size / 20))

    RETURN { predictedDelay, confidence, method: "exponential_smoothing" }


FUNCTION getTimeMultiplier(hour):
    IF hour >= 7 AND hour <= 9:    RETURN 1.4   // Morning peak
    IF hour >= 17 AND hour <= 19:  RETURN 1.4   // Evening peak
    IF hour >= 10 AND hour <= 16:  RETURN 0.8   // Off-peak
    RETURN 1.0                               // Normal hours


FUNCTION routeBasedEstimate(trafficLevel):
    SWITCH trafficLevel:
        CASE "low":    RETURN 5   minutes
        CASE "medium": RETURN 12  minutes
        CASE "high":   RETURN 25  minutes
```

#### Exponential Smoothing Formula

```
┌─────────────────────────────────────────────────┐
│                                                   │
│    Sₜ = α × Actualₜ₋₁ + (1 - α) × Sₜ₋₁       │
│                                                   │
│    where α = 0.3 (smoothing factor)              │
│    Sₜ = smoothed value at time t                 │
│    Actualₜ₋₁ = observed value at time t-1        │
│                                                   │
│    Higher α → more responsive to recent changes   │
│    Lower α  → smoother, less volatile            │
│                                                   │
└─────────────────────────────────────────────────┘
```

#### Time-of-Day Multipliers

| Time Period | Hours | Multiplier | Rationale |
|---|---|---|---|
| **Morning Peak** | 7:00 AM – 9:00 AM | **1.4×** | School/office rush hour |
| **Evening Peak** | 5:00 PM – 7:00 PM | **1.4×** | Return commute rush |
| **Off-Peak** | 10:00 AM – 4:00 PM | **0.8×** | Lower traffic volume midday |
| **Normal** | All other hours | **1.0×** | Baseline prediction |

#### Confidence Scoring

| Data Points | Confidence | Interpretation |
|---|---|---|
| < 3 | 0.50 (minimum) | Insufficient data, uses fallback |
| 3 – 10 | 0.50 – 0.75 | Low confidence |
| 10 – 20 | 0.75 – 0.95 | Moderate confidence |
| 20+ | 0.95 (maximum) | High confidence |

---

## 6. Portal Pages and Features

### 6.1 Admin Portal (9 Pages)

#### 6.1.1 Dashboard

The admin dashboard serves as the command center for the entire system.

**Components:**
- **Welcome Banner** — Time-of-day greeting (Good Morning/Afternoon/Evening) with user name and date
- **4 Stat Cards** — Total Routes, Active Schedules, Crew Available, On-Time Rate — each with an icon and trend indicator
- **Quick Stats Ribbon** — Always visible across all admin pages showing key metrics
- **Weekly Schedule Completion** — SVG bar chart showing completion rates for each day of the week
- **System Health Status Panel** — Real-time status indicators for API, Database, Server, Users, and Uptime (all simulated healthy)
- **Broadcast Messaging** — Send announcements to user groups (All Users, Drivers, Conductors, Customers)
- **Recent Activity** — Timeline of latest system events
- **Recent Traffic Alerts** — List of latest unresolved alerts with severity badges
- **Quick Actions** — Icon cards for rapid navigation to key features

#### 6.1.2 Routes

Full CRUD management for the 115 bus routes.

**Features:**
- Searchable, sortable table showing route number, origin/destination cities, distance, and fare
- **Route Details Dialog** — Click any row to see full route information including the complete stops list
- **Create New Route** — Form with all route fields (number, stops, timing, fare, city, etc.)
- **Toggle Auto-Schedule** — Enable/disable automatic schedule generation per route
- **City Filter** — Dropdown to filter routes by city (Bangalore, Mumbai, Delhi, Chennai, Inter-city)

#### 6.1.3 Schedules

Schedule generation and management interface.

**Features:**
- **Date Picker** — Select target date for schedule generation
- **Custom Parameters** — Override global start time, end time, and frequency
- **Generate Button** — Executes the Greedy Time-Slot Assignment algorithm
- **Generation Stats** — Shows count of schedules created, duplicates skipped, and execution time
- **Schedule Table** — View all generated schedules with route info and status
- **Cancel Schedule** — Cancel individual schedules with confirmation dialog

#### 6.1.4 Crew

Crew member management and auto-assignment.

**Features:**
- **Crew Table** — List all drivers and conductors with key details
- **Auto-Assign Crew** — One-click assignment using the Multi-Criteria Scoring algorithm with Jain's Fairness Index
- **Assignment Results** — Shows total assignments made and fairness index score
- **Crew Details Dialog** — Click any row for full profile (experience, rating, license, assignments)
- **Filters** — By specialization (Driver/Conductor) and availability (Available/On Leave)

#### 6.1.5 Traffic

Traffic alert monitoring and management.

**Features:**
- **Alert Table** — All alerts with severity color badges (low=green, medium=yellow, high=orange, critical=red)
- **Create Alert** — Form to report new incidents (select route, type, severity, delay minutes, description)
- **Auto-Notification** — When an alert is created, all customers with bookings on the affected route automatically receive a notification
- **Resolve Alert** — Mark alerts as resolved
- **Filter** — Show only unresolved alerts

#### 6.1.6 Holidays

Leave request approval workflow.

**Features:**
- **Request Table** — All crew leave requests with status badges
- **Approve/Reject** — One-click review with reviewer tracking (who reviewed and when)
- **Auto-Update Availability** — Approved requests automatically set crew availability to `on_leave`
- **Auto-Notification** — Crew members are notified of approval or rejection decisions

#### 6.1.7 Analytics

Data analytics dashboard for business intelligence.

**Features:**
- **Revenue Summary Cards** — Total Revenue, Average per Route, Highest Earning Route
- **Top Performing Routes** — Horizontal bar chart (pure SVG) showing top 5 routes by revenue
- **Route Performance Matrix** — Color-coded table comparing route performance across cities (green = good, yellow = average, red = poor)
- **Daily Trends** — Line chart showing revenue and completion rates over time
- **City-Wise Breakdown** — Pie chart showing revenue distribution by city
- **CSV Export** — Download analytics data as CSV file

#### 6.1.8 Maintenance

Bus fleet maintenance tracking.

**Features:**
- **Maintenance Table** — All records with service type badges
- **Upcoming Services** — Dedicated section for services due soon
- **Create Record** — Form for logging new maintenance (bus registration, type, date, cost, notes)
- **Service Types** — Color-coded badges for Routine (blue), Repair (red), Inspection (green)

#### 6.1.9 Settings

System configuration panel.

**Features:**
- **General Settings** — App name, timezone, language, date format
- **Notification Settings** — Toggle Email, SMS, Push, and In-App notifications
- **Display Settings** — Default page, items per page, compact mode toggle, auto-refresh interval
- **API Settings** — API key, webhook URL, rate limit configuration
- **Danger Zone** — Reset all settings, export configuration as JSON
- **Persistence** — All settings saved to `localStorage` for persistence across sessions

---

### 6.2 Driver Portal (5 Pages + Fuel Log)

#### 6.2.1 Driver Dashboard

Personal overview for drivers.

**Features:**
- **Welcome Card** — Driver name with avatar
- **Digital Trip Manifest** — Current route info, passenger count, route progress bar
- **Shift Timer** — Circular SVG progress ring with Start/Pause/End controls
- **Weekly Hours Chart** — Bar chart (SVG) showing daily hours, color-coded by intensity
- **Route Performance** — Recent trips with on-time/late badges and weekly on-time rate percentage
- **Quick Actions** — Start Shift, End Shift, Report Issue, View Pay
- **Upcoming Assignments** — List of next scheduled work days

#### 6.2.2 My Assignments

Assigned schedule management.

**Features:**
- **Assignment List** — All assigned schedules with route details and timing
- **Accept/Decline** — Respond to new assignments
- **Pre-Trip Checklist** — 7-item interactive checklist:
  1. ✅ Vehicle Inspection
  2. ✅ Fuel Level Check
  3. ✅ Tire Condition
  4. ✅ Lights & Signals
  5. ✅ First Aid Kit
  6. ✅ Fire Extinguisher
  7. ✅ Ticket Machine
- **Quick Communication** — 4 preset message buttons:
  - 🚨 Running Late
  - 📍 Arrived at Stop
  - 🆘 Emergency
  - ☕ Break Request
- **Assignment Count Badges** — Visual indicators for pending/total assignments

#### 6.2.3 Calendar

Shift calendar view.

**Features:**
- **Calendar Grid** — Monthly calendar showing assigned dates with shift indicators
- **Shift Summary Cards** — Morning and Evening shifts displayed with time, route, hours, and overtime
- **Leave Dots** — Color-coded dots on calendar:
  - 🟢 Green = Approved leave
  - 🟡 Amber = Pending leave
  - 🔴 Red = Rejected leave

#### 6.2.4 Leave Requests

Leave management interface.

**Features:**
- **Leave Balance Cards** — Available days, Pending requests, Used days
- **Calendar Mini View** — Compact calendar with leave dots
- **Request Leave Dialog** — Date range pickers (start/end), reason textarea, with overlap validation

#### 6.2.5 Profile

Personal profile and earnings.

**Features:**
- **Cover Banner** — Gradient banner with avatar overlay
- **Stats Row** — Total Trips, Rating (stars), Experience (years)
- **Skills/Qualifications Tags** — Badges for certifications and skills
- **Edit Profile Dialog** — Update name and other details
- **Earnings Tracker** — 4 summary cards (Total Earnings, This Month, Last Month, Average) + 6-month SVG line chart
- **Professional Details** — License number, bus assigned, specialization

#### 6.2.6 Fuel Log

Dedicated fuel tracking page for recording fuel consumption and costs.

---

### 6.3 Conductor Portal (5 Pages + Fuel Log)

The conductor portal mirrors the driver portal structure with conductor-specific data and terminology. All 6 pages from the driver portal are available:

1. **Dashboard** — Conductor-specific overview with ticketing metrics
2. **My Assignments** — Same assignment management as drivers
3. **Calendar** — Same shift calendar as drivers
4. **Leave Requests** — Same leave management as drivers
5. **Profile** — Conductor-specific profile with earnings
6. **Fuel Log** — Fuel tracking page

---

### 6.4 Customer Portal (6 Pages)

#### 6.4.1 Customer Dashboard

Personal dashboard for bus passengers.

**Features:**
- **Gradient Welcome Card** — Personalized greeting with customer name
- **4 Stat Cards** — Total Journeys, Total Spent (₹), Average Rating, Routes Used
- **Spending Donut Chart** — SVG donut chart showing spending breakdown:
  - Bus Fares
  - Season Pass
  - Other
- **Favorite Routes** — Routes marked as favorites (persisted in `localStorage`)
- **Upcoming Journeys** — Next booked trips
- **CTA Cards** — "Search Routes" and "View Map" call-to-action cards

#### 6.4.2 Search Routes

Route discovery and booking interface.

**Features:**
- **Search Form** — From/To location inputs with city dropdown
- **Popular Routes** — Curated list of high-demand routes
- **Fare Calculator** — Calculate estimated fare for a route
- **Route Comparison** — Select 2–3 routes for side-by-side comparison (distance, duration, fare, stops)
- **Search Results** — Filtered route list with expandable details:
  - **Route Timeline** — Visual timeline showing all stops from origin to destination
  - **Bus Amenities** — Icons for WiFi, AC, Seating type, USB charging
  - **"Book Now" Button** — Shows fare and opens booking confirmation

#### 6.4.3 Route Map

Interactive map for visualizing routes.

**Features:**
- **Route Selector** — Dropdown to choose a route
- **Leaflet Map** — Interactive OpenStreetMap with:
  - **OSRM Polylines** — Road-following route lines (not straight lines)
  - **Color-Coded Markers** — Green for start, Red for end, Blue for intermediate stops
  - **Click Popups** — Stop name and order on click
- **Route Info Cards** — Distance, duration, fare displayed alongside map
- **Path Distance** — Actual road distance displayed

#### 6.4.4 My Bookings

Journey receipt management.

**Features:**
- **Journey Receipt Cards** — Ticket-style cards with:
  - **Tear-Line Effect** — CSS dashed line simulating a tear-off receipt
  - **QR Code Pattern** — Deterministic SVG QR code generated from journey ID (visual only, not scannable)
  - **Journey Details** — Route number, departure time, date, seat number, fare (₹)
  - **Status Badges** — Confirmed (blue), Planned (yellow), Completed (green), Cancelled (red)
  - **Cancel Booking** — Button to cancel confirmed bookings
  - **Download Receipt** — Export receipt data

#### 6.4.5 Journey History

Past journey review and rating.

**Features:**
- **Date Range Filter** — Collapsible filter panel with start/end date pickers
- **Filtered Stats** — Average Fare, Total Distance for the selected period
- **Star Rating Distribution** — SVG horizontal bar chart showing 1★ through 5★ rating counts
- **Journey List** — Past journeys with:
  - Route info and date
  - Rating stars (interactive — click to rate)
  - Feedback textarea
  - Submit rating button

#### 6.4.6 Support

Help and support page with FAQ, contact information, and guidance for using the system.

---

## 7. Key Components and UI Features

### 7.1 Login Page

A visually striking authentication page:

- **Glass-morphism Card** — Semi-transparent backdrop-blur card for the login form
- **Animated Gradient Mesh Background** — Flowing gradient animation using CSS keyframes
- **Floating Particles** — Animated dots drifting across the background
- **Animated Bus Route SVGs** — Decorative SVG illustrations of bus routes
- **Quick Demo Access Buttons** — One-click login buttons for each role (Admin, Driver, Conductor, Customer) pre-filled with credentials
- **"Create Account" Toggle** — Switch between login and registration forms
- **Remember Me** — Checkbox to save email for auto-fill on next visit

### 7.2 App Shell (Sidebar + Header)

The main application layout wrapping all portal content:

- **Collapsible Sidebar** — Full sidebar with icons+labels, collapses to icon-only mode. Active page highlighted with accent color. Role-specific navigation items.
- **Breadcrumbs** — Navigation path with clickable segments and Home icon
- **Live IST Clock** — Real-time Indian Standard Time display in the header
- **Notification Bell** — Bell icon with unread count badge. Click opens grouped notification dropdown (grouped by type).
- **Command Palette** — Open with `Ctrl+K` for keyboard-driven navigation. Search pages, actions, and settings.
- **Online Status Indicator** — Green dot showing "Online" status
- **Scroll Progress Indicator** — Thin progress bar at the top of the page showing scroll position
- **Responsive Mobile Sidebar** — Overlay sidebar triggered by hamburger menu on small screens

### 7.3 Error Boundary

Robust error handling:

- **Auto-Retry with Countdown** — Shows countdown timer (10 seconds) before auto-retrying failed renders
- **Error Log Export** — "Download Error Log" button exports error details as a JSON file for debugging

### 7.4 Toast Notifications

Global notification system:

- **Replaces All `alert()` Calls** — No native browser dialogs used anywhere in the app
- **Toast Variants** — Success (green), Error (red), Warning (yellow), Info (blue)
- **Auto-Dismiss** — Toasts auto-dismiss after configurable duration
- **Stackable** — Multiple toasts stack vertically

### 7.5 Notification Ticker

Real-time event stream:

- **WebSocket-Powered** — Connects to notification service via WebSocket
- **Scrolling Marquee** — Horizontal scrolling ticker showing latest events
- **Live Updates** — New notifications appear in real-time without page refresh

### 7.6 SVG Data Visualizations

All charts are built with pure SVG — no external chart library needed:

| Chart Type | Used In | Description |
|---|---|---|
| **Bar Chart** | Admin Dashboard, Driver Dashboard, Analytics | Vertical/horizontal bars for comparing values |
| **Donut Chart** | Customer Dashboard | Spending breakdown with center label |
| **Line Chart** | Driver Earnings, Analytics Trends | Connected data points showing trends over time |
| **Performance Matrix** | Analytics | Color-coded grid comparing metrics across dimensions |
| **Circular Progress** | Driver Shift Timer | SVG ring showing elapsed time |
| **Star Distribution** | Journey History | Horizontal bars for rating counts |

### 7.7 Dark Mode

- **Full Theme Support** — Every component supports both light and dark themes
- **System Preference Detection** — Respects OS-level dark mode setting via `prefers-color-scheme`
- **Manual Toggle** — Users can override system preference
- **Zero Flash** — Theme is determined before React hydration using `next-themes` script injection
- **CSS Variables** — Theme colors defined as Tailwind CSS custom properties

### 7.8 Responsive Design

Mobile-first responsive design with Tailwind CSS breakpoints:

| Breakpoint | Width | Target |
|---|---|---|
| Default | < 640px | Mobile phones |
| `sm:` | ≥ 640px | Large phones / small tablets |
| `md:` | ≥ 768px | Tablets |
| `lg:` | ≥ 1024px | Laptops |
| `xl:` | ≥ 1280px | Desktops |

Key responsive adaptations:
- Sidebar collapses to overlay on mobile
- Tables become horizontally scrollable
- Grid layouts shift from multi-column to single-column
- Font sizes and spacing adjust for smaller screens
- Touch-friendly tap targets on mobile

---

## 8. Authentication System

### 8.1 Password Hashing

```typescript
// SHA-256 hashing (demo purposes)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
```

> **Note**: SHA-256 is used for demo purposes. In production, bcrypt with salt rounds would be used for proper password security, as SHA-256 alone is vulnerable to rainbow table attacks without salting.

### 8.2 Session Management

- **Token-Based Sessions** — On successful login, a UUID v4 token is generated and stored in the user's `token` field in the database
- **In-Memory Validation** — Tokens are validated by querying the database (SQLite provides sufficient performance for this)
- **Token Expiry** — Tokens expire after 24 hours (enforced at verification time)
- **Client-Side Storage** — Token is stored in `localStorage` on the client and sent with every authenticated API request

### 8.3 Registration

- **All Roles Supported** — Registration allows creating accounts with any role (`admin`, `driver`, `conductor`, `customer`)
- **Auto-Token Generation** — A session token is automatically generated upon registration, enabling immediate login
- **Unique Email Enforcement** — Prisma's `@unique` constraint on email prevents duplicate accounts

### 8.4 Auto-Login

- **Remember Me** — When checked, the user's email is saved to `localStorage`
- **Auto-Fill** — On next visit, the email field is pre-populated from `localStorage`
- **Quick Demo Buttons** — Pre-filled login forms for demo accounts bypass manual entry entirely

---

## 9. Seed Data

The database is pre-populated with realistic data for demonstration purposes.

### 9.1 User Accounts (205 total)

| Role | Count | Email Pattern | Password |
|---|---|---|---|
| Admin | 1 | `admin@bus.com` | `password123` |
| Drivers | 60 | `driver1@bus.com` – `driver60@bus.com` | `password123` |
| Conductors | 44 | `conductor1@bus.com` – `conductor44@bus.com` | `password123` |
| Customers | 100 | `customer1@bus.com` – `customer100@bus.com` | `password123` |

### 9.2 Bus Routes (115 total)

| City | Routes | Route Number Pattern |
|---|---|---|
| Bangalore (BLR) | 50 | `BLR-001` – `BLR-050` |
| Mumbai (MUM) | 20 | `MUM-001` – `MUM-020` |
| Delhi (DEL) | 15 | `DEL-001` – `DEL-015` |
| Chennai (CHN) | 15 | `CHN-001` – `CHN-015` |
| Inter-city | 15 | `IC-001` – `IC-015` |

### 9.3 Deterministic PRNG

All seed data uses a **seeded pseudo-random number generator** with seed value `42` for reproducibility:

```typescript
// Deterministic PRNG (Mulberry32)
function seededRandom(seed: number): () => number {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

const random = seededRandom(42);
```

This ensures the same data is generated every time `npx prisma db seed` is run.

### 9.4 Realistic Data Generation

- **Indian Names** — Generated from curated lists of Indian first and last names (e.g., Arjun Sharma, Priya Patel, Vikram Reddy, Ananya Iyer)
- **Real Locations** — Actual Bangalore, Mumbai, Delhi, and Chennai locations used as bus stops (e.g., Majestic Bus Stand, Shivaji Nagar, MG Road, Koramangala)
- **Accurate Coordinates** — Real latitude/longitude values for map rendering
- **Varied Route Properties** — Distances (5–85 km), durations (15–180 min), fares (₹10–₹350), and traffic levels randomized within realistic ranges

### 9.5 Additional Seed Data

- **Schedules** — Pre-generated for several dates to demonstrate the scheduling system
- **Journeys** — Sample bookings with various statuses (confirmed, completed, cancelled)
- **Traffic Alerts** — Sample alerts across different routes and severities
- **Route Analytics** — Historical performance data for the analytics dashboard
- **Bus Maintenance** — Sample maintenance records for various buses
- **Notifications** — Sample notifications for demo accounts
- **Holiday Requests** — Sample leave requests (some approved, some pending)

---

## 10. File Structure

The project follows a standard Next.js App Router structure with clear separation between API routes, components, and configuration.

### 10.1 Root Configuration Files

```
my-project/
├── package.json              # Dependencies and scripts
├── package-lock.json         # Lock file for npm
├── bun.lock                  # Lock file for Bun
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.mjs        # PostCSS configuration
├── components.json           # shadcn/ui configuration
├── eslint.config.mjs         # ESLint configuration
├── Caddyfile                 # Caddy reverse proxy config
├── CREDENTIALS.txt           # All demo account credentials
├── README.md                 # Project README
├── db/
│   └── custom.db             # SQLite database file (generated)
└── download/                 # Screenshots and documentation exports
```

### 10.2 Source Code (`src/`)

```
src/
├── app/
│   ├── layout.tsx            # Root layout (ThemeProvider, fonts, metadata)
│   ├── page.tsx              # Main application (~2,300 lines)
│   │                          # - Login page
│   │                          # - App shell with sidebar
│   │                          # - Role-based portal rendering
│   ├── globals.css           # Global styles + Tailwind directives
│   └── api/
│       ├── auth/route.ts     # Authentication API
│       ├── routes/route.ts   # Routes CRUD API
│       ├── schedules/route.ts# Schedules API
│       ├── crew/route.ts     # Crew management API
│       ├── journeys/route.ts # Journey/bookings API
│       ├── traffic/route.ts  # Traffic alerts API
│       ├── analytics/route.ts# Analytics API
│       ├── holidays/route.ts # Holiday requests API
│       ├── notifications/route.ts # Notifications API
│       ├── maintenance/route.ts   # Maintenance API
│       ├── export/route.ts   # CSV export API
│       ├── traffic-predict/route.ts # Traffic prediction API
│       └── route.ts          # Catch-all route API
│
├── components/
│   ├── admin/
│   │   └── admin-content.tsx # Admin portal (~3,600 lines)
│   │                          # 9 pages: Dashboard, Routes, Schedules,
│   │                          # Crew, Traffic, Holidays, Analytics,
│   │                          # Maintenance, Settings
│   ├── customer/
│   │   └── customer-content.tsx # Customer portal (~2,500 lines)
│   │                          # 6 pages: Dashboard, Search Routes,
│   │                          # Route Map, My Bookings, Journey
│   │                          # History, Support
│   ├── crew/
│   │   └── crew-content.tsx  # Crew portal (~3,200 lines)
│   │                          # 6 pages per role: Dashboard, My
│   │                          # Assignments, Calendar, Leave Requests,
│   │                          # Profile, Fuel Log
│   └── ui/                   # 40+ shadcn/ui components
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input.tsx
│       ├── input-otp.tsx
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       ├── toggle.tsx
│       ├── toggle-group.tsx
│       ├── tooltip.tsx
│       └── alert-dialog.tsx
│
├── hooks/
│   ├── use-mobile.ts        # Mobile viewport detection hook
│   └── use-toast.ts         # Toast notification hook
│
├── lib/
│   ├── db.ts                # Prisma client singleton
│   └── utils.ts             # Utility functions (cn, formatters)
│
└── types/
    └── index.ts             # TypeScript type definitions
```

### 10.3 Prisma (`prisma/`)

```
prisma/
├── schema.prisma            # Database schema (12 models)
└── seed.ts                  # Data seeding script (~500+ lines)
                              # - Deterministic PRNG
                              # - 205 user accounts
                              # - 115 bus routes
                              # - Crew profiles
                              # - Schedules, journeys, analytics
                              # - Traffic alerts, maintenance records
                              # - Notifications, audit logs
```

### 10.4 Mini-Services

```
mini-services/
└── notification-service/
    ├── package.json          # Service dependencies
    ├── bun.lock              # Lock file
    └── index.ts              # WebSocket notification server
                               # Real-time notification streaming
                               # for the Notification Ticker feature
```

### 10.5 Line Count Summary

| File | Lines | Purpose |
|---|---|---|
| `src/components/admin/admin-content.tsx` | ~3,600 | Admin portal (9 pages) |
| `src/components/crew/crew-content.tsx` | ~3,200 | Crew portal (6 pages × 2 roles) |
| `src/app/page.tsx` | ~2,300 | Main app (login + app shell + routing) |
| `src/components/customer/customer-content.tsx` | ~2,500 | Customer portal (6 pages) |
| `prisma/seed.ts` | ~500+ | Database seeding |
| API routes (14 files) | ~100–300 each | Backend endpoints |
| UI components (40+ files) | ~50–200 each | shadcn/ui components |
| **Total** | **~11,600+** | **Entire codebase** |

---

## Appendix A: Quick Start

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

## Appendix B: Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bus.com` | `password123` |
| Driver | `driver1@bus.com` | `password123` |
| Conductor | `conductor1@bus.com` | `password123` |
| Customer | `customer1@bus.com` | `password123` |

> Full credential list available in `CREDENTIALS.txt`.

## Appendix C: API Response Format

All API endpoints return responses in the following format:

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}

// Error
{
  "success": false,
  "error": "Error description"
}
```

---

*BusTrack Pro — Comprehensive Bus Route & Crew Management System*
*Built with Next.js 16 · Prisma ORM · SQLite · TypeScript · Tailwind CSS 4 · shadcn/ui*
