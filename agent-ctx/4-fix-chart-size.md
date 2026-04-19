# Task 4: Fix Crew Portal "This Week's Hours" Chart Size Issue

## Work Record

### Root Cause
The `WeeklyHoursBarChart` SVG in `crew-content.tsx` (line 1562) used `preserveAspectRatio="none"` which caused the chart to stretch to fill its container. The SVG viewBox was `0 0 100 204` (very narrow portrait aspect ratio), so with `preserveAspectRatio="none"` the chart bars became distorted and the entire chart appeared "super enlarged" when the container was wider than tall.

### Fix Applied
**File**: `src/components/crew/crew-content.tsx` line 1562

Changed:
```tsx
<svg viewBox={`0 0 ${chartWidth} ${totalChartHeight}`} className="w-full" preserveAspectRatio="none">
```
To:
```tsx
<svg viewBox={`0 0 ${chartWidth} ${totalChartHeight}`} className="w-full" style={{ maxHeight: '240px' }} preserveAspectRatio="xMidYMid meet">
```

**What this does:**
1. `preserveAspectRatio="xMidYMid meet"` — preserves the SVG's aspect ratio and centers it within its container
2. `style={{ maxHeight: '240px' }}` — caps the chart height at 240px so it doesn't dominate the card

### Other Sections Checked (No Issues Found)
1. **Dashboard "This Week Stats" row** (lines 2558-2610): Uses `text-xl` and `text-2xl` which are appropriate dashboard stat sizes. No enlargement issues.
2. **"This Week" overtime section** (lines 1389-1414): Uses `text-xl` for overtime values and `text-[10px]` for labels — normal and appropriate sizes.

### Verification
- ESLint: 0 errors, 0 warnings
- Dev server compiles successfully
- All existing functionality preserved
