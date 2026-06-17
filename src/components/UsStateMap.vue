<script setup lang="ts">
import { computed, ref } from 'vue'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import us from 'us-atlas/states-10m.json'

interface MapProps {
  valuesByFips: Record<string, number>
  subtitle: string
  subtitleColor?: string
}

const props = defineProps<MapProps>()
const hoveredState = ref<{ id: string; name: string; value: number } | null>(null)
const hoverPosition = ref({ x: 0, y: 0 })

const stateNamesByFips: Record<string, string> = {
  '01': 'Alabama',
  '02': 'Alaska',
  '04': 'Arizona',
  '05': 'Arkansas',
  '06': 'California',
  '08': 'Colorado',
  '09': 'Connecticut',
  '10': 'Delaware',
  '11': 'District of Columbia',
  '12': 'Florida',
  '13': 'Georgia',
  '15': 'Hawaii',
  '16': 'Idaho',
  '17': 'Illinois',
  '18': 'Indiana',
  '19': 'Iowa',
  '20': 'Kansas',
  '21': 'Kentucky',
  '22': 'Louisiana',
  '23': 'Maine',
  '24': 'Maryland',
  '25': 'Massachusetts',
  '26': 'Michigan',
  '27': 'Minnesota',
  '28': 'Mississippi',
  '29': 'Missouri',
  '30': 'Montana',
  '31': 'Nebraska',
  '32': 'Nevada',
  '33': 'New Hampshire',
  '34': 'New Jersey',
  '35': 'New Mexico',
  '36': 'New York',
  '37': 'North Carolina',
  '38': 'North Dakota',
  '39': 'Ohio',
  '40': 'Oklahoma',
  '41': 'Oregon',
  '42': 'Pennsylvania',
  '44': 'Rhode Island',
  '45': 'South Carolina',
  '46': 'South Dakota',
  '47': 'Tennessee',
  '48': 'Texas',
  '49': 'Utah',
  '50': 'Vermont',
  '51': 'Virginia',
  '53': 'Washington',
  '54': 'West Virginia',
  '55': 'Wisconsin',
  '56': 'Wyoming',
}

const mapWidth = 975
const mapHeight = 610

const states = computed(() => {
  const topology = us as any
  const stateCollection = feature(topology, topology.objects.states) as any
  const projection = geoAlbersUsa().fitSize([mapWidth, mapHeight], stateCollection)
  const pathBuilder = geoPath(projection)

  return stateCollection.features
    .map((state: any) => {
      const fips = String(state.id).padStart(2, '0')
      return {
        id: fips,
        name: stateNamesByFips[fips] ?? `State ${fips}`,
        d: pathBuilder(state) ?? '',
      }
    })
    .filter((state: { d: string }) => Boolean(state.d))
})

const minValue = computed(() => {
  const values = Object.values(props.valuesByFips)
  if (!values.length) return 0
  return Math.min(...values)
})

const maxValue = computed(() => {
  const values = Object.values(props.valuesByFips)
  if (!values.length) return 0
  return Math.max(...values)
})

function lerp(start: number, end: number, t: number): number {
  return Math.round(start + (end - start) * t)
}

function colorForValue(value: number): string {
  if (!value) return 'rgba(255, 255, 255, 0.06)'

  const low = [52, 67, 95]
  const high = [90, 184, 255]
  const range = maxValue.value - minValue.value
  const normalized = range <= 0 ? 0.5 : (value - minValue.value) / range
  const t = Math.min(Math.max(normalized, 0), 1)

  const r = lerp(low[0], high[0], t)
  const g = lerp(low[1], high[1], t)
  const b = lerp(low[2], high[2], t)
  return `rgb(${r}, ${g}, ${b})`
}

function valueForFips(fips: string): number {
  return props.valuesByFips[fips] ?? 0
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function onStateEnter(state: { id: string; name: string }, event: MouseEvent) {
  const target = event.currentTarget as SVGPathElement | null
  const container = target?.ownerSVGElement
  if (container) {
    const rect = container.getBoundingClientRect()
    hoverPosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  hoveredState.value = {
    id: state.id,
    name: state.name,
    value: valueForFips(state.id),
  }
}

function onStateMove(event: MouseEvent) {
  const target = event.currentTarget as SVGPathElement | null
  const container = target?.ownerSVGElement
  if (!container) return

  const rect = container.getBoundingClientRect()
  hoverPosition.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function onStateLeave() {
  hoveredState.value = null
}
</script>

<template>
  <div class="state-map-wrap">
    <div class="d-flex align-center justify-space-between mb-3">
      <span class="text-subtitle-1 font-weight-medium">US Shipment Volume by State</span>
      <span
        class="text-caption state-map-subtitle"
        :class="{ 'state-map-subtitle--selected': Boolean(subtitleColor) }"
        :style="subtitleColor ? { backgroundColor: subtitleColor } : { color: 'rgba(255, 255, 255, 0.7)' }"
      >
        {{ subtitle }}
      </span>
    </div>

    <div class="state-map-canvas">
      <svg :viewBox="`0 0 ${mapWidth} ${mapHeight}`" class="state-map-svg" role="img" aria-label="United States shipment map by state">
        <g>
          <path
            v-for="state in states"
            :key="state.id"
            :d="state.d"
            :fill="colorForValue(valueForFips(state.id))"
            stroke="rgba(255, 255, 255, 0.22)"
            stroke-width="0.9"
            class="state-shape"
            :class="{ 'state-shape--active': hoveredState?.id === state.id }"
            @mouseenter="onStateEnter(state, $event)"
            @mousemove="onStateMove($event)"
            @mouseleave="onStateLeave"
          >
            <title>{{ state.name }}: {{ formatValue(valueForFips(state.id)) }} shipments</title>
          </path>
        </g>
      </svg>

      <div
        v-if="hoveredState"
        class="state-map-tooltip text-caption"
        :style="{
          left: `${hoverPosition.x + 12}px`,
          top: `${hoverPosition.y + 12}px`,
        }"
      >
        {{ hoveredState.name }}: {{ formatValue(hoveredState.value) }} shipments
      </div>
    </div>

    <div class="d-flex align-center justify-end mt-2">
      <span class="text-caption text-medium-emphasis mr-2">Lower</span>
      <div class="state-map-legend" />
      <span class="text-caption text-medium-emphasis ml-2">Higher</span>
    </div>
  </div>
</template>

<style scoped>
.state-map-wrap {
  width: 100%;
}

.state-map-subtitle {
  transition: background-color 160ms ease, color 160ms ease;
}

.state-map-subtitle--selected {
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 999px;
  line-height: 1.2;
}

.state-map-canvas {
  position: relative;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
}

.state-map-svg {
  width: 100%;
  height: auto;
  display: block;
}

.state-shape {
  transition: filter 140ms ease;
}

.state-shape:hover {
  filter: brightness(1.12);
}

.state-shape--active {
  filter: brightness(1.2);
  stroke: rgba(255, 255, 255, 0.75);
  stroke-width: 1.4;
}

.state-map-tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  padding: 6px 9px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(14, 17, 23, 0.95);
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
}

.state-map-legend {
  width: 160px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(52, 67, 95), rgb(90, 184, 255));
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
