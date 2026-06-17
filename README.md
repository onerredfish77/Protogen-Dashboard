# VetBeds Logistics Performance Dashboard

VetBeds is a single-page analytics dashboard that turns monthly fulfillment data into a fast executive view of operational health.

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

## Projection Behavior

When All months is selected:

- Projection segments extend to the right side of key charts.
- Actual history and projected future are clearly separated.
- Future values use a consistent purple style for easy distinction.

When a single month is selected:

- Charts focus only on that month (no projection extension).

## Tech Stack

- Vue 3 + TypeScript
- Vuetify 3 (dark theme)
- Chart.js + vue-chartjs
- Local JSON dataset in [src/data/metrics.json](src/data/metrics.json)

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
