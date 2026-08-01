# Task 1-a: Fix Map Marker Icons

## Agent: marker-icon-fix

## Problem
Map marker icons used CSS `rotate(-45deg)` and flex layout for a pin shape, causing the visual pin tip to NOT align with the `iconAnchor` point. Markers appeared offset from actual click locations.

## Solution
Replaced `createOriginIcon()` and `createDestIcon()` functions in `src/components/sivan/InteractiveMapInner.tsx` (lines 59-105) with pure inline SVG implementations.

### Key Changes
- **SVG teardrop path**: `M18 48C18 48 0 30 0 18C0 8 8 0 18 0S36 8 36 18C36 30 18 48 18 48Z`
  - ViewBox: `0 0 36 48` (36px wide, 48px tall)
  - Pin tip at exact bottom-center `(18, 48)`
- **iconSize**: `[36, 48]` matches SVG viewBox exactly
- **iconAnchor**: `[18, 48]` points to pin tip (bottom-center = halfWidth, fullHeight)
- **Origin marker**: gold/amber gradient (#E5C76B → #B8941F), white circle, #A07A15 stroke
- **Destination marker**: red gradient (#F87171 → #DC2626), white circle, #B91C1C stroke
- **Drop shadow**: `filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3))`
- **Pulse animation**: Absolutely positioned div at bottom, using existing `@keyframes markerPulseGold`/`markerPulseRed` from `leaflet.css`

### Files Modified
- `src/components/sivan/InteractiveMapInner.tsx` — replaced two icon creation functions (lines 59-105)

### Files NOT Modified
- `src/styles/leaflet.css` — existing pulse keyframes reused as-is

### Verification
- ESLint passes clean
- No other code changed
