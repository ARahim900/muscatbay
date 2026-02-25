# Homepage (Dashboard) Documentation

## Overview

The homepage is the main dashboard of the Muscat Bay Management System - a utility and facility management application. It provides a comprehensive overview of all operations and key metrics for water, electricity, sewage treatment (STP), contractors, and assets management.

**Route:** `/` (root path)
**Component:** `app/app/page.tsx`

---

## Page Structure

### 1. Page Header Section

**Location:** Top of the page

**Elements:**
- **Title:** "Dashboard"
- **Description:** "Overview of all operations and key metrics"
- **Data Status Badge:** Displays either:
  - "Live Data" (green badge with WiFi icon) - when connected to Supabase
  - "Demo Mode" (gray badge with WiFi-off icon) - when using mock data

---

### 2. Stats Grid Section

**Location:** Below header

**Description:** A responsive grid displaying 7 KPI (Key Performance Indicator) cards

| Stat Card | Icon | Data Source | Description |
|-----------|------|-------------|-------------|
| WATER PRODUCTION | Droplets | Water system data | Monthly water production in thousand m³ |
| ELECTRICITY USAGE | Zap | Electricity meters | Monthly electricity consumption in MWh |
| STP INLET FLOW | Activity | STP operations | Total sewage processed in thousand m³ |
| TSE OUTPUT | Recycle | STP operations | Recycled water output in thousand m³ |
| STP ECONOMIC IMPACT | TrendingUp | Calculated | Income + savings in OMR currency |
| ACTIVE CONTRACTORS | Users | Contractors data | Count of active service providers |
| TOTAL ASSETS | Boxes | Assets data | Total registered assets count |

**Features:**
- Each card shows a trend indicator (up/down/neutral) comparing to the previous month
- Trend percentage is displayed below the value
- Hover effect on cards for interactivity

---

### 3. Charts Section

**Location:** Below Stats Grid

**Layout:** Two-column grid (4:3 ratio on large screens)

#### 3.1 Water Production Trend Chart (Left - Larger)

- **Type:** Area Chart
- **Data:** Last 8 months of water production
- **X-Axis:** Month names
- **Y-Axis:** Water volume in thousand m³
- **Color:** Teal gradient (#81D8D0)
- **Features:**
  - Gradient fill under the line
  - Interactive tooltip showing exact values
  - Legend at bottom

#### 3.2 STP Treatment Overview Chart (Right - Smaller)

- **Type:** Bar Chart
- **Data:** Last 8 months of STP operations
- **Metrics:**
  - Inlet (dark purple/gray - #4E4456)
  - TSE Output (teal - #81D8D0)
- **X-Axis:** Month names
- **Y-Axis:** Volume in thousand m³
- **Features:**
  - Grouped bars comparing inlet vs TSE
  - Interactive tooltip
  - Legend at bottom

---

### 4. Recent Activity Section

**Location:** Bottom of the page

**Description:** A filterable feed of operational alerts and logs

#### Filter Buttons
- **All** (default - purple/primary color)
- **Critical** (red)
- **Warning** (yellow/amber)
- **Info** (blue/teal)

#### Activity Items (Static Demo Data)

| Title | Time | Type |
|-------|------|------|
| High Water Loss Detected | 2 hours ago | critical |
| STP Pump Station Maintenance | 5 hours ago | warning |
| New Contractor Onboarded | 1 day ago | info |
| Monthly Reports Generated | 2 days ago | info |

**Item Display:**
- Icon based on type (AlertTriangle for critical, ArrowUpRight for others)
- Color-coded background based on type
- Title and timestamp

---

## User Interactions

### Expected Behaviors

1. **Page Load:**
   - Shows loading spinner while data fetches
   - Displays error message with "Retry" button if data fetch fails
   - Shows data status badge (Live/Demo mode)

2. **Activity Filter:**
   - Clicking a filter button filters the activity items
   - Active filter button is highlighted with corresponding color
   - "All" shows all activity items

3. **Chart Interactions:**
   - Hovering over chart data points shows tooltip with exact values
   - Charts are responsive and resize based on viewport

4. **Stat Cards:**
   - Hover effect changes background color slightly
   - Displays trend arrows and percentages

5. **Error State:**
   - Displays centered error message in red
   - Shows "Retry" button that reloads the page

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    useDashboardData Hook                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Check if Supabase is configured                             │
│  2. Try to fetch live data from Supabase:                       │
│     - STP Operations                                            │
│     - Electricity Meters                                        │
│     - Contractors                                               │
│     - Assets                                                    │
│  3. Fallback to mock data if Supabase fails                     │
│  4. Calculate statistics, trends, and chart data                │
│  5. Return: stats, chartData, stpChartData, loading, isLiveData │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsive Design

| Breakpoint | Stats Grid | Charts Grid |
|------------|------------|-------------|
| Mobile (< 640px) | 1 column | 1 column |
| Tablet (640px - 1024px) | 2 columns | 1 column |
| Desktop (1024px - 1280px) | 3 columns | 2 columns (4:3) |
| Large Desktop (> 1280px) | 4 columns | 2 columns (4:3) |

---

## Test Scenarios

### Functional Tests

1. **Dashboard Loading**
   - Verify loading spinner appears during data fetch
   - Verify data loads successfully and displays correctly

2. **Stats Grid Display**
   - Verify all 7 stat cards are displayed
   - Verify correct icons appear for each stat
   - Verify values are formatted correctly (k m³, MWh, OMR)
   - Verify trend indicators show correct direction

3. **Charts Rendering**
   - Verify Water Production chart renders with data
   - Verify STP Treatment chart renders with data
   - Verify tooltips appear on hover
   - Verify legends are visible

4. **Activity Filter**
   - Click "All" filter - verify all items shown
   - Click "Critical" filter - verify only critical items shown
   - Click "Warning" filter - verify only warning items shown
   - Click "Info" filter - verify only info items shown

5. **Data Status Badge**
   - Verify badge shows "Live Data" when connected to Supabase
   - Verify badge shows "Demo Mode" when using mock data

6. **Error Handling**
   - Verify error message displays when data fetch fails
   - Verify "Retry" button works and reloads the page

### Visual/UI Tests

1. **Responsive Layout**
   - Test at mobile viewport (375px)
   - Test at tablet viewport (768px)
   - Test at desktop viewport (1280px)

2. **Dark Mode**
   - Verify all elements render correctly in dark mode
   - Verify contrast ratios are accessible

3. **Hover States**
   - Verify stat cards have hover effect
   - Verify filter buttons have hover effect
   - Verify activity items have hover effect

---

## Dependencies

- `@/hooks/useDashboardData` - Data fetching hook
- `@/components/shared/stats-grid` - Stats card grid component
- `@/components/shared/loading-spinner` - Loading state component
- `@/components/shared/page-header` - Page header component
- `@/components/ui/card` - Card UI components
- `@/components/ui/badge` - Badge UI component
- `@/components/charts/*` - Chart components
- `recharts` - Charting library
- `lucide-react` - Icons library
