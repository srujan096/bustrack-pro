# Task 3-c: Connecting Routes Algorithm (Customer Search)

## Summary
Implemented connecting routes feature for BusTrack Pro customer portal. When no direct route exists between two locations, the system now finds two-leg journeys with a transfer point.

## Files Modified
1. `src/app/api/routes/route.ts` — Added connecting routes algorithm
2. `src/components/customer/customer-content.tsx` — Added connecting routes UI display

## Key Changes

### API (`src/app/api/routes/route.ts`)
- Added `parseStopNames()` helper to safely extract stop names from `stopsJson`
- Added `findConnectingRoutes()` algorithm: O(n×m×s) where n=outgoing, m=incoming, s=stops per route
- Case-insensitive stop matching with deduplication via Map
- 10-minute transfer time added to total duration
- Returns `{ direct, connecting }` format when both startLocation & endLocation provided
- Backward-compatible: returns `{ routes }` for other query types

### Frontend (`src/components/customer/customer-content.tsx`)
- Added `ConnectingRouteResult` and `RouteLeg` TypeScript interfaces
- Added `connectingResults` state to SearchRoutes
- Updated `handleSearch` to handle new `{ direct, connecting }` response format
- Violet/purple themed connecting routes cards with:
  - Arrow flow diagram (Origin → Leg1 → Transfer → Leg2 → Destination)
  - Leg detail cards in 2-column grid
  - Total summary bar with duration and fare
  - "Fastest" badge on first result
  - Full dark mode support

## Verification
- ESLint: 0 errors, 0 warnings
- Dev server compiles successfully
- Existing direct route search preserved
