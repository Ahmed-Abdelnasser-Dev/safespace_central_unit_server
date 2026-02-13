# Blocked Lanes Test Suite Guide

## Overview
This test suite validates the automated decision-making system for accident detection and lane management. It tests polygon intersection detection, lane configuration calculations, and speed limit adjustments.

## Setup
**Prerequisites:**
- Backend server running on `http://localhost:5000`
- Node `safe-space-node-001` registered with 4 configured lanes
- Test image available at `/home/nasser/Downloads/test-image.jpg`

## Running Tests
```bash
cd /home/nasser/Projects/fullstack/SafeSpace/backend
./test-blocked-lanes.sh
```

## Test Cases

### **Test 1: Lane 1 Blocked (Left-most)**
- **Polygon:** x: 100-300, y: 300-600
- **Expected Configuration:** `blocked,right,open,open`
- **Expected Speed:** 80 → 70 km/h (12.5% reduction)
- **Logic:** 1 blocked / 4 total = 25% × 0.5 = 12.5%

### **Test 2: Lane 2 Blocked (Middle)**
- **Polygon:** x: 500-700, y: 300-600
- **Expected Configuration:** `left,blocked,right,open`
- **Expected Speed:** 80 → 70 km/h (12.5% reduction)
- **Logic:** Lane 1 merges left away from blocked Lane 2; Lane 3 merges right

### **Test 3: Lane 3 Blocked**
- **Polygon:** x: 900-1100, y: 300-600
- **Expected Configuration:** `open,left,blocked,right`
- **Expected Speed:** 80 → 70 km/h (12.5% reduction)
- **Logic:** Lane 2 merges left away from blocked Lane 3; Lane 4 merges right

### **Test 4: Lane 4 Blocked (Right-most)**
- **Polygon:** x: 1300-1500, y: 300-600
- **Expected Configuration:** `open,open,left,blocked`
- **Expected Speed:** 80 → 70 km/h (12.5% reduction)
- **Logic:** Lane 3 merges left away from blocked Lane 4

### **Test 5: Lanes 1 & 2 Blocked (Adjacent)**
- **Polygon:** x: 100-700, y: 300-600 (wide polygon covering both)
- **Expected Configuration:** `blocked,blocked,right,open`
- **Expected Speed:** 80 → 60 km/h (25% reduction)
- **Logic:** 2 blocked / 4 total = 50% × 0.5 = 25%

### **Test 6: Lanes 2 & 3 Blocked (Adjacent)**
- **Polygon:** x: 500-1100, y: 300-600
- **Expected Configuration:** `left,blocked,blocked,right`
- **Expected Speed:** 80 → 60 km/h (25% reduction)
- **Logic:** Lane 1 merges left away from blocked Lane 2; Lane 4 merges right

### **Test 7: Lanes 3 & 4 Blocked (Adjacent)**
- **Polygon:** x: 900-1500, y: 300-600
- **Expected Configuration:** `open,left,blocked,blocked`
- **Expected Speed:** 80 → 60 km/h (25% reduction)
- **Logic:** Lane 2 merges left away from blocked Lane 3

### **Test 8: Lanes 1 & 3 Blocked (Non-Adjacent)**
- **Polygon:** Two separate rectangles
- **Expected Configuration:** `blocked,open,blocked,right`
- **Expected Speed:** 80 → 60 km/h (25% reduction)
- **Logic:** Lane 2 is adjacent to two blocked lanes, so it stays open; Lane 4 merges right

### **Test 9: Lanes 2 & 4 Blocked (Non-Adjacent)**
- **Polygon:** Two separate rectangles
- **Expected Configuration:** `left,blocked,open,blocked`
- **Expected Speed:** 80 → 60 km/h (25% reduction)
- **Logic:** Lane 1 merges left away from blocked Lane 2; Lane 3 is between blocked lanes

### **Test 10: Lanes 1, 2, 3 Blocked (75%)**
- **Polygon:** x: 100-1100, y: 300-600
- **Expected Configuration:** `blocked,blocked,blocked,right`
- **Expected Speed:** 80 → 50 km/h (37.5% reduction)
- **Logic:** 3 blocked / 4 total = 75% × 0.5 = 37.5%

### **Test 11: Lanes 2, 3, 4 Blocked (75%)**
- **Polygon:** x: 500-1500, y: 300-600
- **Expected Configuration:** `left,blocked,blocked,blocked`
- **Expected Speed:** 80 → 50 km/h (37.5% reduction)
- **Logic:** Only Lane 1 remains open

### **Test 12: All Lanes Blocked (100% - CRITICAL)**
- **Polygon:** x: 100-1500, y: 300-600 (full width)
- **Expected Configuration:** `blocked,blocked,blocked,blocked`
- **Expected Speed:** 80 → 40 km/h (50% reduction - hits MIN_SPEED_LIMIT)
- **Logic:** 4 blocked / 4 total = 100% × 0.5 = 50%, but minimum is 40 km/h
- **Recommended Action:** `emergency-stop`

### **Test 13: No Lanes Blocked (Edge Case)**
- **Polygon:** x: 50-70, y: 50-70 (outside lane area)
- **Expected Configuration:** `open,open,open,open`
- **Expected Speed:** 80 km/h (no reduction)
- **Logic:** No polygon intersection detected

## Expected Log Patterns

For each test, look for these log entries:

```
[DECISION] AI Severity: X/5
[DECISION] Node config: 4 default lanes, 4 configured, 4 polygons, 80 km/h
[DECISION] Blocked lanes: X
[DECISION] Lane configuration: <config_string>
[DECISION] Speed limit adjusted: 80 → X km/h
[DECISION] Recommended action: <action>
[DECISION AUDIT] { incidentId, analysis, decisions }
```

## Speed Reduction Formula

```
adjustedSpeed = originalSpeed × (1 - (blockedLanes / totalLanes) × 0.5)
minimum = 40 km/h
```

**Examples:**
- 1/4 blocked: 80 × (1 - 0.125) = 70 km/h
- 2/4 blocked: 80 × (1 - 0.25) = 60 km/h
- 3/4 blocked: 80 × (1 - 0.375) = 50 km/h
- 4/4 blocked: 80 × (1 - 0.5) = 40 km/h (minimum)

## Recommended Actions

Based on severity and blocked lane ratio:
- **reduce-speed:** Low-moderate severity, < 50% blocked
- **emergency-stop:** High severity OR ≥ 50% blocked

## Troubleshooting

### No lanes detected
- Check that lane polygons are defined in UI
- Verify `laneNumber` field is set correctly
- Ensure polygon coordinates overlap with accident polygon

### Wrong speed calculation
- Verify `defaultLaneCount` matches configured lanes
- Check that formula uses correct total lanes count
- Ensure minimum speed floor (40 km/h) is applied

### Configuration mismatch
- Verify polygon matching uses `laneNumber` field
- Check that adjacent lane logic sets `left` or `right` away from blocked lanes
- Ensure merge directives are not set when both adjacent lanes are blocked
