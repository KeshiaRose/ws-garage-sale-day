<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  listing: Object,
  searchQuery: String,
  selected: Boolean,
  isDark: Boolean,
  isSaved: Boolean,
  showReorder: Boolean,
  canMoveUp: Boolean,
  canMoveDown: Boolean,
})

const emit = defineEmits(['click', 'save', 'move-up', 'move-down'])
const copied = ref(false)

const TAG_COLORS = {
  'Clothing': 'bg-rose-100 text-rose-700',
  "Women's Clothing": 'bg-pink-100 text-pink-700',
  "Men's Clothing": 'bg-blue-200 text-blue-800',
  'Shoes & Footwear': 'bg-rose-200 text-rose-800',
  'Furniture': 'bg-amber-100 text-amber-700',
  'Kids & Baby': 'bg-sky-100 text-sky-700',
  'Toys & Games': 'bg-purple-100 text-purple-700',
  'Books': 'bg-indigo-100 text-indigo-700',
  'Plants & Garden': 'bg-green-100 text-green-700',
  'Art & Crafts': 'bg-orange-100 text-orange-700',
  'Vintage & Antiques': 'bg-yellow-100 text-yellow-800',
  'Electronics': 'bg-slate-100 text-slate-600',
  'Music & Records': 'bg-violet-100 text-violet-700',
  'Tools': 'bg-stone-200 text-stone-700',
  'Kitchen & Dining': 'bg-red-100 text-red-700',
  'Sports & Outdoors': 'bg-teal-100 text-teal-700',
  'Home Goods': 'bg-fuchsia-100 text-fuchsia-700',
  'Jewelry & Accessories': 'bg-pink-100 text-pink-700',
  'Food & Treats': 'bg-lime-100 text-lime-700',
  'Pet Supplies': 'bg-emerald-100 text-emerald-700',
  'Free / PWYW': 'bg-green-200 text-green-800',
  'Movies & Entertainment': 'bg-blue-100 text-blue-700',
  'Appliances': 'bg-zinc-100 text-zinc-700',
  'Holiday & Seasonal': 'bg-rose-200 text-rose-800',
  'Cycling': 'bg-cyan-100 text-cyan-700',
  'Collectibles': 'bg-amber-200 text-amber-800',
  'Office & School': 'bg-sky-200 text-sky-800',
  'Automotive': 'bg-gray-200 text-gray-700',
  'Miscellaneous': 'bg-stone-100 text-stone-500',
}

function highlight(text) {
  const q = props.searchQuery?.trim()
  if (!q || !text) return text
  const words = q.split(/\s+/).filter(Boolean)
  const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  return String(text).replace(new RegExp(pattern, 'gi'), m => `<mark>${m}</mark>`)
}

const highlighted = computed(() => highlight(props.listing.description))
const highlightedAddress = computed(() => highlight(props.listing.address))
const highlightedSaleNum = computed(() => highlight(saleNum.value))

const mapsUrl = computed(() =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.listing.fullAddress)}`
)

const saleNum = computed(() => String(props.listing.saleNumber).padStart(3, '0'))

async function copyAddress() {
  await navigator.clipboard.writeText(`${props.listing.fullAddress}, Seattle, WA`)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div @click="emit('click')" :class="[
    'rounded-xl border p-3.5 cursor-pointer transition-all',
    isDark ? 'bg-dark-card' : 'bg-white',
    selected
      ? 'border-coral ring-1 ring-coral shadow-sm'
      : isDark
        ? 'border-dark-border hover:border-white/20 hover:shadow-md hover:shadow-black/40'
        : 'border-stone-200 hover:border-peach hover:shadow-sm',
  ]">
    <div class="flex gap-2">

      <!-- Reorder controls -->
      <div v-if="showReorder" class="flex flex-col gap-1 shrink-0 pt-0.5 -ml-1">
        <button @click.stop="emit('move-up')" :disabled="!canMoveUp" :class="canMoveUp
          ? isDark ? 'text-white/40 hover:text-white cursor-pointer' : 'text-stone-300 hover:text-stone-600 cursor-pointer'
          : isDark ? 'text-white/10 cursor-default' : 'text-stone-200 cursor-default'"
          class="transition-colors rounded p-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button @click.stop="emit('move-down')" :disabled="!canMoveDown" :class="canMoveDown
          ? isDark ? 'text-white/40 hover:text-white cursor-pointer' : 'text-stone-300 hover:text-stone-600 cursor-pointer'
          : isDark ? 'text-white/10 cursor-default' : 'text-stone-200 cursor-default'"
          class="transition-colors rounded p-0.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <!-- Main content -->
      <div class="flex-1 min-w-0">

        <!-- Address row -->
        <div class="flex items-start gap-2 mb-2">
          <span :class="isDark ? 'text-coral border-coral/40 bg-coral/10' : 'text-coral bg-peach/30 border-peach'"
            class="shrink-0 text-xs font-bold tabular-nums border rounded-lg px-1.5 py-0.5 leading-none mt-px"
            v-html="'#' + highlightedSaleNum" />
          <span :class="isDark ? 'text-white' : 'text-stone-900'"
            class="font-semibold text-sm leading-snug flex-1 min-w-0" v-html="highlightedAddress" />
          <button @click.stop="emit('save')"
            :class="isSaved ? 'text-coral' : isDark ? 'text-white/30 hover:text-coral' : 'text-stone-300 hover:text-coral'"
            class="shrink-0 cursor-pointer transition-colors -mt-0.5 -mr-0.5"
            :title="isSaved ? 'Remove from Favorites' : 'Add to Favorites'">
            <svg class="w-5 h-5" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

        <!-- Description -->
        <div v-if="listing.description" class="mb-2.5">
          <p :class="isDark ? 'text-white/70' : 'text-stone-500'"
            class="text-sm leading-snug" v-html="highlighted" />
          <span v-if="listing.descriptionOverridden"
            :class="isDark ? 'text-sky-400/80 border-sky-400/30' : 'text-sky-600 border-sky-200'"
            class="inline-flex items-center gap-1 mt-1 text-xs border rounded-full px-2 py-0.5 font-medium">
            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Updated by seller
          </span>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1 mb-2.5">
          <span v-for="tag in listing.tags" :key="tag" :class="TAG_COLORS[tag] ?? 'bg-stone-100 text-stone-500'"
            class="text-xs font-medium px-2 py-0.5 rounded-full">
            {{ tag }}
          </span>
        </div>

        <!-- Actions -->
        <div :class="isDark ? 'text-white/30' : 'text-stone-400'" class="flex items-center gap-3 text-xs">
          <a :href="mapsUrl" target="_blank" rel="noopener" @click.stop
            class="cursor-pointer hover:text-coral transition-colors flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Google Maps
          </a>
          <button @click.stop="copyAddress"
            class="cursor-pointer hover:text-coral transition-colors flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {{ copied ? 'Copied!' : 'Copy address' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
