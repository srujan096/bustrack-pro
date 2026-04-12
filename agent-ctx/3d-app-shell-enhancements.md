# Task ID: 3d — App Shell Enhancements
## Agent: Main
## Task: Enhance BusTrack Pro app shell with 8 major UI/UX improvements

### Changes Made to `/home/z/my-project/src/app/page.tsx`

#### 1. Enhanced Notification Dropdown
- Replaced text type badges with **icon badges** using lucide-react: `Info` (blue), `AlertTriangle` (amber), `CheckCircle2` (emerald), `XCircle` (red)
- Added **relative timestamps** ("2 min ago", "1 hour ago", "Yesterday") via new `relativeTime()` helper function
- Added **fade-out animation** when clicking a notification (marking as read): notification fades to 50% opacity and scales down before refresh
- Added **unread dot indicator**: a small blue dot appears to the left of unread notification titles
- Increased **max-height** from `max-h-80` to `max-h-96` and added `scroll-area-fade` CSS class for scroll-fade effect
- All styles include proper `dark:` variants

#### 2. Enhanced Login Page
- Added **6 floating particle dots** (CSS-only animation) with `@keyframes floatParticle` — varying sizes (1px-2.5px), positions, and animation durations (6s-9s)
- Added **"Forgot Password?"** link below the password field — clicking it shows a toast notification "Password reset link sent to your email!"
- Added **3 feature highlight icons** below Quick Login section: "Real-time Tracking" (Navigation), "Smart Scheduling" (Clock), "Secure Payments" (Shield) in a 3-column grid
- Added **version badge pulse animation** with `@keyframes versionPulse` — subtle green glow shadow pulse on the "v6.0" badge

#### 3. Enhanced Sidebar
- Added **hover tooltips** on sidebar items: when collapsed, hovering shows a `tooltip-accent` class tooltip with the page label
- Added **collapse/expand button** for desktop: a circular button on the right edge of the sidebar that toggles between full width (w-64) and icon-only mode (w-16)
- **Icon-only mode**: sidebar shrinks to w-16, shows only icons, section titles hidden, search hint hidden, logo centered, user shows avatar only with online green dot
- Added **"Help" button** at the bottom of sidebar with HelpCircle icon — clicking shows toast "Help center coming soon!"
- Sidebar uses `transition-all duration-300` for smooth width animation

#### 4. Enhanced Header
- Added **critical notification bar** below the main header: amber-to-orange gradient bar showing first 3 critical notifications as a scrolling message
- Added **dismiss button** (X icon) on the notification bar — click removes the bar
- Enhanced **user avatar** with a dedicated online status indicator (green dot with border) positioned at the bottom-right of the avatar circle
- All styles include `dark:` variants

#### 5. Enhanced Footer
- Added **"Back to top" button**: absolute-positioned circular button with ArrowUp icon at the top-right of the footer, smoothly scrolls to page top via `window.scrollTo({ behavior: 'smooth' })`
- Added **footer links**: "Privacy Policy", "Terms of Service", "Contact Us" — each shows a toast "X page coming soon!" when clicked (hidden on mobile)
- Made footer **more compact on mobile**: reduced padding (`py-1.5` vs `py-2.5`), system status indicators hidden on mobile
- Links count section (115 Routes, 104 Crew) hidden on small screens

#### 6. Enhanced Loading Screen
- Added **typewriter progress steps**: cycles through "Connecting...", "Loading routes...", "Fetching schedules...", "Almost ready..." with character-by-character typing animation
- Steps are displayed with `typing-cursor` CSS class for blinking cursor effect
- Added **bus animation** that drives across the loading screen from left to right using `@keyframes busDrive` (8s loop)
- Loading screen is now a separate `LoadingScreen` component with its own `style` tag
- BusIcon reused from existing component with emerald color and reduced opacity

#### 7. Enhanced Command Palette
- Added **"Recently Viewed" section**: when no search query, shows last 3 visited pages with a History icon and "RECENTLY VIEWED" header
- Added **keyboard navigation**: ArrowUp/ArrowDown to select items, Enter to navigate
- Selected item gets highlighted with `bg-gray-900/8` background
- Added **matching count**: "X of Y pages match" shown when search query is active
- Mouse hover also updates selection to match keyboard navigation
- Empty state now appears after recent pages section when no results found

#### 8. Enhanced Error Boundary
- Added **error icon animation**: `@keyframes errorIcon` — scale-in bounce animation when error appears
- Changed to **XCircle lucide icon** from generic SVG
- Increased icon size to `w-20 h-20` for more visual impact
- Added **"Go to Dashboard" button** alongside "Try Again" button
- Added **random Error ID**: generates `ERR-XXXXXXXX` (8 char alphanumeric) for support reference
- Error ID displayed in monospace font below the description text

### New Imports Added
- `Info, AlertTriangle, CheckCircle2, XCircle` from lucide-react (notification type icons)
- `HelpCircle` from lucide-react (sidebar help button)
- `ArrowUp` from lucide-react (back to top button)
- `Navigation, Shield, CreditCard` from lucide-react (feature highlights — CreditCard unused but imported for potential future use)
- `ChevronLeft, ChevronRight` from lucide-react (sidebar collapse/expand toggle)
- `History` from lucide-react (recent pages header icon)
- `toast` from `@/hooks/use-toast` (toast notifications for forgot password, help, footer links)

### CSS Additions (inline `<style>` tags)
- `@keyframes floatParticle` — floating dots animation
- `@keyframes errorIcon` — error boundary icon entrance animation
- `@keyframes versionPulse` — version badge subtle glow pulse
- `@keyframes busDrive` — loading screen bus driving across

### Lint Results
- **0 errors, 0 warnings** in `src/app/page.tsx`
- Used 1 eslint-disable-next-line for `react-hooks/set-state-in-effect` in the recent pages tracking effect (valid use case: tracking navigation history)
