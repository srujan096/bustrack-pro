# Task 6b: Announcement Banner Dismiss Persistence

## Summary
Added localStorage-based persistence with 24-hour expiration to the announcement banner dismiss feature.

## Changes Made

### File: `src/components/announcement-banner.tsx`

1. **Replaced localStorage key** from `bus_dismissed_announcements` to `bt_dismissed_announcements` to match the app's `bt_` prefix convention.

2. **Changed storage format** from a flat array of IDs (`["id1", "id2"]`) to a timestamp-keyed map (`{ "id1": 1719000000000, "id2": 1719000100000 }`). This enables time-based expiration.

3. **Added `DismissedMap` interface** and helper constants:
   - `DISMISSED_KEY = 'bt_dismissed_announcements'`
   - `TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000` (ms)
   - `DismissedMap { [announcementId: string]: number }`

4. **Replaced `getDismissedIds()` with `getDismissedMap()`**:
   - Reads the JSON map from localStorage
   - Iterates through all entries and deletes any older than 24 hours
   - Writes the cleaned map back to localStorage if any entries were expired
   - Returns the cleaned map

5. **Updated `addDismissedId()`** to store `Date.now()` as the value for the dismissed announcement ID.

6. **Updated state type** from `Set<string>` to `DismissedMap`, lazy-initialized via `getDismissedMap()`.

7. **Updated `visibleAnnouncements` useMemo** filter logic: an announcement is visible if it has no dismissal timestamp OR the timestamp is older than 24 hours.

8. **Updated `handleDismiss`** to set both localStorage (via `addDismissedId`) and React state (via `{ ...prev, [id]: Date.now() }`).

9. **Removed unused `useCallback` import**.

## Behavior
- Dismissed announcements stay hidden for 24 hours, then automatically reappear
- Expired dismissals are cleaned up from localStorage on every component mount
- No breaking changes to existing announcement display, navigation, or UI
