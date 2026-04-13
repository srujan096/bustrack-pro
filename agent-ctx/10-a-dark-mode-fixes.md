# Task 10-a: Dark Mode Fixes

## Task 1: Customer Portal Dark Mode Fixes (`src/components/customer/customer-content.tsx`)

### Fixes Made (24 total)

#### Background Color Dark Variants (10 fixes)
1. **Line ~418-421** - `getWeatherForCity()` - 4 city weather badge gradients: added `dark:from-*` and `dark:to-*` variants for red/orange, blue/sky, gray/slate, amber/yellow
2. **Line ~2748** - Search error card: `bg-red-50` → added `dark:border-red-800 dark:bg-red-950/50`
3. **Line ~3892** - Bookings error div: `bg-red-50` → added `dark:border-red-800 dark:bg-red-950/50 dark:text-red-400`
4. **Line ~4575** - Journey History error div: same as above
5. **Line ~671** - Bus amenities available state: `bg-emerald-50` → added `dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300`
6. **Line ~1668-1689** - Commute Statistics metrics (4 items): `bg-sky-100`, `bg-violet-100`, `bg-amber-100`, `bg-emerald-100` → added `dark:bg-*-900/40` variants
7. **Line ~3544-3588** - Route Info Cards (5 items): `bg-violet-100`, `bg-sky-100`, `bg-amber-100`, `bg-emerald-100`, `bg-rose-100` → added `dark:bg-*-900/40` variants + `dark:text-*-400` icon colors

#### Text Color Dark Variants (9 fixes)
8. **Line ~2982** - Search result fare: `text-emerald-700` → added `dark:text-emerald-400`
9. **Line ~3979** - Booking fare: same fix
10. **Line ~941** - Quick Trip Planner fare: same fix
11. **Line ~1053** - Live Bus Tracker fare: same fix
12. **Line ~2434** - Fare Calculator estimated fare: same fix
13. **Line ~3720** - Travel Timeline fare: same fix
14. **Line ~418-421** - Weather badge text: 4 city text colors → added `dark:text-*-300` variants

#### Ring Color Dark Variants (2 fixes)
15. **Line ~645-648** - Route detail timeline dots: `ring-emerald-200`, `ring-red-200`, `ring-amber-200` → added `dark:ring-*-800`
16. **Line ~3680-3682** - Travel Timeline status dots: same fix (completed/planned/cancelled)

#### Border Color Dark Variants (1 fix)
17. **Line ~1321** - Seat selection available seats: `border-emerald-400` → added `dark:border-emerald-500`

#### Badge/Status Color Dark Variants (10 fixes)
18. **Line ~3866-3872** - `receiptStatus()` function: 4 status badges (Confirmed/Completed/Cancelled/Planned) → added `dark:bg-*-900/50 dark:text-*-300 dark:border-*-700`
19. **Line ~4873-4880** - `SEVERITY_COLORS` and `STATUS_COLORS`: 6 badge entries → added full dark variants

---

## Task 2: Admin Portal Sidebar Dark Theme Polish (`src/app/page.tsx`)

### Fixes Made (3 total)
1. **Line ~2205** - Portal label text: `text-gray-500` → added `dark:text-gray-400`
2. **Line ~2265** - User email text: `text-gray-500` → added `dark:text-gray-400`
3. **Line ~2280** - Sign Out button text: `text-gray-500 hover:text-red-600` → added `dark:text-gray-400 dark:hover:text-red-400`

### Verification
- Existing sidebar dark variants were already in place: `border-gray-200 dark:border-gray-800`, `bg-gray-50 dark:bg-gray-800/50`, `hover:bg-gray-100 dark:hover:bg-gray-800`, `text-gray-400 dark:text-gray-500`, etc.
- Active page indicator already works in dark mode via `text-gray-900 dark:text-white` with gradient glow dots
- The `glass-sidebar` CSS class provides a consistent dark background regardless of theme

## Verification
- ESLint: 0 errors, 0 warnings
- All edits are additive (dark: variants only), no existing classes changed
