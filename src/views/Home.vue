<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
import stateShipmentsRaw from '../data/stateShipments.json'
import UsStateMap from '../components/UsStateMap.vue'

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

interface StateShipmentMonth {
  key: string
  label: string
  shipmentVolume: number
  isProjection: boolean
  states: Record<string, number>
}

type RegionName = keyof RegionalPerformance

const data = metrics as Metric[]
const stateShipmentData = stateShipmentsRaw as StateShipmentMonth[]

const projectedMonths = [
  { label: "Jan '26", shipmentVolume: 1895, onTimeDeliveryRate: 96.1, openExceptions: 98 },
  { label: "Feb '26", shipmentVolume: 1960, onTimeDeliveryRate: 96.5, openExceptions: 93 },
  { label: "Mar '26", shipmentVolume: 2025, onTimeDeliveryRate: 96.8, openExceptions: 88 },
] as const

const palette = {
  shipment: '#5AB8FF',
  onTime: '#7CE2B3',
  exceptions: '#F8B47A',
  projection: '#B47FFF',
  projectionSoft: 'rgba(180, 127, 255, 0.15)',
  selected: '#F962C6',
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
const mapFocusLabel = ref<string | null>(null)
const selectedChartPart = ref<{ chart: 'shipment' | 'onTime'; label: string } | null>(null)

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

watch(selectedMonth, () => {
  mapFocusLabel.value = null
  selectedChartPart.value = null
})

watch(selectedChartPart, (newVal) => {
  if (!newVal) {
    mapFocusLabel.value = null
  }
})

const stateFipsCodes = stateShipmentData.length
  ? Object.keys(stateShipmentData[0].states)
  : []

const stateByMonthKey = stateShipmentData.reduce<Record<string, StateShipmentMonth>>(
  (acc, row) => {
    acc[row.key] = row
    return acc
  },
  {},
)

const stateByLabel = stateShipmentData.reduce<Record<string, StateShipmentMonth>>(
  (acc, row) => {
    acc[row.label] = row
    return acc
  },
  {},
)

function emptyStateValues(): Record<string, number> {
  return stateFipsCodes.reduce<Record<string, number>>((acc, code) => {
    acc[code] = 0
    return acc
  }, {})
}

function aggregateStateValues(months: StateShipmentMonth[]): Record<string, number> {
  const totals = emptyStateValues()
  for (const month of months) {
    for (const code of stateFipsCodes) {
      totals[code] += month.states[code] ?? 0
    }
  }
  return totals
}

const mapContext = computed(() => {
  const focusedLabel = mapFocusLabel.value
  if (focusedLabel && stateByLabel[focusedLabel]) {
    const month = stateByLabel[focusedLabel]
    return {
      values: month.states,
      subtitle: month.isProjection
        ? `${month.label} projection from chart selection`
        : `${month.label} 2025 from chart selection`,
    }
  }

  if (isAll.value) {
    const selectedMonths = data
      .map((row) => stateByMonthKey[row.month])
      .filter((row): row is StateShipmentMonth => Boolean(row))

    return {
      values: aggregateStateValues(selectedMonths),
      subtitle: 'All months total (Jan-Dec 2025)',
    }
  }

  const selected = stateByMonthKey[selectedMonth.value]
  if (selected) {
    return {
      values: selected.states,
      subtitle: `${selected.label} 2025 total`,
    }
  }

  return {
    values: emptyStateValues(),
    subtitle: 'No state shipment data',
  }
})

const stateMapValues = computed(() => mapContext.value.values)
const mapSubtitleColor = computed(() =>
  mapFocusLabel.value ? palette.selected : undefined,
)

function handleInteractiveChartClick(
  chartType: 'shipment' | 'onTime',
  _event: unknown,
  elements: Array<{ index: number }>,
  chartInstance: { data: { labels?: unknown[] } },
) {
  if (!elements.length) return

  const index = elements[0]?.index ?? -1
  const labels = chartInstance.data.labels ?? []
  const value = labels[index]
  if (typeof value === 'string') {
    const isAlreadySelected =
      selectedChartPart.value?.chart === chartType &&
      selectedChartPart.value?.label === value

    if (isAlreadySelected) {
      mapFocusLabel.value = null
      selectedChartPart.value = null
    } else {
      mapFocusLabel.value = value
      selectedChartPart.value = { chart: chartType, label: value }
    }
  }
}

function handleShipmentChartClick(
  event: unknown,
  elements: Array<{ index: number }>,
  chartInstance: { data: { labels?: unknown[] } },
) {
  handleInteractiveChartClick('shipment', event, elements, chartInstance)
}

function handleOnTimeChartClick(
  event: unknown,
  elements: Array<{ index: number }>,
  chartInstance: { data: { labels?: unknown[] } },
) {
  handleInteractiveChartClick('onTime', event, elements, chartInstance)
}

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
  const selectedLabel =
    selectedChartPart.value?.chart === 'shipment' ? selectedChartPart.value.label : null

  if (!isAll.value) {
    const labels = rows.map((r) => r.label)
    return {
      data: {
        labels,
        datasets: [
          {
            label: 'Shipment Volume',
            data: rows.map((r) => r.shipmentVolume),
            backgroundColor: labels.map((label) =>
              selectedLabel === label ? palette.selected : palette.shipment,
            ),
            borderRadius: 6,
            maxBarThickness: 40,
          },
        ],
      },
    }
  }
  const labels = [...rows.map((r) => r.label), ...projectedMonths.map((p) => p.label)]
  const values = [
    ...rows.map((r) => r.shipmentVolume),
    ...projectedMonths.map((p) => p.shipmentVolume),
  ]
  const colors: string[] = [
    ...rows.map((row) =>
      selectedLabel === row.label ? palette.selected : palette.shipment,
    ),
    ...projectedMonths.map((projection) =>
      selectedLabel === projection.label ? palette.selected : palette.projection,
    ),
  ]
  return {
    data: {
      labels,
      datasets: [
        {
          label: 'Shipment Volume',
          data: values,
          backgroundColor: colors,
          borderRadius: 6,
          maxBarThickness: 40,
        },
      ],
    },
  }
})

const shipmentChartOptions = computed(() => ({
  ...baseChartOptions,
  onClick: handleShipmentChartClick,
  plugins: {
    ...baseChartOptions.plugins,
    legend: isAll.value
      ? {
          display: true,
          labels: {
            color: palette.mutedStrong,
            usePointStyle: true,
            pointStyle: 'rectRounded' as const,
            boxWidth: 12,
            boxHeight: 10,
            padding: 14,
            generateLabels: () => [
              { text: 'Actual', fillStyle: palette.shipment, strokeStyle: palette.shipment, fontColor: palette.mutedStrong, lineWidth: 0, hidden: false, datasetIndex: 0 },
              { text: 'Projected', fillStyle: palette.projection, strokeStyle: palette.projection, fontColor: palette.mutedStrong, lineWidth: 0, hidden: false, datasetIndex: 0 },
            ],
          },
        }
      : { display: false },
    tooltip: {
      ...baseChartOptions.plugins.tooltip,
      callbacks: {
        label: (context: TooltipItem<'bar'>) => {
          const isProjected = isAll.value && context.dataIndex >= data.length
          return isProjected
            ? `Projected: ${compact(Number(context.parsed.y))} shipments`
            : `Operational throughput: ${compact(Number(context.parsed.y))} shipments`
        },
        footer: (items: TooltipItem<'bar'>[]) => {
          if (!items.length) return ''
          const isProjected = isAll.value && items[0].dataIndex >= data.length
          if (isProjected) return 'Projection · estimated trend'
          return `Executive summary: ${monthSummaryLine(items[0].dataIndex)}`
        },
        labelColor: (context: TooltipItem<'bar'>) => tooltipChip(context),
      },
    },
  },
}))

const onTimeChart = computed(() => {
  const rows = filtered.value
  const withProjections = isAll.value
  const lastRow = data[data.length - 1]
  const selectedLabel =
    selectedChartPart.value?.chart === 'onTime' ? selectedChartPart.value.label : null

  const labels = withProjections
    ? [...rows.map((r) => r.label), ...projectedMonths.map((p) => p.label)]
    : rows.map((r) => r.label)

  const actualData: (number | null)[] = withProjections
    ? [...rows.map((r) => r.onTimeDeliveryRate), ...projectedMonths.map(() => null)]
    : rows.map((r) => r.onTimeDeliveryRate)

  const projectedData: (number | null)[] = [
    ...(Array(data.length - 1).fill(null) as null[]),
    lastRow.onTimeDeliveryRate,
    ...projectedMonths.map((p) => p.onTimeDeliveryRate),
  ]

  return {
    data: {
      labels,
      datasets: [
        {
          label: 'Actual',
          data: actualData,
          borderColor: palette.onTime,
          backgroundColor: 'rgba(124, 226, 179, 0.18)',
          pointBackgroundColor: labels.map((label, index) =>
            selectedLabel === label && actualData[index] !== null
              ? palette.selected
              : palette.onTime,
          ),
          pointRadius: labels.map((label, index) => {
            const base = rows.length === 1 ? 6 : 3
            return selectedLabel === label && actualData[index] !== null ? 7 : base
          }),
          pointHoverRadius: 6,
          tension: 0.35,
          fill: false,
          borderWidth: 2,
          spanGaps: false,
        },
        ...(withProjections
          ? [
              {
                label: 'Projected',
                data: projectedData,
                borderColor: palette.projection,
                backgroundColor: palette.projectionSoft,
                pointBackgroundColor: labels.map((label, index) =>
                  selectedLabel === label && projectedData[index] !== null
                    ? palette.selected
                    : palette.projection,
                ),
                pointRadius: labels.map((label, index) =>
                  selectedLabel === label && projectedData[index] !== null ? 7 : 3,
                ),
                pointHoverRadius: 6,
                tension: 0.35,
                fill: false,
                borderWidth: 2,
                borderDash: [6, 4],
                spanGaps: false,
              },
            ]
          : []),
      ],
    },
    options: {
      ...baseChartOptions,
      onClick: handleOnTimeChartClick,
      plugins: {
        ...baseChartOptions.plugins,
        legend: withProjections
          ? {
              display: true,
              labels: {
                color: palette.mutedStrong,
                usePointStyle: true,
                pointStyle: 'line' as const,
                boxWidth: 24,
                padding: 14,
              },
            }
          : { display: false },
        tooltip: {
          ...baseChartOptions.plugins.tooltip,
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const isProjected = context.datasetIndex === 1
              return isProjected
                ? `Projected: ${Number(context.parsed.y).toFixed(1)}% on-time`
                : `Service reliability: ${Number(context.parsed.y).toFixed(1)}% on-time`
            },
            footer: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return ''
              if (items[0].datasetIndex === 1) return 'Projection · estimated trend'
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
  const withProjections = isAll.value
  const lastRow = data[data.length - 1]

  const labels = withProjections
    ? [...rows.map((r) => r.label), ...projectedMonths.map((p) => p.label)]
    : rows.map((r) => r.label)

  const actualData: (number | null)[] = withProjections
    ? [...rows.map((r) => r.openExceptions), ...projectedMonths.map(() => null)]
    : rows.map((r) => r.openExceptions)

  const projectedData: (number | null)[] = [
    ...(Array(data.length - 1).fill(null) as null[]),
    lastRow.openExceptions,
    ...projectedMonths.map((p) => p.openExceptions),
  ]

  return {
    data: {
      labels,
      datasets: [
        {
          label: 'Actual',
          data: actualData,
          borderColor: palette.exceptions,
          backgroundColor: 'rgba(248, 180, 122, 0.2)',
          pointBackgroundColor: palette.exceptions,
          pointRadius: rows.length === 1 ? 6 : 3,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
          borderWidth: 2,
          spanGaps: false,
        },
        ...(withProjections
          ? [
              {
                label: 'Projected',
                data: projectedData,
                borderColor: palette.projection,
                backgroundColor: palette.projectionSoft,
                pointBackgroundColor: palette.projection,
                pointRadius: 3,
                pointHoverRadius: 6,
                tension: 0.35,
                fill: false,
                borderWidth: 2,
                borderDash: [6, 4],
                spanGaps: false,
              },
            ]
          : []),
      ],
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        legend: withProjections
          ? {
              display: true,
              labels: {
                color: palette.mutedStrong,
                usePointStyle: true,
                pointStyle: 'line' as const,
                boxWidth: 24,
                padding: 14,
              },
            }
          : { display: false },
        tooltip: {
          ...baseChartOptions.plugins.tooltip,
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const isProjected = context.datasetIndex === 1
              return isProjected
                ? `Projected: ${compact(Number(context.parsed.y))} cases`
                : `Active exceptions: ${compact(Number(context.parsed.y))} cases`
            },
            footer: (items: TooltipItem<'line'>[]) => {
              if (!items.length) return ''
              if (items[0].datasetIndex === 1) return 'Projection · estimated trend'
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
      FastForward Logistics
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
            <UsStateMap
              :values-by-fips="stateMapValues"
              :subtitle="mapContext.subtitle"
              :subtitle-color="mapSubtitleColor"
            />
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
