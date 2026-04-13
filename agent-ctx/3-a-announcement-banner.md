---
Task ID: 3-a
Agent: Main - Announcement Banner System
Task: Add Announcement Banner System + API

## Work Log

### 1. Prisma Schema - Announcement Model
- Added `Announcement` model to `prisma/schema.prisma` with fields:
  - id (cuid), title, message, type (info/warning/success/urgent), role (all/admin/driver/conductor/customer), active (boolean), createdAt, updatedAt
- Ran `bun run db:push` to sync database schema
- Prisma Client regenerated successfully

### 2. Announcements API Endpoint (`/api/announcements`)
- **GET**: Lists announcements with optional `?role=xxx` filter
  - Filters by `active=true` by default (can be disabled with `?active=false`)
  - When role is specified, returns announcements for that role AND "all" role
  - Auto-seeds 4 default announcements on first request if none exist
- **POST**: Three actions:
  - `action=create`: Creates new announcement (admin). Validates title, message, type, role
  - `action=dismiss`: Confirms dismissal (client-side tracking via localStorage)
  - `action=toggle`: Toggles active status of an announcement by ID

### 3. Pre-seeded Announcements
4 default announcements created on first API call:
1. **System Maintenance Notice** (warning, all roles) - Scheduled maintenance info
2. **New Route Launched: R-200 Express** (success, all roles) - New route announcement
3. **Crew Safety Training Mandatory** (urgent, driver role) - Training requirement
4. **Fare Update Effective Next Week** (info, customer role) - Fare change notice

### 4. AnnouncementBanner Component (`src/components/announcement-banner.tsx`)
- Color-coded by type with full dark mode support:
  - info: sky blue
  - warning: amber
  - success: emerald
  - urgent: red
- **Auto-rotation**: Cycles through announcements every 8 seconds with progress bar animation
- **Pause on hover**: Rotation pauses when user hovers over the banner
- **Dismiss**: X button hides the announcement (persisted in localStorage)
- **Navigation dots**: Clickable dots for manual navigation between announcements (desktop)
- **Slide-in animation**: `bannerSlideIn` CSS animation for smooth appearance
- **Role-based filtering**: Only shows announcements matching user's role or "all"
- **Lazy initialization**: Dismissed IDs loaded from localStorage via lazy useState init
- **Auto-refresh**: Fetches new announcements every 60 seconds

### 5. Integration into App Shell
- Added `AnnouncementBanner` component to `AppShell` in `page.tsx`
- Positioned between the notification ticker area and the main content
- Placed ABOVE the critical notification bar and header
- Passes `userRole` prop for role-based filtering

## Verification Results
- ESLint: 0 errors, 0 warnings
- Dev server compiles successfully
- All existing functionality preserved
- No breaking changes to existing components

## Files Created/Modified
- `prisma/schema.prisma`: Added Announcement model
- `src/app/api/announcements/route.ts`: New API endpoint (GET/POST)
- `src/components/announcement-banner.tsx`: New AnnouncementBanner component
- `src/app/page.tsx`: Imported and integrated AnnouncementBanner in AppShell
