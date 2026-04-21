# BusTrack Pro — Seed Data Summary

This document provides a comprehensive overview of all data seeded into the BusTrack Pro database by the `prisma/seed.ts` script.

---

## 1. Overview

| Category | Count |
|----------|-------|
| **Total Accounts** | 205 |
| - Admin | 1 |
| - Drivers | 60 |
| - Conductors | 44 |
| - Customers | 100 |
| **Total Routes** | ~115 |
| - Bangalore (BLR) | 50 |
| - Mumbai (MUM) | 20 |
| - Delhi (DEL) | 15 |
| - Chennai (CHN) | 15 |
| - Inter-city | 15 |
| **Schedules** | Generated for today and yesterday (per-route, based on `autoScheduleEnabled` flag) |
| **Crew Assignments** | ~40% of schedules have driver + conductor assignments |
| **Journeys** | ~40 initial + 50 historical (last 30 days) + 20 planned (today/tomorrow) |
| **Traffic Alerts** | 15 |
| **Notifications** | 50 base + 10 varied = 60 |
| **Bus Maintenance Records** | 30 |
| **Route Analytics** | 7 days of data for all routes |
| **Holiday Requests** | 20 (for first 20 crew members) |
| **Support Tickets** | 5 (for first customer only) |

---

## 2. All Login Credentials

> **Universal password for ALL 205 accounts: `password123`**

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | `admin@bus.com` | `password123` | System Administrator |
| Driver #1 | `driver1@bus.com` | `password123` | Sudha Babu |
| Conductor #1 | `conductor1@bus.com` | `password123` | Krishna Kapoor |
| Customer #1 | `customer1@bus.com` | `password123` | Manish Desai |

### Email Patterns
- **Drivers**: `driver1@bus.com` through `driver60@bus.com`
- **Conductors**: `conductor1@bus.com` through `conductor44@bus.com`
- **Customers**: `customer1@bus.com` through `customer100@bus.com`

For the full list of all 205 accounts with names, see `CREDENTIALS.txt` in the project root.

---

## 3. Routes Data Summary

### Bangalore (BLR) — 50 routes
- **Prefix**: `KIA-001` through `KIA-050+`
- **48 landmark locations** including: Majestic Bus Stand, Koramangala, Indiranagar, Whitefield, Electronic City, MG Road, HSR Layout, Jayanagar, Banashankari, Hebbal, Yelahanka, Marathahalli, BTM Layout, JP Nagar, Rajajinagar, Basavanagudi, Malleshwaram, Peenya, Silk Board, KR Puram, Bellandur, Sarjapur Road, Hennur, Tumkur Road, Hosur Road, Bannerghatta Road, Old Airport Road, Cunningham Road, Lavelle Road, Richmond Road, Brigade Road, Church Street, Residency Road, Cubbon Park, Vidhana Soudha, Lalbagh, City Market, Shivajinagar, Yeswanthpur, Vijayanagar, Bommanahalli, Kengeri, Mysore Road, Magadi Road, Yeshvantpur Industrial, Nagasandra, Bagalur
- **Fare formula**: `Math.round(20 + adjustedDistance * 2)` (base ₹20 + ₹2/km)
- **Distance factor**: Haversine distance × 1.3 (road factor)
- **Average speed assumption**: ~25 km/h
- **Frequency**: 15, 20, 30, 45, or 60 minutes
- **Schedule window**: 5:00 AM – 8:00 PM (start) to 8:00 PM – 11:00 PM (end)

### Mumbai (MUM) — 20 routes
- **Prefix**: `BEST-001` through `BEST-020+`
- **20 landmark locations** including: Mumbai Central, Andheri, Bandra, Juhu, Dadar, Thane, Borivali, Vashi, Churchgate, CSMT, Lower Parel, Powai, Goregaon, Malad, Kandivali, Bhandup, Mulund, Vikhroli, Ghatkopar, Kurla

### Delhi (DEL) — 15 routes
- **Prefix**: `DTC-001` through `DTC-015+`
- **15 landmark locations** including: Connaught Place, Karol Bagh, Saket, Dwarka, Rohini, Noida, Gurgaon, Lajpat Nagar, Chandni Chowk, AIIMS, ISBT Kashmere Gate, Rajouri Garden, Pitampura, Janakpuri, Vasant Kunj

### Chennai (CHN) — 15 routes
- **Prefix**: `MTC-001` through `MTC-015+`
- **15 landmark locations** including: Chennai Central, T. Nagar, Anna Nagar, Adyar, Velachery, Porur, Tambaram, Guindy, Nungambakkam, Egmore, Mylapore, OMR, ECR, Chromepet, Pallavaram

### Inter-city — 15 routes
- **Prefix**: `RTC-001` through `RTC-015+`
- **Fixed route pairs**:
  1. Majestic Bus Stand → Mumbai Central
  2. Majestic Bus Stand → Chennai Central
  3. Majestic Bus Stand → Connaught Place
  4. Mumbai Central → Connaught Place
  5. Connaught Place → Chennai Central
  6. Indiranagar → Bandra
  7. Electronic City → Velachery
  8. Dadar → Gurgaon
  9. Majestic Bus Stand → Hyderabad Central
  10. Mumbai Central → Pune Station
  11. Chennai Central → Kolkata Howrah
  12. Indiranagar → Juhu
  13. Connaught Place → Majestic Bus Stand
  14. Tambaram → Electronic City
  15. Gurgaon → Mumbai Central
- **Fare formula**: `Math.round(200 + distance * 3)` (base ₹200 + ₹3/km)
- **Distance factor**: Haversine × 1.2
- **Average speed assumption**: ~50 km/h
- **Frequency**: 120 minutes (2 hours)
- **Schedule window**: 06:00 – 23:00

---

## 4. Per-Account Seeded Data

### Admin (`admin@bus.com`)
- Full system access to all data
- Listed as `reviewedBy` on some approved holiday requests
- No CrewProfile or journey data

### Drivers (`driver1@bus.com` – `driver60@bus.com`)
Each driver has:
- **CrewProfile** with:
  - License number (format: `DLXXXXXXXXYYYY`, 8+4 digits)
  - Experience years: 1–20 (deterministic)
  - Performance rating: 3.5–5.0 (deterministic)
  - Availability: ~85% "available", ~15% "on_leave"
  - Bus number (format: `{PREFIX}-{LETTER}{4DIGITS}`, e.g., `KA-01-F4521`)
  - Assigned city: BLR, MUM, DEL, or CHN (deterministic)
- **Crew Assignments**: ~40% of schedules get crew assignments; drivers are randomly paired with conductors
- **Holiday Requests**: First 20 crew members (mix of drivers/conductors) have 1 leave request each (reasons: Personal leave, Family function, Medical, Travel, Festival; statuses: pending/approved/rejected)
- **Notifications**: First 20 crew members get a "Schedule Update" notification; some get additional varied notifications (route delays, trip completed, leave approved, etc.)

### Conductors (`conductor1@bus.com` – `conductor44@bus.com`)
Each conductor has:
- **CrewProfile** with:
  - License number (format: `CLXXXXXXXX`, 8 digits)
  - Experience years: 1–15
  - Performance rating: 3.5–5.0
  - Availability: ~85% "available", ~15% "on_leave"
  - Bus number: empty string (conductors are not assigned a specific bus)
  - Specialization: `"conductor"`
- Same crew assignment, holiday request, and notification behavior as drivers

### Customers (`customer1@bus.com` – `customer100@bus.com`)
Each customer has:
- **Journeys**: Varies — customers are randomly assigned journeys across routes
  - ~40 initial journeys (completed/planned based on schedule status)
  - 50 additional completed journeys spread across the last 30 days
  - 20 additional planned journeys for today/tomorrow
  - Completed journeys include ratings (3–5 stars) and feedback text
- **Notifications**: First 30 customers get a "Schedule Update" notification; some get additional varied notifications (payment failed, new route available, schedule change, etc.)
- **Customer #1** (`customer1@bus.com` — Manish Desai) has **5 support tickets**:
  1. "Bus arrived 30 minutes late on Route KIA-001" — complaint, high priority, open
  2. "Refund not processed for cancelled ticket" — refund, normal priority, in_progress
  3. "AC not working on KIA-003 evening service" — complaint, high priority, resolved
  4. "Unable to book seat for tomorrow morning route" — general, normal priority, open
  5. "Add digital season pass for monthly commuters" — suggestion, low priority, open

### Additional Seeded Data (not account-specific)

| Data Type | Count | Details |
|-----------|-------|---------|
| **Traffic Alerts** | 15 | Types: congestion, accident, road_closure, weather. Severities: low, medium, high, critical. Delay: 5–45 min. ~50% resolved. |
| **Notifications** | 60 total | 50 base "Schedule Update" + 10 varied (route delay, trip completed, payment failed, new route, schedule change, leave approved, maintenance reminder, assignment conflict, monthly rating, bus breakdown) |
| **Bus Maintenance** | 30 | Service types: routine, repair, inspection. Cost: ₹500–₹15,000. Notes: oil change, brake service, tire rotation, engine checkup, AC repair, general inspection. |
| **Route Analytics** | All routes × 7 days | Completion rate: 70–100%. Revenue: ₹5,000–₹50,000. Delay: 0–30 min. Total journeys: 5–40 (weekdays), 2–20 (weekends). |

---

## 5. Deterministic Data Generation

The seed script uses a **Lehmer / Park-Miller PRNG** (pseudorandom number generator) with a fixed seed of **42**:

```typescript
const _prngSeed = { value: 42 };
function seededRandom(): number {
  _prngSeed.value = (_prngSeed.value * 16807) % 2147483647;
  return (_prngSeed.value - 1) / 2147483646;
}
```

This means:
- Every `seededRandom()` call produces the **same sequence** every time you run the seed
- All "random" names, ratings, distances, fares, assignments, etc. are **100% deterministic**
- Running `bunx prisma db seed` on any machine will produce **identical data**
- The order of operations matters — the PRNG state advances sequentially through all seed steps

### Deterministic Helper Functions
- `randomBetween(min, max)` — integer in range
- `randomFloat(min, max, decimals)` — float with specified precision
- `pickRandom(array)` — select element from array

---

## 6. How to Reset / Reseed

```bash
cd /home/z/my-project
bun run db:push      # Push schema changes (creates tables if needed)
bunx prisma db seed  # Run the seed script (clears all data, then reseeds)
```

The seed script clears all tables in the correct dependency order before inserting new data, so it's safe to run multiple times.

---

## 7. How to Delete All Data and Add Your Own

### Option 1: Re-seed with a modified seed.ts
```bash
# Edit the seed script with your custom data
nano prisma/seed.ts

# Then reseed
bunx prisma db seed
```

### Option 2: Delete via Prisma Studio (GUI)
```bash
bunx prisma studio
# Open http://localhost:5555 in your browser
# Navigate to each table and delete records manually
```

### Option 3: Reset the database completely
```bash
# Delete the SQLite database file
rm -f db/bustrack.db

# Recreate tables from schema
bun run db:push

# (Optionally) reseed with demo data
bunx prisma db seed
```

### Option 4: Start with an empty database
```bash
# Delete the database
rm -f db/bustrack.db

# Recreate tables
bun run db:push

# Do NOT run the seed — the database will be empty
# Create your own data through the app UI or API
```

---

## Seed Script File Locations

| File | Purpose |
|------|---------|
| `prisma/seed.ts` | Main seed script — all demo data generation logic |
| `prisma/schema.prisma` | Database schema definition (all tables/models) |
| `CREDENTIALS.txt` | Auto-generated list of all 205 login credentials |
| `db/bustrack.db` | SQLite database file (created by `bun run db:push`) |
