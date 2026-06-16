<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  type TooltipItem,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
} from 'chart.js'
import metrics from '../data/metrics.json'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
)

interface RegionalPerformance {
  North: number
  South: number
  East: number
  West: number
}

interface Metric {
  month: string
  label: string
  shipmentVolume: number
  onTimeDeliveryRate: number
  regionalPerformance: RegionalPerformance
  openExceptions: number
}

type RegionName = keyof RegionalPerformance

const data = metrics as Metric[]

const palette = {
  shipment: '#5AB8FF',
  onTime: '#7CE2B3',
  exceptions: '#F8B47A',
  north: '#5AB8FF',
  south: '#7CE2B3',
  east: '#B8A1FF',
  west: '#FF8F8F',
  muted: 'rgba(255, 255, 255, 0.08)',
  mutedStrong: 'rgba(255, 255, 255, 0.7)',
  grid: 'rgba(255, 255, 255, 0.08)',
}

const ALL = 'all'
const selectedMonth = ref<string>(ALL)

const monthOptions = computed(() => [
  { title: 'All months', value: ALL },
  ...data.map((m) => ({ title: `${m.label} 2025`, value: m.month })),
])

const isAll = computed(() => selectedMonth.value === ALL)

const selectedIndex = computed(() => {
  if (isAll.value) return -1
  return data.findIndex((m) => m.month === selectedMonth.value)
})

const filtered = computed(() =>
  isAll.value ? data : data.filter((m) => m.month === selectedMonth.value),
)

function pctChange(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

function topRegionFromRows(rows: Metric[]): { region: RegionName; count: number } {
  const totals: RegionalPerformance = { North: 0, South: 0, East: 0, West: 0 }

  for (const row of rows) {
    totals.North += row.regionalPerformance.North
    totals.South += row.regionalPerformance.South
    totals.East += row.regionalPerformance.East
    totals.West += row.regionalPerformance.West
  }

  const entries = Object.entries(totals) as [RegionName, number][]
  const [region, count] = entries.reduce((best, next) =>
    next[1] > best[1] ? next : best,
  )

  return { region, count }
}

const summaryStats = computed(() => {
  const rows = filtered.value
  const shipmentVolume = rows.reduce((sum, row) => sum + row.shipmentVolume, 0)
  const onTimeDeliveryRate = rows.length
    ? rows.reduce((sum, row) => sum + row.onTimeDeliveryRate, 0) / rows.length
    : 0
  const openExceptions = rows.reduce((sum, row) => sum + row.openExceptions, 0)
  const topRegion = topRegionFromRows(rows)

  return { shipmentVolume, onTimeDeliveryRate, openExceptions, topRegion }
})

const deltas = computed(() => {
  if (isAll.value || selectedIndex.value <= 0) {
    return {
      shipmentVolume: null,
      onTimeDeliveryRate: null,
      topRegionCount: null,
      openExceptions: null,
    }
  }

  const curr = data[selectedIndex.value]
  const prev = data[selectedIndex.value - 1]

  const currentTop = topRegionFromRows([curr])
  const previousTop = topRegionFromRows([prev])

  return {
    shipmentVolume: pctChange(curr.shipmentVolume, prev.shipmentVolume),
    onTimeDeliveryRate: pctChange(curr.onTimeDeliveryRate, prev.onTimeDeliveryRate),
    topRegionCount: pctChange(currentTop.count, previousTop.count),
    openExceptions: pctChange(curr.openExceptions, prev.openExceptions),
  }
})

const numberFmt = new Intl.NumberFormat('en-US')
const compactFmt = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const summaryCards = computed(() => {
  const stats = summaryStats.value
  const delta = deltas.value

  return [
    {
      key: 'shipmentVolume',
      title: isAll.value ? 'Shipment Volume (FY)' : 'Shipment Volume',
      value: compact(stats.shipmentVolume),
      fullValue: numberFmt.format(stats.shipmentVolume),
      helper: isAll.value ? '12-month total' : 'This month',
      icon: 'mdi-truck-fast-outline',
      color: 'primary',
      delta: delta.shipmentVolume,
    },
    {
      key: 'onTimeDeliveryRate',
      title: isAll.value ? 'On-Time Delivery (Avg)' : 'On-Time Delivery',
      value: `${stats.onTimeDeliveryRate.toFixed(1)}%`,
      fullValue: `${stats.onTimeDeliveryRate.toFixed(1)}%`,
      helper: isAll.value ? 'Yearly average' : 'This month',
      icon: 'mdi-timer-check-outline',
      color: 'success',
      delta: delta.onTimeDeliveryRate,
    },
    {
      key: 'topRegion',
      title: 'Top Region',
      value: `${stats.topRegion.region} (${compact(stats.topRegion.count)})`,
      fullValue: `${stats.topRegion.region} (${numberFmt.format(stats.topRegion.count)})`,
      helper: isAll.value ? 'Highest for full year' : 'Highest for selected month',
      icon: 'mdi-map-marker-radius-outline',
      color: 'info',
      delta: delta.topRegionCount,
    },
    {
      key: 'openExceptions',
      title: isAll.value ? 'Open Exceptions (FY)' : 'Open Exceptions',
      value: compact(stats.openExceptions),
      fullValue: numberFmt.format(stats.openExceptions),
      helper: isAll.value ? '12-month total' : 'Current open exceptions',
      icon: 'mdi-alert-circle-outline',
      color: 'warning',
      delta: delta.openExceptions,
    },
  ]
})

function deltaIcon(v: number | null): string {
  if (v === null) return 'mdi-minus'
  return v >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'
}

function deltaColor(v: number | null): string {
  if (v === null) return 'grey'
  return v >= 0 ? 'success' : 'error'
}

function compact(value: number): string {
  return compactFmt.format(value)
}

function monthSummaryLine(index: number): string {
  const row = filtered.value[index]
  if (!row) return ''

  const topRegion = topRegionFromRows([row])
  return `Month total ${compact(row.shipmentVolume)} | Top ${topRegion.region} ${compact(topRegion.count)} | Exceptions ${compact(row.openExceptions)}`
}

function tooltipChip(context: {
  dataIndex: number
  dataset: {
    backgroundColor?: unknown
    borderColor?: unknown
  }
}) {
  const background = context.dataset.backgroundColor
  const border = context.dataset.borderColor
  const arrayColor = Array.isArray(background)
    ? background[context.dataIndex]
    : background
  const color = String(arrayColor ?? border ?? '#9AA4B2')
  return {
    backgroundColor: color,
    borderColor: color,
  }
}

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0E1117',
      borderColor: palette.muted,
      borderWidth: 1,
      titleColor: '#fff',
      bodyColor: palette.mutedStrong,
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: palette.grid, drawBorder: false },
      ticks: { color: palette.mutedStrong },
    },
    y: {
      grid: { color: palette.grid, drawBorder: false },
      ticks: {
        color: palette.mutedStrong,
        callback: (v: number | string) => compact(Number(v)),
      },
    },
  },
}

const shipmentChart = computed(() => {
  const rows = filtered.value
  return {
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Shipment Volume',
          data: rows.map((row) => row.shipmentVolume),
          backgroundColor: palette.shipment,
          borderRadius: 6,
          maxBarThickness: 40,
        },
      ],
    },
    options: baseChartOptions,
  }
})

const shipmentChartOptions = computed(() => ({
  ...baseChartOptions,
  plugins: {
    ...baseChartOptions.plugins,
    tooltip: {
      ...baseChartOptions.plugins.tooltip,
      callbacks: {
        label: (context: TooltipItem<'bar'>) =>
          `Operational throughput: ${compact(Number(context.parsed.y))} shipments`,
        footer: (items: TooltipItem<'bar'>[]) => {
          if (!items.length) return ''
          return `Executive summary: ${monthSummaryLine(items[0].dataIndex)}`
        },
        labelColor: (context: TooltipItem<'bar'>) => tooltipChip(context),
      },
    },
  },
}))

const onTimeChart = computed(() => {
  const rows = filtered.value
  return {
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'On-Time Delivery Rate',
          data: rows.map((row) => row.onTimeDeliveryRate),
          borderColor: palette.onTime,
          backgroundColor: 'rgba(124, 226, 179, 0.18)',
          pointBackgroundColor: palette.onTime,
          pointRadius: rows.length === 1 ? 6 : 3,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: false,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        tooltip: {
          ...baseChartOptions.plugins.tooltip,
          callbacks: {
            label: (context: TooltipItem<'line'>) =>
              `Service reliability: ${Number(context.parsed.y).toFixed(1)}% on-time`,
            footer: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return ''
              return `Executive summary: ${monthSummaryLine(items[0].dataIndex)}`
            },
            labelColor: (context: TooltipItem<'line'>) => tooltipChip(context),
          },
        },
      },
      scales: {
        ...baseChartOptions.scales,
        y: {
          ...baseChartOptions.scales.y,
          suggestedMin: 85,
          suggestedMax: 100,
          ticks: {
            color: palette.mutedStrong,
            callback: (v: number | string) => `${Number(v).toFixed(0)}%`,
          },
        },
      },
    },
  }
})

const exceptionsChart = computed(() => {
  const rows = filtered.value
  return {
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'Open Exceptions',
          data: rows.map((row) => row.openExceptions),
          borderColor: palette.exceptions,
          backgroundColor: 'rgba(248, 180, 122, 0.2)',
          pointBackgroundColor: palette.exceptions,
          pointRadius: rows.length === 1 ? 6 : 3,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        tooltip: {
          ...baseChartOptions.plugins.tooltip,
          callbacks: {
            label: (context: TooltipItem<'line'>) =>
              `Active exceptions: ${compact(Number(context.parsed.y))} cases`,
            footer: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return ''
              return `Executive summary: ${monthSummaryLine(items[0].dataIndex)}`
            },
            labelColor: (context: TooltipItem<'line'>) => tooltipChip(context),
          },
        },
      },
    },
  }
})

const regionalChart = computed(() => {
  const rows = filtered.value
  return {
    data: {
      labels: rows.map((row) => row.label),
      datasets: [
        {
          label: 'North Ops',
          data: rows.map((row) => row.regionalPerformance.North),
          backgroundColor: palette.north,
          borderRadius: 5,
          maxBarThickness: 22,
        },
        {
          label: 'South Ops',
          data: rows.map((row) => row.regionalPerformance.South),
          backgroundColor: palette.south,
          borderRadius: 5,
          maxBarThickness: 22,
        },
        {
          label: 'East Ops',
          data: rows.map((row) => row.regionalPerformance.East),
          backgroundColor: palette.east,
          borderRadius: 5,
          maxBarThickness: 22,
        },
        {
          label: 'West Ops',
          data: rows.map((row) => row.regionalPerformance.West),
          backgroundColor: palette.west,
          borderRadius: 5,
          maxBarThickness: 22,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        tooltip: {
          ...baseChartOptions.plugins.tooltip,
          callbacks: {
            label: (context: TooltipItem<'bar'>) =>
              `${context.dataset.label}: ${compact(Number(context.parsed.y))} shipments routed`,
            footer: (items: TooltipItem<'bar'>[]) => {
              if (!items.length) return ''
              const index = items[0].dataIndex
              const monthTotal = items.reduce(
                (sum, item) => sum + Number(item.parsed.y),
                0,
              )
              return `Executive summary: ${monthSummaryLine(index)} | Regional total ${compact(monthTotal)}`
            },
            labelColor: (context: TooltipItem<'bar'>) => tooltipChip(context),
          },
        },
        legend: {
          display: true,
          labels: {
            color: palette.mutedStrong,
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 8,
            padding: 14,
          },
        },
      },
      scales: {
        ...baseChartOptions.scales,
        y: {
          ...baseChartOptions.scales.y,
          ticks: {
            color: palette.mutedStrong,
            callback: (v: number | string) => compact(Number(v)),
          },
        },
      },
    },
  }
})
</script>

<template>
  <v-app-bar color="surface" flat density="comfortable" border="b">
    <v-app-bar-title class="font-weight-bold">
      <v-icon icon="mdi-truck-delivery-outline" color="primary" class="mr-2" />
      VetBeds
    </v-app-bar-title>
    <template #append>
      <v-select
        v-model="selectedMonth"
        :items="monthOptions"
        item-title="title"
        item-value="value"
        density="compact"
        variant="outlined"
        hide-details
        prepend-inner-icon="mdi-calendar-month"
        style="max-width: 220px"
      />
    </template>
  </v-app-bar>

  <v-main>
    <v-container fluid class="pa-6 pa-sm-8">
      <v-row dense>
        <v-col
          v-for="card in summaryCards"
          :key="card.key"
          cols="12"
          sm="6"
          md="3"
        >
          <v-card class="pa-4" rounded="lg" elevation="0" border>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-caption text-medium-emphasis text-uppercase">
                {{ card.title }}
              </span>
              <v-icon :icon="card.icon" :color="card.color" />
            </div>
            <div class="text-h5 font-weight-bold" :title="card.fullValue">
              {{ card.value }}
            </div>
            <div class="d-flex align-center mt-2" style="min-height: 22px">
              <template v-if="card.delta !== null">
                <v-icon
                  :icon="deltaIcon(card.delta)"
                  :color="deltaColor(card.delta)"
                  size="18"
                  class="mr-1"
                />
                <span
                  class="text-caption font-weight-medium"
                  :class="`text-${deltaColor(card.delta)}`"
                >
                  {{ Math.abs(card.delta).toFixed(1) }}%
                </span>
                <span class="text-caption text-medium-emphasis ml-1">
                  vs prev month
                </span>
              </template>
              <span v-else class="text-caption text-medium-emphasis">
                {{ card.helper }}
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                Monthly Shipment Volume
              </span>
              <v-icon icon="mdi-chart-bar" color="primary" />
            </div>
            <div style="height: 280px">
              <Bar :data="shipmentChart.data" :options="shipmentChartOptions" />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                On-Time Delivery Rate
              </span>
              <v-icon icon="mdi-chart-line" color="success" />
            </div>
            <div style="height: 280px">
              <Line :data="onTimeChart.data" :options="onTimeChart.options" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                Open Exceptions Trend
              </span>
              <v-icon icon="mdi-chart-areaspline" color="warning" />
            </div>
            <div style="height: 260px">
              <Line :data="exceptionsChart.data" :options="exceptionsChart.options" />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                Regional Performance by Month
              </span>
              <v-icon icon="mdi-map-marker-multiple-outline" color="info" />
            </div>
            <div style="height: 300px">
              <Bar :data="regionalChart.data" :options="regionalChart.options" />
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
