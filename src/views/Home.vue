<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
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

interface Metric {
  month: string
  label: string
  revenue: number
  visitors: number
  conversions: number
  orders: number
}

const data = metrics as Metric[]

const palette = {
  primary: '#4FD1C5',
  primarySoft: 'rgba(79, 209, 197, 0.18)',
  accent: '#7C9EF7',
  accentSoft: 'rgba(124, 158, 247, 0.22)',
  muted: 'rgba(255, 255, 255, 0.08)',
  mutedStrong: 'rgba(255, 255, 255, 0.55)',
  grid: 'rgba(255, 255, 255, 0.06)',
}

const ALL = 'all'
const selected = ref<string>(ALL)

const monthOptions = computed(() => [
  { title: 'All months', value: ALL },
  ...data.map((m) => ({ title: m.label + ' 2025', value: m.month })),
])

const isAll = computed(() => selected.value === ALL)

const selectedIndex = computed(() =>
  isAll.value ? -1 : data.findIndex((m) => m.month === selected.value),
)

const filtered = computed(() =>
  isAll.value ? data : data.filter((m) => m.month === selected.value),
)

const totals = computed(() => {
  const rows = filtered.value
  const revenue = rows.reduce((s, r) => s + r.revenue, 0)
  const visitors = rows.reduce((s, r) => s + r.visitors, 0)
  const orders = rows.reduce((s, r) => s + r.orders, 0)
  const conversions = rows.length
    ? rows.reduce((s, r) => s + r.conversions, 0) / rows.length
    : 0
  return { revenue, visitors, orders, conversions }
})

function pctChange(curr: number, prev: number): number | null {
  if (!prev) return null
  return ((curr - prev) / prev) * 100
}

const deltas = computed(() => {
  if (isAll.value || selectedIndex.value <= 0) {
    return { revenue: null, visitors: null, conversions: null, orders: null }
  }
  const curr = data[selectedIndex.value]
  const prev = data[selectedIndex.value - 1]
  return {
    revenue: pctChange(curr.revenue, prev.revenue),
    visitors: pctChange(curr.visitors, prev.visitors),
    conversions: pctChange(curr.conversions, prev.conversions),
    orders: pctChange(curr.orders, prev.orders),
  }
})

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const numberFmt = new Intl.NumberFormat('en-US')

const summaryCards = computed(() => {
  const t = totals.value
  const d = deltas.value
  const suffix = isAll.value ? ' (FY)' : ''
  return [
    {
      key: 'revenue',
      title: 'Revenue' + suffix,
      value: currencyFmt.format(t.revenue),
      icon: 'mdi-currency-usd',
      color: 'primary',
      delta: d.revenue,
    },
    {
      key: 'visitors',
      title: 'Visitors' + suffix,
      value: numberFmt.format(t.visitors),
      icon: 'mdi-account-group',
      color: 'secondary',
      delta: d.visitors,
    },
    {
      key: 'conversions',
      title: isAll.value ? 'Avg Conversion' : 'Conversion',
      value: t.conversions.toFixed(2) + '%',
      icon: 'mdi-target',
      color: 'info',
      delta: d.conversions,
    },
    {
      key: 'orders',
      title: 'Orders' + suffix,
      value: numberFmt.format(t.orders),
      icon: 'mdi-cart-outline',
      color: 'success',
      delta: d.orders,
    },
  ]
})

function deltaIcon(v: number | null) {
  if (v === null) return 'mdi-minus'
  return v >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'
}
function deltaColor(v: number | null) {
  if (v === null) return 'grey'
  return v >= 0 ? 'success' : 'error'
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
      ticks: { color: palette.mutedStrong },
    },
  },
}

const revenueChart = computed(() => {
  const rows = filtered.value
  const idx = selectedIndex.value
  return {
    data: {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Revenue',
          data: rows.map((r) => r.revenue),
          backgroundColor: isAll.value
            ? data.map((_, i) =>
                idx >= 0 && i !== idx ? palette.muted : palette.primary,
              )
            : palette.primary,
          borderRadius: 6,
          maxBarThickness: 38,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      scales: {
        ...baseChartOptions.scales,
        y: {
          ...baseChartOptions.scales.y,
          ticks: {
            color: palette.mutedStrong,
            callback: (v: number | string) =>
              '$' + (Number(v) / 1000).toFixed(0) + 'k',
          },
        },
      },
    },
  }
})

const visitorsChart = computed(() => {
  const rows = filtered.value
  return {
    data: {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Visitors',
          data: rows.map((r) => r.visitors),
          borderColor: palette.accent,
          backgroundColor: palette.accentSoft,
          pointBackgroundColor: palette.accent,
          pointRadius: rows.length === 1 ? 6 : 3,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: false,
          borderWidth: 2,
        },
      ],
    },
    options: baseChartOptions,
  }
})

const conversionsChart = computed(() => {
  const rows = filtered.value
  return {
    data: {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: 'Conversion %',
          data: rows.map((r) => r.conversions),
          borderColor: palette.primary,
          backgroundColor: palette.primarySoft,
          pointBackgroundColor: palette.primary,
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
      scales: {
        ...baseChartOptions.scales,
        y: {
          ...baseChartOptions.scales.y,
          ticks: {
            color: palette.mutedStrong,
            callback: (v: number | string) => Number(v).toFixed(1) + '%',
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
      <v-icon icon="mdi-chart-box-outline" color="primary" class="mr-2" />
      Protogen Dashboard
    </v-app-bar-title>
    <template #append>
      <v-select
        v-model="selected"
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
    <v-container fluid class="pa-6">
      <!-- Summary cards -->
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
            <div class="text-h5 font-weight-bold">{{ card.value }}</div>
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
                {{ isAll ? '12-month total' : '—' }}
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Revenue + Visitors charts -->
      <v-row class="mt-2">
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                Monthly Revenue
              </span>
              <v-icon icon="mdi-chart-bar" color="primary" />
            </div>
            <div style="height: 280px">
              <Bar :data="revenueChart.data" :options="revenueChart.options" />
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                Visitors Over Time
              </span>
              <v-icon icon="mdi-chart-line" color="secondary" />
            </div>
            <div style="height: 280px">
              <Line
                :data="visitorsChart.data"
                :options="visitorsChart.options"
              />
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Conversions area chart -->
      <v-row>
        <v-col cols="12">
          <v-card rounded="lg" elevation="0" border class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-subtitle-1 font-weight-medium">
                Conversion Trend
              </span>
              <v-icon icon="mdi-chart-areaspline" color="primary" />
            </div>
            <div style="height: 260px">
              <Line
                :data="conversionsChart.data"
                :options="conversionsChart.options"
              />
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
