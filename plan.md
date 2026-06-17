# Product Brief

## What is this?
A single-page analytics dashboard showing monthly business metrics for **VetBeds** — a logistics/fulfillment tracking view displaying shipment performance, delivery reliability, regional activity, and exception management.

## Data
Generate a fake dataset as a JSON file (src/data/metrics.json).
12 months of data (Jan-Dec 2025), each month containing:
- shipmentVolume (number, trending upward with some variation)
- onTimeDeliveryRate (percentage, fluctuates between 85-99%)
- regionalPerformance (object with regions e.g. North, South, East, West — each with a shipment count)
- openExceptions (number, inversely correlates loosely with onTimeDeliveryRate)

## Layout (Vuetify)
- v-app-bar at the top with **"VetBeds"** as the dashboard title and a month picker
- The month picker should default to showing ALL months
- When a specific month is selected, all cards and charts filter to that month. When "All" is selected, show the full year.
- Below the app bar: a row of 4 summary cards (v-card) showing the key metrics - shipment volume, on-time delivery rate, regional performance (top region), open exceptions
- Below the cards: a row of 2 charts
  - Left: Bar chart showing monthly shipment volume
  - Right: Line chart showing on-time delivery rate over time
- Below that: one full-width area chart showing open exceptions trend
- Below that: one full-width bar or grouped bar chart showing regional performance by month
- Use v-container, v-row, v-col for responsive grid layout

## Interactions
- Month picker in the app bar filters EVERYTHING - summary cards show that month's numbers, charts highlight or filter to that month
- When "All" is selected, summary cards show yearly totals/averages and charts show all 12 months
- Cards should show a small up/down arrow or color indicating change from previous month

## Style
- Dark theme by default (Vuetify dark theme)
- Clean, minimal, lots of whitespace
- Charts should use a cohesive color palette - not rainbow
- Mobile responsive - cards stack on small screens

## Tech
- Vue 3 + Typescript + Vuetify 3
- Chart.js via vue-chartjs for all charts
- Fake data from a local JSON file (no API calls)
- Single page - no routing needed for this app
