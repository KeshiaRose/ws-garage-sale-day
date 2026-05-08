<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  listings: Array,
  selectedId: Number,
  isDark: Boolean,
  savedIds: Set,
  mapVisible: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])

const mapEl = ref(null)
let L = null
let map = null
let tileLayer = null
let markerGroup = null
let markerMap = {}
let prevSelectedId = null

onMounted(async () => {
  try {
    const leaflet = await import('leaflet')
    await import('leaflet/dist/leaflet.css')
    L = leaflet.default
  } catch {
    console.warn('Leaflet not installed — run: npm install leaflet')
    return
  }

  map = L.map(mapEl.value, {
    center: [47.545, -122.365],
    zoom: 12,
    zoomControl: true,
  })

  tileLayer = makeTileLayer(props.isDark)
  tileLayer.addTo(map)

  markerGroup = L.layerGroup().addTo(map)
  map.on('click', () => emit('select', null))
  renderMarkers()
})

onUnmounted(() => map?.remove())

watch(() => props.listings, renderMarkers)
watch(() => props.savedIds, renderMarkers)

watch(() => props.mapVisible, (visible) => {
  if (visible && map) nextTick(() => map.invalidateSize())
})

watch(() => props.isDark, (dark) => {
  if (!map || !L) return
  tileLayer.remove()
  tileLayer = makeTileLayer(dark)
  tileLayer.addTo(map)
})

watch(() => props.selectedId, (id) => {
  if (prevSelectedId !== null && markerMap[prevSelectedId]) {
    const wasSaved = props.savedIds?.has(prevSelectedId) ?? false
    markerMap[prevSelectedId].setIcon(makeIcon(false, wasSaved))
  }
  if (id !== null && markerMap[id]) {
    const isSaved = props.savedIds?.has(id) ?? false
    markerMap[id].setIcon(makeIcon(true, isSaved))
    markerMap[id].openPopup()
  }
  prevSelectedId = id
})

function makeTileLayer(dark) {
  const url = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  return L.tileLayer(url, {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
  })
}

function makeIcon(selected = false, saved = false) {
  if (saved) {
    const color = selected ? '#2B2A50' : '#F5A623'
    const stroke = selected ? '#F5A623' : 'white'
    return L.divIcon({
      className: '',
      html: `<svg width="22" height="22" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="1.5" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.45));display:block"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })
  }
  const bg = selected ? '#2B2A50' : '#E8705C'
  const size = selected ? 14 : 10
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function renderMarkers() {
  if (!L || !markerGroup) return
  markerGroup.clearLayers()
  markerMap = {}
  prevSelectedId = null

  for (const listing of props.listings) {
    const isSelected = listing.id === props.selectedId
    const isSaved = props.savedIds?.has(listing.id) ?? false
    const marker = L.marker([listing.lat, listing.lng], { icon: makeIcon(isSelected, isSaved) })

    const num = String(listing.saleNumber).padStart(3, '0')
    marker.bindPopup(
      `<div style="font-family:'Nunito',system-ui,sans-serif;min-width:180px;max-width:260px">
        <div style="font-weight:700;font-size:13px;margin-bottom:3px">
          <span style="color:#E8705C">#${num}</span> ${listing.address}
        </div>
        ${listing.description ? `<div style="font-size:12px;color:#78716c;line-height:1.4">${listing.description}</div>` : ''}
      </div>`,
      { maxWidth: 300 }
    )

    marker.on('click', () => emit('select', listing.id))
    markerGroup.addLayer(marker)
    markerMap[listing.id] = marker
  }
}
</script>

<template>
  <div ref="mapEl" class="w-full h-full" />
</template>
