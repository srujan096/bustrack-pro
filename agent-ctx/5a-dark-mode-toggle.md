# Task 5a: Dark Mode Toggle Implementation

## Summary

The BusTrack Pro project already had most of the dark mode toggle infrastructure in place. This task reviewed and improved the existing implementation to meet all specified requirements.

## What Was Already In Place

1. **ThemeProvider** in `layout.tsx` (lines 36-44): Already configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`. The `<html>` element has `suppressHydrationWarning`.

2. **ThemeToggle component** in `page.tsx` (line 2087): Already existed with:
   - `useTheme()` hook from `next-themes`
   - Sun/Moon icon toggle based on `resolvedTheme`
   - Icon rotation animations on toggle and hover
   - Flash/ripple overlay effect on theme change
   - Positioned in header between `WeatherWidget` and `NotificationBell` (line 2584)

3. **Imports**: `Sun`, `Moon` from lucide-react and `useTheme` from `next-themes` were already imported.

## Changes Made

### File: `/home/z/my-project/src/app/page.tsx`

**1. Added `useSyncExternalStore` to React imports (line 3)**
```typescript
// Before:
import React, { useState, useEffect, useCallback, useRef, Component } from 'react';
// After:
import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore, Component } from 'react';
```

**2. Replaced `useState` + `useEffect` mounted detection with `useSyncExternalStore` (lines 2089-2094)**
```typescript
// Before:
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);

// After:
const mounted = useSyncExternalStore(
  () => () => {},
  () => true,
  () => false,
);
```
- Uses React 19's recommended `useSyncExternalStore` pattern to detect client-side mounting
- Avoids React 19 lint error (`react-hooks/set-state-in-effect`) that fired when using `setState` inside `useEffect`
- Server snapshot returns `false`, client snapshot returns `true`, preventing hydration mismatch

**3. Removed redundant manual `localStorage.setItem('bt_theme', newTheme)` (line 2099)**
- `next-themes` already handles localStorage persistence automatically with key `theme`
- The manual write was redundant and could potentially conflict

**4. Changed button class from `transition-all` to `transition-colors` (line 2120)**
```typescript
// Before:
className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 group"

// After:
className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300 group"
```

**5. Added `mounted` guard for icon rendering (lines 2124-2131)**
```typescript
// Before:
{resolvedTheme === 'dark' ? <Sun .../> : <Moon .../>}

// After:
{!mounted ? (
  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
) : resolvedTheme === 'dark' ? (
  <Sun .../>
) : (
  <Moon .../>
)}
```
- Shows a pulsing placeholder skeleton during SSR/hydration to prevent icon flash
- Only renders the correct icon after client-side mount is confirmed

**6. Added descriptive `title` attribute (line 2122)**
```typescript
title={mounted ? (resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
```

**7. Removed `suppressHydrationWarning` from button**
- No longer needed since we use the `mounted` guard to prevent mismatch entirely

## Requirements Checklist

| Requirement | Status | Notes |
|---|---|---|
| ThemeProvider wrapping the app | ✅ Already existed | layout.tsx lines 36-44 |
| Dark mode toggle in header | ✅ Already existed | page.tsx line 2584, between WeatherWidget and NotificationBell |
| Sun/Moon icons switching | ✅ Already existed | Sun for dark mode, Moon for light mode |
| Respect system preference | ✅ Already existed | `defaultTheme="system"` + `enableSystem` |
| Persist to localStorage | ✅ Already handled | `next-themes` auto-persists |
| Toggle between clock and bell | ✅ Already existed | Positioned correctly in header flow |
| Smooth transition | ✅ Improved | Changed to `transition-colors`, added mounted guard |

## Verification

- ✅ `bun run lint` passes with zero errors
- ✅ Dev server shows no errors or warnings
- ✅ Toggle works in all 3 portal dashboards (Admin, Crew, Customer)
- ✅ No hydration mismatch warnings
