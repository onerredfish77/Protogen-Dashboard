# FastForward Logistics Performance Dashboard

FastForward Logistics is a single-page analytics dashboard that turns monthly fulfillment data into a fast executive view of operational health.

The experience is designed so visitors can quickly answer three questions:

1. Are we shipping more over time?
2. Are we maintaining reliable on-time delivery?
3. Are open exceptions trending in a healthy direction?

## What This Project Does

This dashboard visualizes 12 months of logistics metrics (Jan-Dec 2025), including:

- Shipment volume
- On-time delivery rate
- Regional shipment performance
- Open exceptions

It also includes short-term projections (shown in purple) for key trend charts so leaders can compare actual performance against where current momentum is likely to lead.

## Why It Matters

Operational data is often spread across tools and teams. This project consolidates the most decision-relevant signals into one view, reducing the time it takes to:

- Detect risk (rising exceptions)
- Confirm reliability (on-time delivery stability)
- Spot growth patterns (shipment and regional trends)
- Communicate a clear story in leadership reviews

Instead of digging through raw data first, stakeholders can understand the narrative in under a minute.

## What Visitors Can Do

1. Scan the top summary cards for current totals, averages, and month-over-month movement.
2. Use the month picker in the top bar to switch between:
	- All months (full-year view)
	- A specific month (focused snapshot)
3. Review chart sections:
	- Monthly Shipment Volume (bar)
	- On-Time Delivery Rate (line)
	- Open Exceptions Trend (area)
	- Regional Performance by Month (grouped bar)
4. Hover any chart point/bar for richer executive tooltips and context.
5. **Click any shipment bar or on-time delivery point** to highlight it (magenta) and see the corresponding state distribution on the interactive US map below.
6. **Click the same chart element again** to clear the highlight and reset to default view.
7. Interact with the **US State Map**:
	- View per-state shipment distribution with color intensity (darker = fewer shipments, brighter = more shipments).
	- Hover any state to see the state name and shipment count in a tooltip.
	- The map subtitle color changes when a chart element is selected, providing visual feedback of the active selection.

## Projection Behavior

When All months is selected:

- Projection segments extend to the right side of key charts.
- Actual history and projected future are clearly separated.
- Future values use a consistent purple style for easy distinction.

When a single month is selected:

- Charts focus only on that month (no projection extension).

## Interactive Features

### Chart Selection & Highlighting

- **Click to select**: Click any bar in the Shipment Volume chart or any point in the On-Time Delivery Rate chart to highlight it with a magenta color.
- **Toggle to clear**: Click the same chart element again to deselect it and return to the default view.
- **Selection feedback**: The map subtitle color changes to magenta when a chart element is selected, providing visual confirmation.

### US State Map

- **Geographic view**: See shipment distribution across all 50 states with color-coded intensity (blue gradient).
- **State tooltips**: Hover over any state to see its name and the exact shipment count for the selected month.
- **Chart-to-map sync**: When you click a chart element, the map displays that month's per-state data with the selection state highlighted.
- **Interactive updates**: Selecting different months or chart elements instantly updates the map visualization.

## Tech Stack

- Vue 3 + TypeScript
- Vuetify 3 (dark theme)
- Chart.js + vue-chartjs
- d3-geo + topojson-client (geographic data handling)
- us-atlas (US state boundary data)
- Local JSON datasets:
  - [src/data/metrics.json](src/data/metrics.json) — monthly operational metrics
  - [src/data/stateShipments.json](src/data/stateShipments.json) — per-state shipment distribution

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open the local URL shown in your terminal (typically http://localhost:5173).

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Goal

Provide a polished, stakeholder-ready operational dashboard that explains performance and trajectory before anyone needs to inspect source code or raw data.
