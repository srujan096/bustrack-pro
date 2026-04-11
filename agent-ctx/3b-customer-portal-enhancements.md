# Task 3b: Customer Portal Enhancements

## Changes Made to `/home/z/my-project/src/components/customer/customer-content.tsx`

### 1. Support Page - FAQ Section Enhancement
- Moved FAQ section ABOVE the complaint form (was below "My Complaints" before)
- Replaced `ChevronRight` with `ChevronDown` that rotates 180° on expand via `transition-transform duration-300`
- Updated FAQ text content to match the specified 5 items exactly
- FAQ items use search input that filters both questions and answers
- Added hover effect on FAQ items: `hover:bg-muted/30 dark:hover:bg-muted/10`
- FAQ expanded content uses `animate-in fade-in slide-in-from-top-1 duration-200`
- Removed duplicate FAQ section that was at the bottom

### 2. Dashboard - Trip Planner Enhancement
- Enhanced Step 3 (was a simple visual route) to show **3 suggested routes** as interactive cards
- Each route shows: route number (badge), departure time, duration, fare × passengers, available seats
- Each has a "Select" button that triggers a toast and redirects to search
- Routes are generated deterministically based on the user's chosen time
- Added `hover:scale-[1.02] active:scale-[0.98]` on route suggestion cards

### 3. My Bookings - Status Timeline
- Added `BookingStatusTimeline` component with 4 stages: Booked (green) → Confirmed (blue) → Boarding (amber) → Completed (emerald)
- Timeline inserted between Tear Line 1 and Journey Details section of each booking card
- Current status shows pulsing animated dot (`animate-ping`)
- Completed stages show checkmark overlay
- Future stages are greyed out (`bg-gray-300 dark:bg-gray-600`)
- Connecting lines between stages change color based on completion
- Full dark mode support

### 4. Journey History - Enhanced Stats
- Added 3 new stat cards in a grid below TravelStats:
  - **Most Visited Route**: Dynamically computed from journey data, shows route number and count
  - **Favorite Travel Time**: Computes most common departure hour from journey data, shows 12-hour format
  - **Monthly Spending Trend**: Mini bar chart showing last 6 months with gradient bars
- All cards use `card-lift hover:scale-[1.02] transition-all duration-300`
- Added `MonthlySpendingChart` component with animated gradient bars

### 5. Route Map Page - Route ETA Calculator
- Added `RouteETACalculator` component below the map cards
- Two select dropdowns for start/end stops (populated from route's stops data)
- Calculate button validates selections and computes:
  - Estimated time (based on distance × 2.5 + stops × 3 min)
  - Distance (proportional to stop difference)
  - Fare (₹5 base + ₹2/km)
  - Stops count
- Results shown in a 2×2 grid with animated entry
- Full dark mode support
- Uses `transit-card` CSS class

### 6. General - Enhanced Animations
- Page wrapper: `animate-in fade-in slide-in-from-bottom-4 duration-500`
- Page header: `animate-in fade-in slide-in-from-bottom-3 duration-300`
- `statusBadge()`: Added dark mode variants + `transition-all duration-300`
- `trafficBadge()`: Added dark mode variants + `transition-all duration-300`

## Lint Results
- `src/components/customer/customer-content.tsx`: **0 errors, 0 warnings** ✅
- Pre-existing error in `src/app/page.tsx` (EmptyNotifications component) is unrelated to this task
