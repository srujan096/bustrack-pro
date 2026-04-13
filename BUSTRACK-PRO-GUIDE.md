# BusTrack Pro — Complete Function & Panel Guide

> **Version:** 6.0 | **Last Updated:** April 2026
> A comprehensive bus transit management system with 3 portals: **Admin**, **Crew** (Driver/Conductor), and **Customer**.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [App Infrastructure](#app-infrastructure)
3. [Admin Portal](#admin-portal)
4. [Crew Portal (Driver & Conductor)](#crew-portal-driver--conductor)
5. [Customer Portal](#customer-portal)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Data Architecture](#data-architecture)

---

## Getting Started

### Login Page
- **Purpose:** Central authentication gateway for all 3 portals
- **How it works:** Users enter email/password or use Quick Demo Access buttons
- **Features:**
  - Animated gradient mesh background with floating particles and bus route SVG animation
  - Glass-morphism login card with rotating conic gradient border
  - Email & password fields with show/hide toggle (eye icon)
  - "Remember me" checkbox (saves email to localStorage)
  - "Forgot Password?" link (shows toast notification)
  - **Quick Demo Access** — 4 one-click buttons to instantly log in as:
    - **Admin** (`admin@bus.com`)
    - **Driver** (`driver1@bus.com`)
    - **Conductor** (`conductor1@bus.com`)
    - **Customer** (`customer1@bus.com`)
    - All use password: `password123`
  - Feature highlights (Real-time Tracking, Smart Scheduling, Secure Payments)
  - Terms of Service & Privacy Policy links
  - "Create Account" link for registration

### Registration / Create Account
- **Purpose:** Self-service account creation for new users
- **How it works:** Fill in Name, Email, Password (with confirmation), Role selector, Phone number
- **Validations:**
  - Passwords must match
  - Minimum 6 character password
  - Name is required
- **Role-specific behavior:**
  - **Admin/Driver/Conductor** registrations go into "pending approval" state
  - **Customer** accounts are created immediately and can log in right away
- **Success state:** Shows confirmation with role-specific message

### Error Handling
- **ErrorBoundary:** Wraps the entire app. If any component crashes:
  - Shows error page with error ID (e.g., `ERR-A3F8K2`)
  - Auto-retry countdown (5 seconds)
  - "Try Again", "Export Error Log" (downloads .json), "Go to Dashboard" buttons
- **Live Notification Ticker:** WebSocket-powered marquee showing real-time events (delays, arrivals, departures, system messages)

### Navigation & Shell
- **Sidebar:** Collapsible sidebar with role-based navigation. Remembers collapsed state in localStorage. Shows role-colored active indicator dot. Mobile-responsive with overlay mode.
- **Header:** Contains breadcrumbs (Home > Current Page), live clock (updates every second), notification bell (dropdown with read/unread), dark/light theme toggle
- **Command Palette (Ctrl+K):** Searchable command palette with keyboard navigation, session search history, categorized page results
- **Keyboard Shortcuts:** Keys 1-9 navigate to sidebar pages (when not typing in input fields)
- **Footer:** Animated bus crossing animation, quick links (Route Map, Schedule, Support, Feedback), copyright, system status indicator (green dot = "System Online"), back-to-top button
- **Back to Top:** Appears after scrolling 200px in the main content area

---

## Admin Portal

> **Access:** Admin role users | **Pages:** 10 (Dashboard, Users, Routes, Schedules, Crew, Traffic, Holidays, Analytics, Maintenance, Settings)

### Quick Stats Ribbon (Global — visible on every page)
- **Purpose:** At-a-glance system metrics bar
- **Data:** Total Routes, Active Schedules, Crew Available, On-Time Rate
- **Source:** `GET /api/analytics`
- **Design:** 4 pill-shaped stat cards with animated gradient progress bar

---

### 1. Dashboard

**Purpose:** Central command center with comprehensive fleet overview

**Panels & Widgets (top to bottom):**

#### Greeting Header
- Time-based greeting ("Good Morning/Afternoon/Evening, {name}")
- Today's date display
- 4 animated stat cards with sparkline trends:
  - Total Routes
  - Active Schedules
  - Crew Available
  - On-Time Rate (percentage)

#### Live Fleet Tracker
- SVG concentric ring animation
- Shows 7 routes (R-101 through R-712) with animated bus dots orbiting central "HUB"
- Status legend: On Time (green), Delayed (amber), Completed (gray)
- Each route has colored dots with pulse animation

#### Live Bus Map
- SVG city grid visualization
- 8 bus routes animated along paths
- Shows grid streets, main roads, intersection dots, compass direction
- Status legend: Moving (green), Stopped (gray), Delayed (red)

#### Weekly Bar Chart
- Recharts bar chart showing routes completed per day (Monday–Sunday)
- Gradient fill bars
- Custom tooltip on hover

#### Passenger Analytics
- SVG area chart: 24-hour passenger flow
- 3 stat cards: Peak Hour, Average Load, Total Today
- Peak hour highlighted with gold dot

#### Route Performance Chart
- Horizontal bar chart comparing 3 metrics for 6 routes:
  - On-Time Percentage
  - Satisfaction Score
  - Revenue

#### Route Performance Heatmap
- Color-coded grid: 8 routes × 7 days of week
- Colors: Green (≥85%), Amber (70-84%), Red (<70%)

#### Admin Quick Actions
- 6 action cards in 3×2 grid:
  1. **Generate Schedules** — Auto-generate schedule batches
  2. **Auto Assign Crew** — Automated crew-to-schedule assignment
  3. **Create Alert** — Create traffic/alert notifications
  4. **View Reports** — Open analytics reports
  5. **System Settings** — Navigate to settings
  6. **Export Data** — Export system data

#### Today's Schedule Compact Table
- Table of today's scheduled trips
- Columns: Route, Time, Status, Bus
- Status dot indicators

#### Departure Board
- Live departure board with flip-clock style display
- Shows upcoming departures in real-time

#### Crew Fatigue Monitor
- Visual representation of crew fatigue levels
- Helps prevent overworked drivers/conductors

#### Optimization Insights
- AI-powered suggestions for:
  - Route optimization
  - Schedule improvements
  - Resource allocation

#### Activity Timeline
- Chronological feed of recent system events
- Auto-refreshes

#### Recent Activity Feed
- Sidebar widget with latest activities
- Real-time updates

#### Passenger Feedback Widget
- Recent customer feedback display
- Star ratings and comments

#### Active Routes Preview
- Preview cards of currently active routes
- "Navigate to" action buttons

#### Fuel Cost Calculator
- Estimate fuel costs based on routes and distances

#### Broadcast Messaging
- Send messages to all system users
- Message composition interface

#### IST Clock Widget
- Indian Standard Time live clock display

#### System Health Panel
- Server status, last sync time
- System health monitoring indicators

---

### 2. Users Management

**Purpose:** Manage all system user accounts

**API:** `GET /api/users`

**Features:**
- **Search:** Filter users by name or email
- **Users Table:**
  - Columns: Name, Email, Role, Approval Status, Actions
  - Role badges (color-coded by role)
- **Approve/Reject:** Buttons for pending user registrations
  - Admin/Driver/Conductor accounts require approval
- **Edit User:** Dialog to modify user details
- **Delete User:** Confirmation dialog (AlertDialog) before deletion
- **Pagination:** Navigate through user list

---

### 3. Routes Management

**Purpose:** Full CRUD for bus routes

**API:**
- `GET /api/routes` (list with pagination)
- `POST /api/routes` (create)
- `PUT /api/routes/{id}` (update)
- `DELETE /api/routes/{id}` (delete)

**Features:**
- **Search:** By route number or location name
- **City Filter:** Dropdown — All, BLR, DEL, MUM, CHN, HYD
- **Routes Table:**
  - Columns: Route #, From, To, Distance, Duration, Fare, Traffic Level, City, Actions
  - City badges, traffic level badges
  - Sort and filter controls

#### Route Form Dialog (Create/Edit)
- **Route Number** — Unique identifier (e.g., BLR-101)
- **Start Location** — Origin stop name
- **End Location** — Destination stop name
- **Distance** — In kilometers
- **Duration** — In minutes
- **Fare** — Ticket price in rupees
- **Traffic Level** — Select: Low, Medium, High
- **City** — Select: BLR, DEL, MUM, CHN, HYD

#### Route Details Dialog
- View all route fields
- Associated schedules list

#### Route Comparison Tool
- Select 2+ routes to compare side-by-side
- Metrics: On-Time %, Satisfaction, Revenue

---

### 4. Schedules Management

**Purpose:** Manage bus trip schedules

**API:**
- `GET /api/schedules` (list with pagination)
- `POST /api/schedules` (create)
- `PUT /api/schedules/{id}` (update)
- `DELETE /api/schedules/{id}` (delete)

**Features:**
- **Search** schedules
- **Filter by status:** All, Scheduled, In Progress, Completed, Cancelled
- **Schedules Table:** Route, Date, Departure Time, Status, Actions
- **Create/Edit Dialog:** Route (dropdown), Date (date picker), Departure Time (time input), Status (select)
- **Delete** with confirmation dialog
- **Pagination**

---

### 5. Crew Management

**Purpose:** View and manage all crew members (drivers & conductors)

**API:** `GET /api/crew`

**Features:**
- **Search** by crew name
- **Filter by specialization:** All, Driver, Conductor
- **Crew Table:**
  - Columns: Name, Email, Specialization, License No, Experience, Rating, Availability, Bus Number, Actions
  - Availability badges: Available (green), On Leave (amber), Unavailable (red)
  - Star rating display (1-5, supports half stars)

#### Crew Details Dialog
- Full crew profile: all personal info, license, experience
- Assignments list with history
- Performance metrics

---

### 6. Traffic Monitoring

**Purpose:** Monitor real-time traffic conditions

**API:** `GET /api/routes` (uses traffic data from routes)

**Features:**
- Traffic level per route display
- Traffic trend visualization
- Historical traffic data
- Route-by-route congestion monitoring

---

### 7. Holiday Management

**Purpose:** Approve/reject crew leave requests

**API:** `GET /api/holidays`

**Features:**
- View all holiday/leave requests
- Crew member details per request
- **Approve** — Mark request as approved
- **Reject** — Mark request as rejected
- Holiday calendar view

---

### 8. Analytics

**Purpose:** Data-driven insights and reporting

**API:** `GET /api/analytics`

**Features:**
- **Dashboard Stats:** Summary metrics (routes, crew, revenue, performance)
- **Charts:**
  - Revenue trends over time
  - Ridership/ridership data
- **Performance Metrics:**
  - Route completion rates
  - Crew utilization percentages
- **Export Data:** Download analytics reports

---

### 9. Maintenance

**Purpose:** Track bus maintenance schedules and records

**API:** `GET /api/maintenance`

**Features:**

#### Maintenance Calendar View
- Interactive monthly calendar
- Month navigation (Previous/Next buttons)
- **Red dots** on dates with maintenance records
- Click a date to see:
  - Bus Registration number
  - Service Type
  - Description
- "Upcoming Services" badge showing count

#### Maintenance Records Table
- Full list of maintenance records
- Add/edit capabilities
- Delete with confirmation

---

### 10. Settings

**Purpose:** System configuration

**Features:**
- System configuration panel
- Toggle switches for various settings
- Platform preferences
- UI-only (no API calls in current version)

---

### Admin Keyboard Shortcuts

| Key | Page |
|-----|------|
| D | Dashboard |
| U | Users |
| R | Routes |
| S | Schedules |
| C | Crew |
| T | Traffic |
| H | Holidays |
| A | Analytics |
| M | Maintenance |
| G | Settings |

---

## Crew Portal (Driver & Conductor)

> **Access:** Driver or Conductor role users | **Pages:** 6 (Dashboard, My Assignments, Calendar, Leave Requests, Profile, Fuel Log)

### Shared Components

| Component | Purpose |
|---|---|
| DailySummaryReport | 5 stat cards (Trips, Km, Passengers, Fuel, Earnings) + Download Report button (.txt) |
| ShiftHandoverNotes | Textarea for shift notes. Saves to localStorage AND API. Character counter, timestamps |
| AssignmentPerformanceBadge | On-time rate progress bar + trips this week count |
| EndOfShiftSummary | 3 stat cards (Trips, Hours, Distance) + star rating + Submit Report |
| CertificationBadges | 4 cards: Heavy Vehicle License, Defensive Driving, First Aid, AC Bus Certified. Shows expiry |
| DigitalTripManifest | Full trip panel: route info, passenger count/capacity bar, route progress dots, current/next stop, ETA, Start/Complete buttons with timer |
| ShiftTimer | 8-hour shift countdown with Start/Pause/Reset. Progress bar |
| BreakTimer | Break timer with Start/Pause/Reset. Duration input, break history |
| RoutePerformance | 5-route table: scheduled vs actual times. Status: Early/On-Time/Late |
| PreTripChecklist | Toggleable safety check items (Tire pressure, Lights, Brakes, Mirrors, Fuel, etc.) |
| QuickCommunication | Quick message templates for common situations |
| EarningsTracker | Monthly earnings bar chart + total |
| OvertimePayCalculator | Calculate overtime beyond shift hours |
| PassengerCounter | Interactive +/- passenger counter |
| DailyWeatherWidget | City-specific weather (sun, rain, clouds, temperature) |
| PerformanceScorecard | On-time rate, trip count, rating display |
| WeeklyHoursBarChart | Recharts: hours per day (green ≤8h, amber ≤9h, red >9h) |

---

### 1. Crew Dashboard

**Purpose:** Daily operations hub for drivers and conductors

**API:**
- `GET /api/crew/profile?userId={userId}`
- `GET /api/crew/assignments?crewId={crewId}`
- `GET /api/crew/holidays?crewId={crewId}`

**Panels (top to bottom):**

#### Greeting & Availability
- Time-based greeting with crew member's name
- **Role badge** — "Driver" or "Conductor"
- **Availability toggle** — Switch between Available, On Leave, Unavailable (calls `PUT /api/crew/profile/availability`)

#### Today's Assignment Card
- Route number, from/to locations, departure time
- Status badge
- **Accept/Decline buttons** for pending assignments (calls `POST /api/crew/assignments/{id}/respond`)

#### Quick Actions
- 4-6 action buttons: Mark Attendance, Report Issue, Request Break, etc.

#### Digital Trip Manifest
- Complete trip management panel:
  - Route number, departure time, bus registration
  - Passenger count vs capacity with progress bar
  - Animated route progress dots (sequential fill)
  - Current stop / Next stop display
  - ETA estimate
  - **Start Trip** button → begins elapsed timer
  - **Complete Trip** button → marks trip as done

#### Shift Timer
- 8-hour countdown with Start, Pause, Reset
- Visual progress bar

#### Break Timer
- Separate break timer
- Set break duration
- Break history log

#### Daily Summary Report
- 5 stat cards: Trips Completed, Km Driven, Passengers Carried, Fuel Used, Earnings
- **Download Report** button → generates and downloads .txt file

#### Shift Handover Notes
- Text area (1000 char limit) for writing notes for the next crew shift
- Auto-saves to localStorage AND API (`/api/crew-notes`)
- Shows character count and last saved timestamp
- Clear and Save buttons

#### End of Shift Summary
- 3 stat cards: Total Trips, Hours Worked, Distance Covered
- Star rating input (rate your shift)
- **Submit Report** button

#### Certification Badges
- 4 professional certification cards:
  - Heavy Vehicle License
  - Defensive Driving
  - First Aid
  - AC Bus Certified
- Each shows: expiry date, Active/Expired badge

#### Pre-Trip Checklist
- Safety checklist items to toggle:
  - Tire pressure, Lights, Brakes, Mirrors, Fuel level, etc.

#### Route Performance
- Table of recent trips showing:
  - Route, Scheduled Time, Actual Time
  - Status: Early (green), On-Time (blue), Late (red)

#### Daily Weather Widget
- City-specific weather conditions
- Icons: Sun, Rain, Clouds
- Temperature display

#### Performance Scorecard
- On-time rate percentage
- Total trip count
- Average rating

#### Weekly Performance Score
- Weekly metrics display
- Comparison with previous week

#### Earnings Tracker
- Monthly earnings bar chart
- Total earnings display

#### Weekly Hours Bar Chart
- Recharts bar chart: hours worked per day (Mon–Sun)
- Color-coded: Green (≤8h), Amber (≤9h), Red (>9h)

---

### 2. My Assignments

**Purpose:** View and manage assigned trips

**API:**
- `GET /api/crew/assignments?crewId={crewId}`
- `POST /api/crew/assignments/{id}/respond`

**Features:**
- **Filter tabs:** All / Pending / Accepted / Declined / Completed
- **Assignment cards** showing:
  - Route number, From → To
  - Date, Departure Time
  - Status badge (color-coded)
  - Bus Registration
  - Fare amount, Distance
- **Accept/Decline buttons** for pending assignments
  - Calls API to update assignment status
- **AssignmentPerformanceBadge** on each card (on-time rate + trips this week)
- **Shift Summary Cards** for completed/past assignments
- **Empty state** when no assignments match filter

---

### 3. Calendar

**Purpose:** Visual calendar of all assignments

**Features:**
- **Full month calendar grid**
- **Month navigation** (Previous / Next month)
- **Day color-coding** by assignment status:
  - Days with assignments highlighted
  - Today highlighted distinctly
- **Click a day** → shows assignment details for that date
- **Assignment details panel** for selected date

---

### 4. Leave Requests

**Purpose:** Submit and track holiday/leave requests

**API:**
- `GET /api/crew/holidays?crewId={crewId}`
- `POST /api/crew/holidays` (create new request)

**Features:**

#### New Request Dialog
- **Start Date** — date picker
- **End Date** — date picker
- **Reason** — textarea
- **Submit** button

#### Holiday Requests List
- Each request shows: dates, reason, status
- **Status badges:** Pending (amber), Approved (green), Rejected (red)
- **Status Timeline visualization:**
  - Submitted → Under Review → Approved/Rejected
  - Visual dots connected by lines

#### Status Distribution Bar
- Shows count: Approved / Pending / Rejected

---

### 5. Profile

**Purpose:** View and manage personal crew profile

**API:** `GET /api/crew/profile?userId={userId}`

**Features:**

#### Profile Header
- Avatar with initials
- Name, Email
- Role badge (Driver/Conductor)

#### Personal Information
- **Specialization** — Driver or Conductor
- **License Number**
- **Experience Years**
- **Performance Rating** (1-5 stars)
- **Max Daily Hours**
- **Bus Number** assigned

#### Assignment History
- Table of past assignments with details

#### Availability Status
- Toggle: Available / On Leave / Unavailable
- Calls `PUT /api/crew/profile/availability`

#### Weekly Hours Chart
- Recharts bar chart of hours worked per day

#### Certification Badges
- Professional certification cards with expiry dates

#### Earnings Tracker
- Monthly earnings bar chart and total

---

### 6. Fuel Log

**Purpose:** Track fuel consumption and spending

**Features:**

#### Add Fuel Entry
- **Date** — date picker
- **Bus Registration** — text input
- **Fuel Type** — Diesel / CNG / Electric
- **Liters** — number input
- **Cost per Liter** — number input
- **Total Cost** — auto-calculated

#### Fuel Log Table
- All entries listed with: Date, Bus Reg, Fuel Type, Liters, Cost/L, Total Cost
- Delete entries with confirmation

#### Summary
- **Total Spend** summary card
- **Monthly Spending Chart** — bar chart by month

---

## Customer Portal

> **Access:** Customer role users | **Pages:** 6 (Dashboard, Search Routes, Route Map, My Bookings, Journey History, Support)

### Shared Components

| Component | Purpose |
|---|---|
| QRPattern | Deterministic QR-code-like SVG from seed string (for tickets) |
| TearLine | Dashed tear-line separator (ticket-style) |
| StarRating | Interactive 5-star rating with hover + click |
| SeatBadge | Seat availability: Many/Filling up/Few/Almost full (based on traffic level) |
| WeatherBadge | City weather: DEL=Hot🔥, MUM=Rainy🌧️, CHN=Cloudy⛅, default=Sunny☀️ + delay advisory |
| SpendingDonut | Recharts donut: Bus Fares 58%, Season Pass 28%, Other 14% |
| RatingDistribution | Star rating distribution bar chart + overall avg |
| RouteDetailPanel | Route info + stops timeline + amenities + Book Now |
| TravelTipsWidget | Auto-rotating tips (6 tips, 10s interval, fade, dot indicators) |
| QuickBookWidget | 6 popular route pills with fares |
| StopsTimeline | Vertical timeline: green=first, blue=middle, red=last stop. Current/Next badges, ETA + distance |
| TripPlanner | 3-step wizard: Route → Details → Confirm |
| FareCalculator | ₹5 base + ₹2/km |
| RouteETACalculator | ETA with stop-by-stop breakdown |
| RouteComparisonDialog | Side-by-side comparison with "Best" badges |
| LoyaltyRewardsPanel | Tiers: Bronze/Silver/Gold/Platinum. Points + benefits |
| BookingStatusTimeline | Confirmed → Boarded → Completed visual |
| MonthlySpendingChart | Recharts bar chart |
| ContactUsForm | Name, Email, Subject, Message, Submit |
| SeatSelection | Interactive seat grid |
| LiveBusTracker | Leaflet map real-time bus position |
| AutocompleteInput | Auto-complete for location search |
| MapRouteComparison | Compare routes on Leaflet map with polylines |

### Favorites System
- Stored in localStorage (`customer-favorite-routes`)
- Functions: `getFavorites()`, `setFavorites()`, `toggleFavorite()`, `isFavorite()`
- Heart icon toggle on route cards

---

### 1. Customer Dashboard

**Purpose:** Personal travel hub with overview and quick actions

**API:**
- `GET /api/customer/spending?userId={userId}` → `{ totalSpent, totalTrips, avgRating }`
- `GET /api/customer/journeys?userId={userId}`

**Panels:**

#### Page Header
- "Dashboard" title with description

#### Quick Book Widget
- 6 one-tap popular route buttons:
  - BLR-101, BLR-102, BLR-103, BLR-115, BLR-120, BLR-128
- Each shows route fare
- Click to pre-fill search form

#### Trip Planner
- 3-step wizard:
  1. **Route** — Origin & Destination inputs
  2. **Details** — Date, Time, Passengers count
  3. **Confirm** — Review and confirm booking
- Step indicators with validation

#### Travel Stats
- 4 animated counter cards:
  - **Total Spent** — rupee amount
  - **Total Trips** — count
  - **Average Rating** — star rating
  - **Favorite Routes** — count
- Numbers animate from 0 to target value

#### Spending Donut Chart
- Recharts donut chart:
  - Bus Fares: 58%
  - Season Pass: 28%
  - Other: 14%

#### Travel Tips Widget
- Auto-rotating travel tips (every 10 seconds)
- 6 tips with fade transition
- Dot indicators for current tip

#### Upcoming Trip Countdown
- If upcoming journeys exist, shows:
  - Countdown timer to next trip
  - Trip stats display

#### Loyalty Rewards Panel
- Loyalty program tiers:
  - **Bronze** (0-999 points)
  - **Silver** (1000-2499 points)
  - **Gold** (2500-4999 points)
  - **Platinum** (5000+ points)
- Current tier highlighted with progress bar
- Benefits per tier listed

#### Monthly Spending Sparkline
- Small sparkline chart showing spending trend

#### Recent Updates
- News and updates feed

#### Rating Distribution
- Star rating distribution bar chart (1-5 stars)
- Overall average rating display

---

### 2. Search Routes

**Purpose:** Find routes, compare options, and book journeys

**API:**
- `GET /api/routes?search={query}&city={city}`
- `GET /api/routes/{id}/schedules`
- `POST /api/customer/journeys` (book)

**Features:**

#### Search Form
- **Origin** — Autocomplete input (debounced API calls)
- **Destination** — Autocomplete input
- **Date** — Date picker
- **Passengers** — Number input (1-10)
- **Search** button

#### Sort Options
- Price (Low to High / High to Low)
- Duration
- Distance
- Default

#### Filters
- **City** dropdown: All, BLR, DEL, MUM, CHN, HYD
- **Fare range** slider
- **Traffic level** filter

#### Route Results
- **Route cards** showing:
  - Route number, From → To
  - Distance, Duration, Fare
  - **Traffic Level Badge** (Low/Medium/High with color)
  - **Seat Availability Badge** (Many/Filling up/Few/Almost full)
  - **Weather Badge** (city-specific weather + delay advisory)
  - **Favorite toggle** (heart icon ❤️, stored in localStorage)
  - Checkbox for route comparison
- **Pagination** through results
- **Empty state** when no results

#### Selected Route Detail Panel
- **Stops Timeline** — Vertical timeline with:
  - Green dot = first stop
  - Blue dots = intermediate stops
  - Red dot = last stop
  - Current stop pulse animation
  - "Current"/"Next" badges
  - Estimated time + distance per stop
- **Amenities** display: WiFi, AC, Charging, CCTV, Emergency Exit
- **Book Now** button

#### Seat Selection Dialog
- Interactive seat grid for bus
- Visual seat layout
- Click to select/deselect

#### Booking Confirmation
- Ticket-style display with:
  - QR code (deterministic SVG pattern)
  - Tear-line separator
  - Journey details (route, date, time, seat, fare)
  - Passenger information

#### Route Comparison Dialog
- Select 2+ routes from results
- Side-by-side comparison:
  - Fare, Duration, Distance, Traffic, Availability
- "Best" badges on winning metrics

#### Fare Calculator
- Distance-based estimation: ₹5 base + ₹2/km

#### Route ETA Calculator
- ETA with stop-by-stop breakdown

#### Map Route Comparison
- Compare routes on Leaflet map with polylines

---

### 3. Route Map

**Purpose:** Visual map of all bus routes

**Features:**
- **Full-screen Leaflet map** with tile layer
- **All routes plotted** as colored polylines
- **Markers** with popups for start/end locations
- **Legend** showing route colors and status
- **Interactive:** Click routes for details
- **Zoom controls**
- **City switching**
- Dynamic Leaflet import (SSR-safe)

---

### 4. My Bookings

**Purpose:** Manage active and past bookings

**API:**
- `GET /api/customer/journeys?userId={userId}`
- `POST /api/customer/journeys/{id}/rate` (rate a journey)
- `DELETE /api/customer/journeys/{id}` (cancel booking)

**Features:**
- **Filter tabs:** All / Upcoming / Completed / Cancelled

#### Booking Cards
- Route number, From → To
- Date, Time, Fare
- **Status Badge:** Confirmed, Completed, Cancelled

#### Booking Status Timeline
- Visual progression: Confirmed → Boarded → Completed

#### Rate Journey
- Available on completed trips
- **Star rating** (1-5, interactive)
- **Feedback textarea**
- Submit button

#### Cancel Booking
- Confirmation dialog before cancellation

#### Upcoming Trip Details
- Seat number, QR code

#### Commute Statistics
- Per-route statistics

#### Monthly Spending Chart
- Recharts bar chart of spending by month

#### Travel Insights
- AI-generated travel insights
- Route frequency analysis
- Spending trend recommendations

---

### 5. Journey History

**Purpose:** Complete record of all past journeys

**API:** `GET /api/customer/journeys?userId={userId}`

**Features:**
- **Travel Timeline** — Visual timeline of all completed and cancelled journeys
- **Journey cards** — Route, From→To, Date, Fare, Status
- **Rate** button on completed journeys (star rating + feedback)
- **Monthly Spending Chart**
- **Travel Insights:**
  - Commute statistics
  - Route frequency
  - Spending trends
- Filter and search capabilities

---

### 6. Support

**Purpose:** Help, FAQ, and contact support

**Sub-sections:**

#### FAQ Section
- Expandable accordion FAQ items
- Common questions and answers

#### Help Topics
- Categorized help articles
- Organized by topic

#### Contact Us Form
- **Name** — text input
- **Email** — text input
- **Subject** — text input
- **Message** — textarea
- **Submit** button
- API: `POST /api/support/contact`

#### Complaint Submission
- **Issue type** — select/dropdown
- **Description** — textarea
- **File upload** — attachment support
- API: `POST /api/support/complaint`

#### Support Chat
- Message interface (UI only)
- Chat-style conversation display

#### Report an Issue
- Bug report form
- Description and details

---

## API Endpoints Reference

### Authentication
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth` | POST | Login (`action=login`), Register (`action=register`), Logout (`action=logout`) |

### Admin APIs
| Endpoint | Method | Description |
|---|---|---|
| `/api/analytics` | GET | Dashboard stats, fleet metrics, performance data |
| `/api/schedules` | GET/POST/PUT/DELETE | Schedule CRUD operations |
| `/api/routes` | GET/POST/PUT/DELETE | Route CRUD operations |
| `/api/crew` | GET | List all crew members |
| `/api/users` | GET | List all users |
| `/api/maintenance` | GET | Maintenance records |
| `/api/holidays` | GET | Holiday requests |

### Crew APIs
| Endpoint | Method | Description |
|---|---|---|
| `/api/crew/profile` | GET | Crew member profile by userId |
| `/api/crew/assignments` | GET | Crew assignments by crewId |
| `/api/crew/assignments/{id}/respond` | POST | Accept or decline assignment |
| `/api/crew/holidays` | GET/POST | Leave requests |
| `/api/crew/profile/availability` | PUT | Toggle availability status |
| `/api/crew-notes` | GET/POST/PUT | Shift handover notes |

### Customer APIs
| Endpoint | Method | Description |
|---|---|---|
| `/api/customer/spending` | GET | Spending statistics |
| `/api/customer/journeys` | GET/POST/DELETE | Journey CRUD (bookings) |
| `/api/customer/journeys/{id}/rate` | POST | Rate a completed journey |
| `/api/routes/{id}/schedules` | GET | Schedules for a specific route |

### Support APIs
| Endpoint | Method | Description |
|---|---|---|
| `/api/support/contact` | POST | Submit contact form |
| `/api/support/complaint` | POST | Submit complaint |

### WebSocket
| Channel | Description |
|---|---|
| `ws://.../?XTransformPort=3005` | Live notification feed (delays, arrivals, departures, system messages) |

---

## Data Architecture

### Database
- **Engine:** SQLite via Prisma ORM
- **Location:** `db/custom.db`
- **Seeding:** Deterministic Lehmer/Park-Miller PRNG (seed=42)
- **Data:** 205 user accounts, 2,128 schedules, 80+ routes

### State Management
All portals use **client-side React state** (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`) — no external state library.

| Portal | Persistent Storage |
|---|---|
| App | localStorage for: token, user, rememberEmail, sidebarCollapsed, announcement dismiss |
| Crew | localStorage for: shift handover notes (backup), daily notes |
| Customer | localStorage for: favorite routes |

### Key Data Models
- **Profile** — User accounts (admin, driver, conductor, customer)
- **CrewProfile** — Extended crew data (license, experience, performance)
- **Route** — Bus routes with stops, distance, fare
- **Schedule** — Trip schedules (date, time, status)
- **CrewAssignment** — Crew-to-schedule assignments
- **HolidayRequest** — Leave requests
- **TrafficAlert** — Traffic incidents
- **Notification** — User notifications
- **BusMaintenance** — Maintenance records
- **RouteAnalytics** — Performance metrics
- **Announcement** — System announcements

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@bus.com | password123 |
| Driver | driver1@bus.com | password123 |
| Conductor | conductor1@bus.com | password123 |
| Customer | customer1@bus.com | password123 |

---

*Built with Next.js 16, TypeScript 5, Tailwind CSS 4, shadcn/ui, Prisma ORM, Recharts, Leaflet, Socket.IO*
