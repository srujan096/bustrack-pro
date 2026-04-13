# BusTrack Pro — Comprehensive Technical Guide

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

**BusTrack Pro** is a comprehensive Bus Route & Crew Management System designed to simulate real-world public transport operations across India. The system provides end-to-end management of bus routes, crew (drivers and conductors), scheduling, customer bookings, traffic monitoring, fleet maintenance, and user account administration with an approval workflow.

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
| **Account Approval** | Admin approval workflow for new admin/driver/conductor registrations |
| **Support Tickets** | Customer support ticket system with priority management |
| **Announcements** | System-wide broadcast announcements for all user roles |

### Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────┐
│                     BusTrack Pro (Next.js 16)                   │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Admin   │  │  Driver  │  │ Conductor  │  │   Customer   │  │
│  │  Portal  │  │  Portal  │  │   Portal   │  │    Portal    │  │
│  │ (11 pg)  │  │  (6 pg)  │  │   (6 pg)   │  │    (6 pg)    │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └──────┬───────┘  │
│       │              │              │                 │          │
│       └──────────────┴──────┬───────┴─────────────────┘          │
│                             │                                    │
│                    ┌────────▼────────┐                           │
│                    │   API Routes    │                           │
│                    │  (18 endpoints) │                           │
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
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  WebSocket Notification Service (mini-services, port 3003) │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

Each technology was selected for specific technical reasons that benefit the project's requirements.

### 2.1 Core Framework

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **Next.js 16** | 16.x | Full-stack React framework | Modern React framework with server-side rendering (SSR), API routes, file-based routing, and built-in optimizations. The App Router provides better code splitting, React Server Components, and streaming — reducing Time-to-First-Byte (TTFB) and improving perceived performance. |
| **TypeScript** | 5.x | Type-safe JavaScript | Strongly typed language that catches errors at compile time rather than runtime. Provides superior IDE support with auto-completion, refactoring tools, and inline documentation. Essential for maintaining a large codebase across multiple developers. |
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
| **date-fns** | Date manipulation | Lightweight, modular date library — import only the functions you need (`format`, `addDays`, `isAfter`, `subDays`, etc.). Consistent function naming, immutable operations, and excellent TypeScript support. Tree-shakeable for minimal bundle size. |
| **zod** | Schema validation | TypeScript-first schema validation library. Used for form validation and API input validation. Provides `z.string().email()`, `z.number().min()`, `z.enum()`, etc. Auto-infers TypeScript types from schemas. |
| **zustand** | Client state management | Lightweight state management with minimal boilerplate (no providers, no context). Used for client-side global state like notification bell state, sidebar collapse, and user preferences. Simpler API than Redux with comparable functionality. |
| **TanStack Query** | Server state management | Manages server state with automatic caching, background refetching, stale-while-revalidate, and optimistic updates. Eliminates manual loading/error state tracking. Provides `useQuery` and `useMutation` hooks for declarative data fetching. |

---

## 3. Database Schema

The database consists of **15 tables** defined in Prisma schema (`prisma/schema.prisma`). All relationships use SQLite foreign keys with cascading deletes where appropriate. Primary keys use CUID (Collision-resistant Unique Identifiers) strings instead of auto-incrementing integers for distributed-systems compatibility.

### Entity-Relationship Overview

```
Profile ──┬── CrewProfile
          │     └── CrewNote[]
          ├── Journey (as customer)
          ├── CrewAssignment
          ├── HolidayRequest
          ├── TrafficAlert (as reporter)
          ├── Notification
          ├── AuditLog
          └── SupportTicket

Route ──┬── Schedule
        ├── Journey
        ├── TrafficAlert
        ├── RouteAnalytics

Schedule ──┬── CrewAssignment
           └── Journey

Announcement (standalone, role-targeted)
```

### 3.1 Profile (User Accounts)

The central user table. Stores authentication credentials, basic profile information, and account approval status.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key (CUID string) |
| `email` | `String` | `@unique` | Login email address |
| `password` | `String` | — | SHA-256 hashed password |
| `role` | `String` | `@default("customer")` | User role: `admin`, `driver`, `conductor`, `customer` |
| `name` | `String` | — | Display name |
| `approvalStatus` | `String` | `@default("approved")` | Account approval status: `pending`, `approved`, `rejected` |
| `phone` | `String` | `@default("")` | Phone number |
| `createdAt` | `DateTime` | `@default(now())` | Account creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

**Relations:**
- `crewProfile` → `CrewProfile` (one-to-one, for drivers/conductors)
- `journeys` → `Journey[]` (one-to-many, as customer)
- `crewAssignments` → `CrewAssignment[]` (one-to-many, as assigned crew)
- `holidayRequests` → `HolidayRequest[]` (one-to-many, as requesting crew)
- `trafficReports` → `TrafficAlert[]` (one-to-many, as reporter)
- `notifications` → `Notification[]` (one-to-many)
- `auditLogs` → `AuditLog[]` (one-to-many, as acting user)
- `supportTickets` → `SupportTicket[]` (one-to-many, as ticket creator)

### 3.2 CrewProfile

Extended profile for drivers and conductors with professional details.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `profileId` | `String` | `@unique`, FK → Profile | Reference to user account |
| `specialization` | `String` | `@default("driver")` | `driver` or `conductor` |
| `licenseNo` | `String` | `@default("")` | Driving license number |
| `experienceYears` | `Int` | `@default(1)` | Years of experience |
| `performanceRating` | `Float` | `@default(4.0)` | Rating 0.0 – 5.0 |
| `availability` | `String` | `@default("available")` | `available`, `on_leave`, or `unavailable` |
| `maxDailyHours` | `Int` | `@default(8)` | Maximum shift hours per day |
| `busNumber` | `String` | `@default("")` | Assigned bus registration number |

**Relations:**
- `profile` → `Profile` (many-to-one, with cascade delete)
- `notes` → `CrewNote[]` (one-to-many)

### 3.3 CrewNote

Daily notes and observations recorded by crew members.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `crewId` | `String` | FK → CrewProfile | Reference to crew profile |
| `date` | `String` | — | Note date (YYYY-MM-DD format) |
| `content` | `String` | — | Note text content |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

**Constraints:** `@@unique([crewId, date])` — only one note per crew member per date.

**Relations:**
- `crew` → `CrewProfile` (many-to-one, with cascade delete)

### 3.4 Route

Bus route definitions with stops, timing, and metadata.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `routeNumber` | `String` | `@unique` | Route identifier (e.g., `BLR-001`) |
| `startLocation` | `String` | — | Origin stop name |
| `endLocation` | `String` | — | Destination stop name |
| `stopsJson` | `String` | `@default("[]")` | JSON array of stops `[{name, lat, lng}]` |
| `distanceKm` | `Float` | `@default(0)` | Total route distance in kilometers |
| `durationMin` | `Int` | `@default(0)` | Estimated duration in minutes |
| `fare` | `Float` | `@default(0)` | Base fare in INR |
| `trafficLevel` | `String` | `@default("low")` | `low`, `medium`, or `high` |
| `autoScheduleEnabled` | `Boolean` | `@default(false)` | Enable auto-schedule generation |
| `startTime` | `String` | `@default("05:00")` | First departure time (HH:MM) |
| `endTime` | `String` | `@default("22:00")` | Last departure time (HH:MM) |
| `frequencyMinutes` | `Int` | `@default(30)` | Minutes between departures |
| `busRegistration` | `String` | `@default("")` | Vehicle registration number |
| `city` | `String` | `@default("BLR")` | City: `BLR`, `MUM`, `DEL`, `CHN`, `IC` |
| `mapAvailable` | `Boolean` | `@default(false)` | Whether OSRM map polyline is available |

**Relations:**
- `schedules` → `Schedule[]` (one-to-many)
- `journeys` → `Journey[]` (one-to-many)
- `trafficAlerts` → `TrafficAlert[]` (one-to-many)
- `routeAnalytics` → `RouteAnalytics[]` (one-to-many)

### 3.5 Schedule

Timetabled departures generated from route configurations.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `routeId` | `String` | FK → Route | Associated route |
| `date` | `String` | — | Date string (YYYY-MM-DD) |
| `departureTime` | `String` | — | Scheduled departure time (HH:MM) |
| `status` | `String` | `@default("scheduled")` | `scheduled`, `in_progress`, `completed`, `cancelled` |
| `createdAt` | `DateTime` | `@default(now())` | Schedule creation timestamp |

**Relations:**
- `route` → `Route` (many-to-one, with cascade delete)
- `crewAssignments` → `CrewAssignment[]` (one-to-many)
- `journeys` → `Journey[]` (one-to-many)

### 3.6 CrewAssignment

Links crew members to scheduled departures.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `scheduleId` | `String` | FK → Schedule | Associated schedule |
| `crewId` | `String` | FK → Profile | Assigned crew member |
| `status` | `String` | `@default("pending")` | `pending`, `accepted`, `declined`, `completed` |
| `assignedAt` | `DateTime` | `@default(now())` | When assigned |
| `completedAt` | `DateTime?` | — | When marked complete |

**Relations:**
- `schedule` → `Schedule` (many-to-one, with cascade delete)
- `crew` → `Profile` (many-to-one, with cascade delete)

### 3.7 HolidayRequest

Crew leave/vacation requests with approval workflow.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `crewId` | `String` | FK → Profile | Requesting crew member |
| `startDate` | `String` | — | Leave start date (YYYY-MM-DD) |
| `endDate` | `String` | — | Leave end date (YYYY-MM-DD) |
| `reason` | `String` | `@default("")` | Reason for leave |
| `status` | `String` | `@default("pending")` | `pending`, `approved`, `rejected` |
| `reviewedBy` | `String?` | — | Admin who reviewed (user ID string) |
| `reviewedAt` | `DateTime?` | — | Review timestamp |

**Relations:**
- `crew` → `Profile` (many-to-one, with cascade delete)

### 3.8 Journey

Customer bus journey bookings.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `customerId` | `String` | FK → Profile | Booking customer |
| `routeId` | `String` | FK → Route | Booked route |
| `scheduleId` | `String` | FK → Schedule | Booked schedule |
| `status` | `String` | `@default("planned")` | `planned`, `completed`, `cancelled` |
| `cost` | `Float` | `@default(0)` | Fare amount paid |
| `rating` | `Int?` | — | Customer rating (1–5 stars) |
| `feedback` | `String` | `@default("")` | Text feedback |
| `bookingDate` | `DateTime` | `@default(now())` | When booked |

**Relations:**
- `customer` → `Profile` (many-to-one, "CustomerJourneys", with cascade delete)
- `route` → `Route` (many-to-one, with cascade delete)
- `schedule` → `Schedule` (many-to-one, with cascade delete)

### 3.9 TrafficAlert

Traffic incident reports created by drivers or admins.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `routeId` | `String` | FK → Route | Affected route |
| `reporterId` | `String` | FK → Profile | Reporter (driver/admin) |
| `type` | `String` | `@default("congestion")` | Alert type: `congestion`, `accident`, `road_closure`, `weather` |
| `severity` | `String` | `@default("low")` | `low`, `medium`, `high`, `critical` |
| `delayMinutes` | `Int` | `@default(0)` | Estimated delay in minutes |
| `message` | `String` | `@default("")` | Description of the incident |
| `createdAt` | `DateTime` | `@default(now())` | Report timestamp |
| `resolvedAt` | `DateTime?` | — | Resolution timestamp |

**Relations:**
- `route` → `Route` (many-to-one, with cascade delete)
- `reporter` → `Profile` (many-to-one, with cascade delete)

### 3.10 Notification

User notifications for various system events.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `userId` | `String` | FK → Profile | Target user |
| `type` | `String` | `@default("info")` | Notification type: `info`, `warning`, `success`, `error` |
| `title` | `String` | `@default("")` | Notification title |
| `message` | `String` | `@default("")` | Notification body text |
| `isRead` | `Boolean` | `@default(false)` | Read status |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |

**Relations:**
- `user` → `Profile` (many-to-one, with cascade delete)

### 3.11 AuditLog

System audit trail tracking all significant actions.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `tableName` | `String` | `@default("")` | Affected database table |
| `action` | `String` | `@default("")` | Action performed (CREATE, UPDATE, DELETE) |
| `userId` | `String` | `@default("")` | User who performed action |
| `details` | `String` | `@default("")` | JSON string with action details |
| `timestamp` | `DateTime` | `@default(now())` | Action timestamp |

**Relations:**
- `user` → `Profile` (many-to-one, with cascade delete)

### 3.12 BusMaintenance

Vehicle servicing and maintenance records.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `busRegistration` | `String` | — | Vehicle registration number |
| `serviceType` | `String` | `@default("routine")` | `routine`, `repair`, `inspection` |
| `date` | `String` | — | Service date (YYYY-MM-DD) |
| `cost` | `Float` | `@default(0)` | Service cost in INR |
| `nextServiceDate` | `String` | `@default("")` | Next scheduled service date |
| `notes` | `String` | `@default("")` | Additional notes |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |

### 3.13 RouteAnalytics

Daily performance metrics per route.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `routeId` | `String` | FK → Route | Associated route |
| `date` | `String` | — | Date string (YYYY-MM-DD) |
| `completionRate` | `Float` | `@default(0)` | Percentage of completed trips (0–100) |
| `revenue` | `Float` | `@default(0)` | Total revenue for the day |
| `delayMin` | `Int` | `@default(0)` | Average delay in minutes |
| `totalJourneys` | `Int` | `@default(0)` | Number of passenger journeys |

**Relations:**
- `route` → `Route` (many-to-one, with cascade delete)

### 3.14 SupportTicket

Customer support ticket system for handling inquiries, complaints, and feedback.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `userId` | `String` | FK → Profile | Ticket creator |
| `title` | `String` | — | Ticket title/subject |
| `description` | `String` | — | Detailed description |
| `category` | `String` | `@default("general")` | `general`, `refund`, `complaint`, `suggestion`, `safety` |
| `status` | `String` | `@default("open")` | `open`, `in_progress`, `resolved`, `closed` |
| `priority` | `String` | `@default("normal")` | `low`, `normal`, `high`, `urgent` |
| `createdAt` | `DateTime` | `@default(now())` | Ticket creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

**Constraints:** `@@index([userId])`, `@@index([status])`

**Relations:**
- `user` → `Profile` (many-to-one)

### 3.15 Announcement

System-wide broadcast announcements for communicating with specific user roles.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | `String` | `@id @default(cuid())` | Primary key |
| `title` | `String` | — | Announcement title |
| `message` | `String` | — | Announcement body text |
| `type` | `String` | `@default("info")` | `info`, `warning`, `success`, `urgent` |
| `role` | `String` | `@default("all")` | Target role: `all`, `admin`, `driver`, `conductor`, `customer` |
| `active` | `Boolean` | `@default(true)` | Whether the announcement is currently visible |
| `createdAt` | `DateTime` | `@default(now())` | Creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

---

## 4. API Routes

The application exposes **18 API endpoint groups** via Next.js App Router API routes. All endpoints return JSON and use standard HTTP status codes. Authentication is token-based via an in-memory token store with 24-hour expiration.

### 4.1 POST `/api/auth`

Authentication and user management including the account approval workflow.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| `login` | POST | `{ action: "login", email, password }` | `{ user, token }` | Validates email/password with SHA-256 hash comparison. Checks `approvalStatus` — blocks `pending` and `rejected` accounts with descriptive error messages. Returns user object and 64-byte hex session token. |
| `register` | POST | `{ action: "register", email, password, name, role, phone? }` | `{ user, message }` | Creates new account. Sets `approvalStatus: "pending"` for `admin`, `driver`, `conductor` roles. Customer accounts are auto-approved. Auto-creates CrewProfile for driver/conductor. |
| `verify` | POST | `{ action: "verify", token }` | `{ user }` | Validates session token against in-memory token store. Checks 24-hour expiration. Returns user if valid. |
| `logout` | POST | `{ action: "logout", token }` | `{ success }` | Removes token from in-memory store, invalidating session immediately. |
| `users` | POST | `{ action: "users", token, role? }` | `{ users[] }` | Lists all users. Optionally filter by role. Token required. |
| `updateProfile` | POST | `{ action: "updateProfile", token, userId?, name?, availability? }` | `{ user }` | Updates user name and/or crew availability status. Token required. |
| `pendingUsers` | POST | `{ action: "pendingUsers", token }` | `{ users[] }` | Lists all users with `approvalStatus: "pending"`. Admin action. |
| `approveUser` | POST | `{ action: "approveUser", token, userId, status }` | `{ user, message }` | Approves or rejects a pending user. Creates CrewProfile on approval. Sends notification to user about decision. |
| `deleteUser` | POST | `{ action: "deleteUser", token, userId }` | `{ message }` | Deletes a user account. Admin action. |

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
| List schedules | GET | `?routeId=&date=&status=&crewId=` | `{ schedules[] }` | Lists schedules with optional filters. Includes related route and crew assignment data. |
| Generate | POST | `{ action: "generate", date, startTime?, endTime?, frequency? }` | `{ created, skipped, time }` | Runs Greedy Time-Slot Assignment algorithm. Returns stats. |
| Cancel | POST | `{ action: "cancel", id }` | `{ success }` | Cancels a schedule, updating its status. |

### 4.4 GET/POST `/api/crew`

Crew management and assignment.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List crew | GET | `?specialization=&availability=` | `{ crew[] }` | Lists crew profiles with filters for specialization and availability. Includes related profile data. |
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

### 4.13 GET/POST `/api/users`

Dedicated user management endpoint for admin operations.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List all users | GET | `?role=&status=` | `{ users[] }` | Lists users with optional role and approval status filters. |
| User stats | GET | `?action=stats` | `{ total, byRole, pending }` | Returns user statistics and counts. |

### 4.14 GET/POST `/api/crew-notes`

Crew daily notes and observations.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List notes | GET | `?crewId=&date=` | `{ notes[] }` | Lists crew notes. Filterable by crew member and date. |
| Create note | POST | `{ crewId, date, content }` | `{ note }` | Creates a daily note. Enforces unique crew+date constraint. |
| Update note | POST | `{ action: "update", id, content }` | `{ note }` | Updates an existing note. |

### 4.15 GET/POST `/api/announcements`

System broadcast announcements.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List announcements | GET | `?role=&active=true` | `{ announcements[] }` | Lists announcements filterable by target role and active status. |
| Create announcement | POST | `{ title, message, type, role, active? }` | `{ announcement }` | Creates a new broadcast announcement. |
| Update announcement | POST | `{ action: "update", id, active? }` | `{ announcement }` | Toggles or updates announcement. |

### 4.16 GET/POST `/api/support-tickets`

Customer support ticket system.

| Action | Method | Parameters | Response | Description |
|---|---|---|---|---|
| List tickets | GET | `?userId=&status=&priority=` | `{ tickets[] }` | Lists support tickets with optional filters. |
| Create ticket | POST | `{ userId, title, description, category, priority? }` | `{ ticket }` | Creates a new support ticket. |
| Update ticket | POST | `{ action: "update", id, status? }` | `{ ticket }` | Updates ticket status. |

### 4.17 GET `/api/route`

Catch-all route API (legacy/support).

### 4.18 WebSocket Notifications (Notification Service)

A standalone WebSocket server (`mini-services/notification-service/index.ts`) provides real-time notification streaming for the **Notification Ticker** feature visible on the customer dashboard. Runs on a dedicated port (3003) and is accessed via the Caddy gateway using `XTransformPort` query parameter.

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

### 6.1 Admin Portal (11 Pages)

#### 6.1.1 Dashboard

The admin dashboard serves as the command center for the entire system with rich data visualizations and operational overview.

**Components:**
- **Welcome Banner** — Time-of-day greeting (Good Morning/Afternoon/Evening) with user name and date
- **4 Stat Cards** — Total Routes, Active Schedules, Crew Available, On-Time Rate — each with an icon and trend indicator
- **Quick Stats Ribbon** — Always visible across all admin pages showing key metrics (Total Routes 115, Active Schedules 64, Crew Available 89, On-Time Rate 94.2%)
- **Weekly Schedule Completion** — SVG bar chart showing completion rates for each day of the week with emerald gradient fills
- **System Health Status Panel** — Real-time status indicators for API (Operational), Database (Connected), Last Sync, Active Users (23), Server Uptime (99.7%) — all with animated green ping dots
- **Broadcast Messaging** — Dialog for sending announcements with title, message, priority selector (Low/Normal/High/Urgent), and audience dropdown (All Users/Drivers/Conductors/Customers). Tracks recent broadcasts with delivery status
- **Live Fleet Tracker** — SVG visualization with 7 concentric route circles, animated bus dots orbiting routes using `<animateTransform>`, pulsing outer rings, and radial glow background
- **Passenger Analytics** — SVG area chart with 24-hour timeline showing peak hours at 8 AM and 6 PM, gradient fill, and stat cards (Peak Hour, Average Load, Total Today)
- **Recent Traffic Alerts** — List of latest unresolved alerts with severity badges
- **Quick Actions** — Icon cards for rapid navigation to key features
- **Recent Activity** — Timeline of latest system events

#### 6.1.2 Users

User account management with search, filtering, and role-based views.

**Features:**
- **User Table** — All registered users with name, email, role badge, approval status badge, and join date
- **Search & Filter** — Text search by name/email, filter by role (All/Admin/Driver/Conductor/Customer) and approval status (All/Approved/Pending/Rejected)
- **User Stats Bar** — Counts showing total users, pending approvals, and role distribution
- **Role-Based Color Coding** — Visual badges with role-specific colors
- **Approval Status Indicators** — Green checkmark for approved, amber clock for pending, red X for rejected

#### 6.1.3 Approve IDs

Dedicated account approval workflow page for managing new registration requests.

**Features:**
- **Pending Accounts Table** — Lists all users with `approvalStatus: "pending"` showing name, email, requested role, registration date
- **Approve/Reject Actions** — One-click buttons to approve or reject each pending account with confirmation
- **Auto-Notification** — Upon approval/rejection, a notification is created for the user informing them of the decision
- **Auto CrewProfile Creation** — When approving a driver/conductor, a CrewProfile is automatically created if one doesn't already exist
- **Empty State** — "All caught up! No pending approvals." message when no accounts need review

#### 6.1.4 Routes

Full CRUD management for the 115 bus routes.

**Features:**
- **Searchable, Sortable Table** — Route number, origin/destination cities, distance, fare, traffic level, auto-schedule status
- **Route Details Dialog** — Click any row to see full route information including the complete stops list
- **Create New Route** — Form with all route fields (number, stops, timing, fare, city, etc.)
- **Toggle Auto-Schedule** — Enable/disable automatic schedule generation per route
- **City Filter** — Dropdown to filter routes by city (Bangalore, Mumbai, Delhi, Chennai, Inter-city)
- **Live Bus Map** — SVG-based map visualization showing buses on routes with animated dots

#### 6.1.5 Schedules

Schedule generation and management interface with CSV/JSON export.

**Features:**
- **Date Picker** — Select target date for schedule generation
- **Custom Parameters** — Override global start time, end time, and frequency
- **Generate Button** — Executes the Greedy Time-Slot Assignment algorithm
- **Generation Stats** — Shows count of schedules created, duplicates skipped, and execution time
- **Schedule Table** — View all generated schedules with route info, departure time, and status
- **Cancel Schedule** — Cancel individual schedules with confirmation dialog
- **CSV/JSON Export** — Download generated schedules in CSV or JSON format
- **Departure Board** — Visual display of upcoming departures with time, route, and status

#### 6.1.6 Crew

Crew member management and auto-assignment.

**Features:**
- **Crew Table** — List all drivers and conductors with key details (name, specialization, availability, rating, experience)
- **Auto-Assign Crew** — One-click assignment using the Multi-Criteria Scoring algorithm with Jain's Fairness Index
- **Assignment Results** — Shows total assignments made, fairness index score, and execution time
- **Crew Details Dialog** — Click any row for full profile (experience, rating, license, assignments)
- **Filters** — By specialization (Driver/Conductor) and availability (Available/On Leave)
- **Crew Fatigue Monitor** — Visual display of crew workload and fatigue risk indicators
- **Optimization Insights** — AI-generated suggestions for crew scheduling improvements

#### 6.1.7 Traffic

Traffic alert monitoring and management.

**Features:**
- **Alert Table** — All alerts with severity color badges (low=green, medium=yellow, high=orange, critical=red)
- **Create Alert** — Form to report new incidents (select route, type, severity, delay minutes, description)
- **Auto-Notification** — When an alert is created, all customers with bookings on the affected route automatically receive a notification
- **Resolve Alert** — Mark alerts as resolved
- **Filter** — Show only unresolved alerts
- **Weather Integration** — Displays current weather conditions affecting routes

#### 6.1.8 Holidays

Leave request approval workflow.

**Features:**
- **Request Table** — All crew leave requests with status badges and timeline
- **Approve/Reject** — One-click review with reviewer tracking (who reviewed and when)
- **Auto-Update Availability** — Approved requests automatically set crew availability to `on_leave`
- **Auto-Notification** — Crew members are notified of approval or rejection decisions
- **Date Range Display** — Visual representation of leave periods with calendar indicators

#### 6.1.9 Analytics

Data analytics dashboard for business intelligence.

**Features:**
- **Revenue Summary Cards** — Total Revenue (emerald), Average per Route (sky), Highest Earning Route (amber) with icons
- **Top Performing Routes** — Horizontal bar visualization ranked 1–6 with circular rank badges (gold/silver/bronze for top 3)
- **Route Performance Matrix** — Color-coded table comparing 5 cities across 4 metrics (Revenue Score, On-Time %, Completion, Satisfaction). Green ≥85, amber ≥70, red <70
- **Daily Trends** — Line chart showing revenue and completion rates over time
- **City-Wise Breakdown** — Revenue and performance breakdown by city
- **Route Performance Heatmap** — Grid visualization (8 routes × 7 days) with color-coded cells (green ≥85, amber 70–84, red <70)
- **Fuel Cost Calculator** — Estimate fuel costs based on route distance and bus type
- **CSV Export** — Download analytics data as CSV file
- **Today's Schedule Compact Table** — Quick overview of today's scheduled departures

#### 6.1.10 Maintenance

Bus fleet maintenance tracking with calendar visualization.

**Features:**
- **Maintenance Table** — All records with service type badges (Routine=blue, Repair=red, Inspection=green)
- **Upcoming Services** — Dedicated section for services due soon with nextServiceDate filtering
- **Create Record** — Form for logging new maintenance (bus registration, type, date, cost, next service date, notes)
- **Maintenance Calendar View** — Calendar visualization showing maintenance events by date with color-coded service type indicators
- **Cost Tracking** — Summary of maintenance costs by bus and service type

#### 6.1.11 Settings

System configuration panel with comprehensive controls.

**Features:**
- **General Settings** — App name input, timezone dropdown (IST/UTC/EST), language selector (English/Hindi/Kannada/Tamil), date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **Notification Settings** — 4 toggle switches (Email, SMS, Push, In-App) each with icon, label, and description
- **Display Settings** — Default page dropdown, items per page (5/10/25/50), compact mode toggle, auto-refresh interval slider (5s–120s)
- **API Settings** — API key with reveal/hide toggle (masked display), webhook URL input, rate limit display (100 req/min)
- **Danger Zone** — Reset All Settings (destructive button with Dialog confirmation), Export Settings (JSON download)
- **Persistence** — All settings saved to `localStorage` with `bt_` prefix for persistence across sessions

---

### 6.2 Driver Portal (6 Pages)

#### 6.2.1 Driver Dashboard

Personal overview for drivers with shift management and trip monitoring.

**Features:**
- **Welcome Card** — Driver name with avatar, circular progress indicator for daily tasks
- **Digital Trip Manifest** — Ticket-style card showing current route info, passenger count with color-coded progress bar (green ≤60%, amber 60–85%, red >85%), animated route progress visualization with dot timeline
- **Shift Timer** — Circular SVG progress ring (140×140px) with Start/Pause/End controls, real-time HH:MM:SS display, dynamic color changes (green <6h, amber 6–8h, red >8h), toast notifications on state transitions
- **Weekly Hours Chart** — Horizontal SVG bar chart for Mon–Sun, color-coded by hours (green ≤8h, amber 8–9h, red >9h), shows total hours vs 40h/week target
- **Route Performance** — Recent trips section (5 trips) with on-time/late color-coded badges, weekly on-time rate bar chart
- **Quick Actions** — 4 action cards: Start Shift (green), End Shift (red), Report Issue (amber), View Pay (violet)
- **Upcoming Assignments** — List of next scheduled work days

#### 6.2.2 My Assignments

Assigned schedule management with safety checklists and communication tools.

**Features:**
- **Assignment List** — All assigned schedules with route details, timing, and status badges
- **Accept/Decline** — Respond to new assignments with confirmation
- **Pre-Trip Checklist** — 7-item interactive checklist with custom icons: Vehicle Inspection (Shield), Fuel Level Check (Fuel), Tire Condition (CircleDot), Lights & Signals (Zap), First Aid Kit (Award), Fire Extinguisher (Flame), Ticket Machine (FileText). Shows completion percentage and "Ready to depart" banner at 100%
- **Quick Communication** — 4 preset message buttons: "Running 5 min late" (amber), "Arrived at stop" (emerald), "Emergency — need backup" (red), "Break request" (violet)
- **Assignment Count Badges** — Visual indicators for pending/total assignments

#### 6.2.3 Calendar

Shift calendar view with leave tracking and shift summaries.

**Features:**
- **Calendar Grid** — Monthly calendar showing assigned dates with shift count badges
- **Shift Summary Cards** — Morning Shift (Sun icon) and Evening Shift (Moon icon) displayed with time, route, and hours. Overtime indicator (Flame badge when >8h)
- **Leave Dots** — Color-coded dots on calendar: Green = Approved leave, Amber = Pending leave, Red = Rejected leave
- **Date Selection** — Click a date to view shift details and summary

#### 6.2.4 Leave Requests

Leave management interface with balance tracking and calendar view.

**Features:**
- **Leave Balance Cards** — 3 cards showing Available Days, Pending Days, Used Days with gradient backgrounds. Balance calculated from approved/pending requests (20 day total allowance)
- **Calendar Mini View** — Compact calendar with color-coded leave dots and today highlighted
- **Request Leave Dialog** — Date range pickers (start/end), reason textarea, available days count display, overlap validation
- **Request History** — Timeline-style status view of past requests (pending/approved/rejected)

#### 6.2.5 Profile

Personal profile and earnings with comprehensive professional details.

**Features:**
- **Cover Gradient Banner** — Emerald-to-teal gradient (40px) with decorative dot pattern overlay
- **Avatar** — Gradient border ring with initials
- **Stats Row** — Total Trips, Rating (stars), Experience (years) in 3-column grid
- **Skills/Qualifications Tags** — Badges for Heavy Vehicle, Defensive Driving, AC Bus, City Routes, etc.
- **Edit Profile Dialog** — Modal with form fields: Name, Phone, License, Availability
- **Earnings Tracker** — 4 summary cards (This Month ₹X, Last Month ₹X, YTD Total ₹X, Average Monthly ₹X) + 6-month SVG line chart with gradient fill
- **Professional Details** — Read-only card with license number, bus assigned, specialization

#### 6.2.6 Fuel Log

Dedicated fuel tracking page for recording fuel consumption and costs.

---

### 6.3 Conductor Portal (6 Pages)

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

Personal dashboard for bus passengers with spending analytics and quick access.

**Features:**
- **Gradient Welcome Card** — Personalized greeting with customer name
- **4 Stat Cards** — Total Journeys, Total Spent (₹), Average Rating, Routes Used
- **Spending Donut Chart** — SVG donut/ring chart with 3 segments: Bus Fares (58%, emerald), Season Pass (28%, amber), Other (14%, violet). Center text shows "Total Spent" with formatted currency. Color-coded legend with percentages
- **Favorite Routes** — Routes marked as favorites (persisted in `localStorage`)
- **Upcoming Journeys** — Next booked trips with route info and departure time
- **CTA Cards** — "Search Routes" and "View Map" call-to-action cards for quick navigation
- **Notification Ticker** — WebSocket-powered scrolling marquee showing latest system events

#### 6.4.2 Search Routes

Route discovery and booking interface with connecting routes support.

**Features:**
- **Search Form** — From/To location inputs with autocomplete, city dropdown filter
- **Connecting Routes** — Automatically suggests routes requiring transfers between locations
- **Popular Routes** — Curated list of high-demand routes
- **Fare Calculator** — Calculate estimated fare for a route
- **Route Comparison** — Select 2–3 routes for side-by-side comparison (distance, duration, fare, stops)
- **Search Results** — Filtered route list with expandable details:
  - **Route Timeline** — Visual timeline with vertical dots connected by gradient line (green → amber → red), start/end stops highlighted
  - **Bus Amenities** — Icons for WiFi, AC, Seating capacity with color-coded availability badges
  - **"Book Now" Button** — Shows fare and opens booking confirmation with animated entry
- **Favorites** — Heart icon to save routes to localStorage favorites list

#### 6.4.3 Route Map

Interactive map for visualizing routes with OSRM road-following polylines.

**Features:**
- **Route Selector** — Dropdown to choose a route from available routes with `mapAvailable = true`
- **Leaflet Map** — Interactive OpenStreetMap with:
  - **OSRM Polylines** — Road-following route lines fetched from `router.project-osrm.org` API (not straight-line connections)
  - **Color-Coded Markers** — Green for start, Red for end, Blue for intermediate stops
  - **Click Popups** — Stop name and order on click
- **Route Info Cards** — Distance, duration, fare, and traffic level displayed alongside map
- **Path Distance** — Actual road distance displayed from OSRM response
- **Loading Overlay** — Shows spinner while fetching OSRM polyline data
- **Fallback** — Graceful fallback to straight-line display if OSRM is unavailable

#### 6.4.4 My Bookings

Journey receipt management with ticket-style receipt cards.

**Features:**
- **Journey Receipt Cards** — Ticket-style cards with:
  - **Gradient Header** — Route number in large bold text with Bus icon
  - **Tear-Line Effect** — Custom CSS dashed line with circles simulating a tear-off receipt
  - **QR Code Pattern** — Deterministic 9×9 SVG grid from journey ID seed including corner finder patterns (visual only)
  - **Journey Details Grid** — 2-column layout: Departure Time, Travel Date, Seat Number (deterministic from ID hash: row 1–20, column A–D), Fare (₹)
  - **Status Badges** — Confirmed (blue), Planned (yellow), Completed (green), Cancelled (red)
  - **Cancel Booking** — Button to cancel confirmed bookings
  - **Download Receipt** — "Download Receipt" button triggers toast notification
  - **Journey ID Footer** — Truncated ID shown at bottom of receipt card
- **Active/Completed Tabs** — Toggle between active and completed bookings

#### 6.4.5 Journey History

Past journey review and rating with analytics.

**Features:**
- **Date Range Filter** — Collapsible filter panel with Start Date and End Date inputs. Defaults to last 30 days. Shows filtered count vs total count
- **Filtered Stats Row** — Average Fare card (amber gradient) and Total Distance card (sky gradient) showing filtered values
- **Star Rating Distribution Chart** — SVG horizontal bar chart showing 1★ through 5★ rating counts with amber bars and count labels
- **Journey List** — Past journeys with route info, date, interactive rating stars (click to rate), feedback textarea, and submit rating button

#### 6.4.6 Support

Customer support ticket system for issue tracking and help.

**Features:**
- **Create Ticket** — Form with title, description, category selector (General, Refund, Complaint, Suggestion, Safety), and priority selector (Low, Normal, High, Urgent)
- **Ticket List** — All submitted tickets with status badges and category indicators
- **Ticket Status Tracking** — Visual timeline showing ticket progression: Open → In Progress → Resolved → Closed
- **FAQ Section** — Common questions and answers
- **Contact Information** — Support contact details and operating hours

---

## 7. Key Components and UI Features

### 7.1 Login Page

A visually striking authentication page with deep blue gradient theme:

- **Deep Blue Gradient Background** — Rich blue-to-indigo gradient with animated SVG bus route paths and pulsing stop dots
- **Animated Bus SVG Icon** — Detailed bus illustration (body, windshield, windows, door, wheels, headlights) with subtle bounce animation
- **Quick Demo Access Buttons** — 4 pre-filled login buttons: Admin (red), Driver (amber), Conductor (teal), Customer (emerald) — each with credentials auto-filled
- **"Create Account" Toggle** — Switch between login and registration forms with animated transition
- **Remember Me** — Checkbox to save email in `localStorage` for auto-fill
- **"v2.0" Version Badge** — Version indicator next to the BusTrack Pro title
- **Pending Approval Screen** — Dedicated UI for users with pending/rejected approval status, showing waiting message or rejection notice with guidance

### 7.2 App Shell (Sidebar + Header)

The main application layout wrapping all portal content:

- **Collapsible Sidebar** — Full sidebar with icons + labels, collapses to icon-only mode. Active page highlighted with accent color. Section dividers (MAIN, MANAGEMENT, SETTINGS labels). Role-specific navigation items.
- **Breadcrumbs** — Navigation path with clickable segments: Home > Role > Page
- **Live IST Clock** — Real-time Indian Standard Time display in header (HH:MM:SS), monospace font, hidden on mobile
- **Notification Bell** — Bell icon with unread count badge. Click opens grouped notification dropdown. 30-second polling interval for updates.
- **Command Palette** — Open with `Ctrl+K` / `Cmd+K` keyboard shortcut. Glass-morphism styled modal. Type-to-filter search. Shows all navigation pages for current role. Current page highlighted with "Current" badge. Footer hints (↑↓ Navigate, ↵ Open, esc Close)
- **Online Status Indicator** — Pulsing green dot (emerald-400/500) before user role badge in header
- **Scroll Progress Indicator** — Thin emerald gradient progress bar at top of page showing scroll percentage
- **Greeting Banner** — Time-of-day greeting (Good Morning/Afternoon/Evening) with user name displayed at the top of the main content area
- **Responsive Mobile Sidebar** — Fixed overlay with dark backdrop on <768px screens. Hamburger menu with animated three-bars → X transform
- **Sticky Footer** — Footer with current date (Weekday, Day Month Year), system online indicator with pulsing green dot, "115 Routes" and "104 Crew" stats, copyright and version info. Sticks to bottom of viewport when content is short.
- **Announcement Banner** — Dismissible banner at the top of the page for system-wide announcements fetched from the announcements API

### 7.3 Toast Notifications

Global notification system replacing all `alert()` calls:

- **Replaces All `alert()` Calls** — Zero native browser dialogs in the entire application (verified across all 3 portals)
- **Toast Variants** — Success (emerald/green), Error (rose/red), Warning (yellow), Info (blue)
- **Auto-Dismiss** — Toasts auto-dismiss after 4 seconds
- **Stackable** — Multiple toasts stack vertically with slide-in animation from right
- **shadcn/ui Integration** — Uses `toast()` from `@/hooks/use-toast` hook and `Toaster` component in layout

### 7.4 SVG Data Visualizations

All charts are built with pure SVG — no external chart library needed:

| Chart Type | Used In | Description |
|---|---|---|
| **Bar Chart** | Admin Dashboard, Crew Dashboard, Analytics | Vertical/horizontal bars for comparing values |
| **Donut Chart** | Customer Dashboard | Spending breakdown with center label |
| **Line Chart** | Crew Earnings, Analytics Trends | Connected data points showing trends over time |
| **Performance Matrix** | Analytics | Color-coded grid comparing metrics across dimensions |
| **Circular Progress** | Crew Shift Timer | SVG ring showing elapsed time vs 8h shift |
| **Star Distribution** | Journey History | Horizontal bars for rating counts |
| **Area Chart** | Passenger Analytics | 24-hour timeline with gradient fill |
| **Fleet Tracker** | Admin Dashboard | Concentric circles with animated bus dots |
| **Heatmap** | Analytics | Color-coded cells for route performance by day |

### 7.5 Dark Mode

- **Full Theme Support** — Every component supports both light and dark themes
- **System Preference Detection** — Respects OS-level dark mode setting via `prefers-color-scheme`
- **Manual Toggle** — Users can override system preference with toggle button
- **Zero Flash** — Theme is determined before React hydration using `next-themes` script injection
- **CSS Variables** — Theme colors defined as Tailwind CSS custom properties

### 7.6 Responsive Design

Mobile-first responsive design with Tailwind CSS breakpoints:

| Breakpoint | Width | Target |
|---|---|---|
| Default | < 640px | Mobile phones |
| `sm:` | ≥ 640px | Large phones / small tablets |
| `md:` | ≥ 768px | Tablets |
| `lg:` | ≥ 1024px | Laptops |
| `xl:` | ≥ 1280px | Desktops |

Key responsive adaptations:
- Sidebar collapses to overlay on mobile with hamburger menu
- Tables become horizontally scrollable
- Grid layouts shift from multi-column to single-column
- Font sizes and spacing adjust for smaller screens
- Touch-friendly tap targets (minimum 44px) on mobile
- Live clock hidden on mobile to save header space

---

## 8. Authentication System

### 8.1 Password Hashing

```typescript
// SHA-256 hashing (demo purposes) using Node.js crypto module
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}
```

> **Note**: SHA-256 is used for demo purposes. In production, bcrypt with salt rounds would be used for proper password security, as SHA-256 alone is vulnerable to rainbow table attacks without salting.

### 8.2 Session Management

- **Token-Based Sessions** — On successful login, a cryptographically secure 64-byte hex token is generated using `crypto.randomBytes(32)` and stored in an **in-memory Map** (`activeTokens`) with userId, role, and expiration timestamp
- **Token Expiration** — Tokens expire after **24 hours** (enforced at verification time by comparing `expiresAt` with `Date.now()`)
- **Auto-Cleanup** — Expired tokens are cleaned up every 60 seconds via `setInterval`
- **Client-Side Storage** — Token is stored in `localStorage` on the client and sent with every authenticated API request
- **Thread Safety** — The in-memory Map provides O(1) token lookup performance suitable for demo workloads

### 8.3 Registration & Account Approval

- **All Roles Supported** — Registration allows creating accounts with any role (`admin`, `driver`, `conductor`, `customer`)
- **Conditional Approval** — Customer accounts are auto-approved (`approvalStatus: "approved"`). Admin, driver, and conductor accounts require admin approval (`approvalStatus: "pending"`)
- **Login Blocking** — Users with `pending` status see a waiting screen. Users with `rejected` status see a rejection notice with support guidance
- **Approval Notification** — When an admin approves or rejects an account, a notification is automatically created for the user informing them of the decision
- **CrewProfile Auto-Creation** — CrewProfile records are created both on registration and on admin approval (as fallback)

### 8.4 Auto-Login

- **Remember Me** — When checked, the user's email is saved to `localStorage`
- **Auto-Fill** — On next visit, the email field is pre-populated from `localStorage`
- **Quick Demo Buttons** — 4 pre-filled login forms (Admin, Driver, Conductor, Customer) bypass manual entry entirely

---

## 9. Seed Data

The database is pre-populated with realistic data for demonstration purposes using a deterministic pseudo-random number generator.

### 9.1 User Accounts (205 total)

| Role | Count | Email Pattern | Password |
|---|---|---|---|
| Admin | 1 | `admin@bus.com` | `password123` |
| Drivers | 60 | `driver1@bus.com` – `driver60@bus.com` | `password123` |
| Conductors | 44 | `conductor1@bus.com` – `conductor44@bus.com` | `password123` |
| Customers | 100 | `customer1@bus.com` – `customer100@bus.com` | `password123` |

All seed accounts have `approvalStatus: "approved"` for immediate access.

### 9.2 Bus Routes (115 total)

| City | Routes | Route Number Pattern |
|---|---|---|
| Bangalore (BLR) | 50 | `BLR-001` – `BLR-050` |
| Mumbai (MUM) | 20 | `MUM-001` – `MUM-020` |
| Delhi (DEL) | 15 | `DEL-001` – `DEL-015` |
| Chennai (CHN) | 15 | `CHN-001` – `CHN-015` |
| Inter-city (IC) | 15 | `IC-001` – `IC-015` |

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

This ensures the same data is generated every time `bun run db:push` and seeding is run.

### 9.4 Realistic Data Generation

- **Indian Names** — Generated from curated lists of Indian first and last names (e.g., Arjun Sharma, Priya Patel, Vikram Reddy, Ananya Iyer)
- **Real Locations** — Actual Bangalore, Mumbai, Delhi, and Chennai locations used as bus stops (e.g., Majestic Bus Stand, Shivaji Nagar, MG Road, Koramangala)
- **Accurate Coordinates** — Real latitude/longitude values for OSRM map rendering
- **Varied Route Properties** — Distances (5–85 km), durations (15–180 min), fares (₹10–₹350), and traffic levels randomized within realistic ranges

### 9.5 Additional Seed Data

| Data Type | Count | Description |
|---|---|---|
| **Schedules** | 3,654 | Pre-generated for multiple dates to demonstrate scheduling |
| **Crew Assignments** | 4,356 | Driver and conductor pairings for schedules |
| **Journeys** | 81 | Sample bookings (completed, planned, cancelled) across last 30 days |
| **Traffic Alerts** | 15 | Sample alerts across different routes and severities |
| **Route Analytics** | 7 days per route | Historical performance data for analytics dashboard |
| **Bus Maintenance** | 30 | Sample maintenance records for various buses |
| **Notifications** | 20+ | Sample notifications for demo accounts (mix of types) |
| **Holiday Requests** | Multiple | Sample leave requests (some approved, some pending) |

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
├── Caddyfile                 # Caddy reverse proxy config (gateway)
├── CREDENTIALS.txt           # All demo account credentials
├── README.md                 # Project README
├── worklog.md                # Development worklog
├── db/
│   └── custom.db             # SQLite database file (generated)
└── download/                 # Screenshots and documentation exports
```

### 10.2 Source Code (`src/`)

```
src/
├── app/
│   ├── layout.tsx            # Root layout (ThemeProvider, fonts, metadata, Toaster)
│   ├── page.tsx              # Main application (login + app shell + portal routing)
│   ├── globals.css           # Global styles + Tailwind directives + custom CSS classes
│   └── api/
│       ├── auth/route.ts          # Authentication API (login, register, verify, logout,
│       │                            #   users, updateProfile, pendingUsers, approveUser, deleteUser)
│       ├── routes/route.ts        # Routes CRUD API
│       ├── schedules/route.ts     # Schedules API
│       ├── crew/route.ts          # Crew management API
│       ├── journeys/route.ts      # Journey/bookings API
│       ├── traffic/route.ts       # Traffic alerts API
│       ├── analytics/route.ts     # Analytics API
│       ├── holidays/route.ts      # Holiday requests API
│       ├── notifications/route.ts # Notifications API
│       ├── maintenance/route.ts   # Maintenance API
│       ├── export/route.ts        # CSV/JSON export API
│       ├── traffic-predict/route.ts # Traffic prediction API
│       ├── users/route.ts         # User management API
│       ├── crew-notes/route.ts    # Crew daily notes API
│       ├── announcements/route.ts # Broadcast announcements API
│       ├── support-tickets/route.ts # Customer support tickets API
│       └── route.ts              # Catch-all route API
│
├── components/
│   ├── admin/
│   │   └── admin-content.tsx     # Admin portal (11 pages)
│   ├── customer/
│   │   └── customer-content.tsx  # Customer portal (6 pages)
│   ├── crew/
│   │   └── crew-content.tsx      # Crew portal (6 pages × 2 roles)
│   ├── announcement-banner.tsx   # System announcement banner component
│   └── ui/                       # 40+ shadcn/ui components
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── alert-dialog.tsx
│       ├── aspect-ratio.tsx
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
│       └── ...
│
├── hooks/
│   ├── use-mobile.ts           # Mobile viewport detection hook
│   └── use-toast.ts            # Toast notification hook (shadcn/ui)
│
├── lib/
│   ├── db.ts                   # Prisma client singleton
│   └── utils.ts                # Utility functions (cn, formatters)
│
└── types/
    └── index.ts                # TypeScript type definitions
```

### 10.3 Prisma (`prisma/`)

```
prisma/
├── schema.prisma               # Database schema (15 models)
└── seed.ts                     # Data seeding script (~500+ lines)
                                 # - Deterministic PRNG (Mulberry32, seed=42)
                                 # - 205 user accounts
                                 # - 115 bus routes with real Indian locations
                                 # - 104 crew profiles
                                 # - 3,654 schedules
                                 # - 4,356 crew assignments
                                 # - 81 journeys
                                 # - Analytics, traffic alerts, maintenance
                                 # - Notifications, audit logs
```

### 10.4 Mini-Services

```
mini-services/
└── notification-service/
    ├── package.json             # Service dependencies
    ├── bun.lock                 # Lock file
    └── index.ts                 # WebSocket notification server (port 3003)
                                  # Real-time notification streaming
                                  # for the Notification Ticker feature
```

### 10.5 Line Count Summary

| File | Lines | Purpose |
|---|---|---|
| `src/components/admin/admin-content.tsx` | ~6,900 | Admin portal (11 pages) |
| `src/components/crew/crew-content.tsx` | ~3,200 | Crew portal (6 pages × 2 roles) |
| `src/app/page.tsx` | ~2,300 | Main app (login + app shell + routing) |
| `src/components/customer/customer-content.tsx` | ~2,500 | Customer portal (6 pages) |
| `prisma/seed.ts` | ~500+ | Database seeding |
| API routes (18 files) | ~100–300 each | Backend endpoints |
| UI components (40+ files) | ~50–200 each | shadcn/ui components |
| **Total** | **~11,600+** | **Entire codebase** |

---

## Appendix A: Quick Start

```bash
# Install dependencies
bun install

# Set up database
bun run db:push
bun run db:seed

# Start development server (auto-started by system)
# bun run dev

# Open in browser via Preview Panel
```

## Appendix B: Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bus.com` | `password123` |
| Driver | `driver1@bus.com` | `password123` |
| Conductor | `conductor1@bus.com` | `password123` |
| Customer | `customer1@bus.com` | `password123` |

> Full credential list available in `CREDENTIALS.txt`. All demo accounts use the same password `password123`.

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

Authentication errors return HTTP 401/403 status codes. Validation errors return HTTP 400. Server errors return HTTP 500.

---

*BusTrack Pro — Comprehensive Bus Route & Crew Management System*
*Built with Next.js 16 · Prisma ORM · SQLite · TypeScript · Tailwind CSS 4 · shadcn/ui*
