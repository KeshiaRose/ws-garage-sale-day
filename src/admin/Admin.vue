<script setup>
import { ref, computed, onMounted } from 'vue'
import allListings from '../data/tagged-listings.json'

const ALL_TAGS = [
  'Clothing', "Women's Clothing", "Men's Clothing", 'Shoes & Footwear',
  'Jewelry & Accessories', 'Kids & Baby', 'Furniture', 'Home Decor',
  'Kitchen & Dining', 'Appliances', 'Tools', 'Books', 'Art & Crafts',
  'Toys & Games', 'Music & Records', 'Movies & Entertainment', 'Electronics',
  'Collectibles', 'Vintage & Antiques', 'Sports & Outdoors', 'Cycling',
  'Automotive', 'Plants & Garden', 'Pet Supplies', 'Food & Treats',
  'Free / PWYW', 'Office & School', 'Holiday & Seasonal', 'Miscellaneous',
]

const listings = allListings.filter(l => !l.canceled)
const overrides = ref({})
const searchInput = ref('')
const saved = ref(true)
const saving = ref(false)
const addingTagFor = ref(null)

onMounted(async () => {
  const res = await fetch('/api/overrides')
  overrides.value = await res.json()
})

const filtered = computed(() => {
  const q = searchInput.value.trim().toLowerCase()
  if (!q) return listings
  return listings.filter(l =>
    l.address.toLowerCase().includes(q) ||
    l.description?.toLowerCase().includes(q) ||
    String(l.saleNumber).includes(q)
  )
})

function getOverride(saleNumber) {
  return overrides.value[String(saleNumber)] ?? {}
}

function effectiveTags(listing) {
  const ov = getOverride(listing.saleNumber)
  let tags = [...listing.tags]
  if (ov.remove) tags = tags.filter(t => !ov.remove.includes(t))
  if (ov.add) for (const t of ov.add) if (!tags.includes(t)) tags.push(t)
  return tags
}

function isRemoved(saleNumber, tag) {
  return getOverride(saleNumber).remove?.includes(tag) ?? false
}

function isAdded(saleNumber, tag) {
  return getOverride(saleNumber).add?.includes(tag) ?? false
}

function toggleRemove(saleNumber, tag) {
  const key = String(saleNumber)
  const ov = { ...getOverride(saleNumber) }
  if (isRemoved(saleNumber, tag)) {
    ov.remove = ov.remove.filter(t => t !== tag)
  } else {
    ov.remove = [...(ov.remove ?? []), tag]
  }
  setOverride(key, ov)
}

function removeAdded(saleNumber, tag) {
  const key = String(saleNumber)
  const ov = { ...getOverride(saleNumber) }
  ov.add = (ov.add ?? []).filter(t => t !== tag)
  setOverride(key, ov)
}

function addTag(saleNumber, tag) {
  if (!tag) return
  const key = String(saleNumber)
  const ov = { ...getOverride(saleNumber) }
  if (!(ov.add ?? []).includes(tag)) {
    ov.add = [...(ov.add ?? []), tag]
    // if it was previously removed, un-remove it
    ov.remove = (ov.remove ?? []).filter(t => t !== tag)
  }
  setOverride(key, ov)
  addingTagFor.value = null
}

function setOverride(key, ov) {
  // clean up empty arrays
  if (!ov.add?.length) delete ov.add
  if (!ov.remove?.length) delete ov.remove
  const next = { ...overrides.value }
  if (!ov.add && !ov.remove) delete next[key]
  else next[key] = ov
  overrides.value = next
  saved.value = false
}

async function saveOverrides() {
  saving.value = true
  await fetch('/api/overrides', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides.value),
  })
  saving.value = false
  saved.value = true
}

function availableTagsFor(saleNumber) {
  const listing = listings.find(l => l.saleNumber === saleNumber)
  const already = effectiveTags(listing)
  return ALL_TAGS.filter(t => !already.includes(t))
}

function hasOverride(saleNumber) {
  const ov = getOverride(saleNumber)
  return (ov.add?.length ?? 0) + (ov.remove?.length ?? 0) > 0
}
</script>

<template>
  <div class="min-h-screen bg-cream" style="font-family: 'Nunito', system-ui, sans-serif">

    <!-- Header -->
    <header class="bg-navy px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
      <div>
        <h1 class="text-white font-bold text-lg leading-tight">Tag Overrides Admin</h1>
        <p class="text-white/40 text-xs mt-0.5">Dev only — changes write directly to tag-overrides.json</p>
      </div>
      <button @click="saveOverrides" :disabled="saved || saving"
        :class="saved ? 'bg-white/10 text-white/30 cursor-default' : saving ? 'bg-white/20 text-white/60 cursor-wait' : 'bg-coral text-white hover:bg-coral/90 cursor-pointer'"
        class="font-bold px-5 py-2 rounded-xl transition-colors text-sm flex items-center gap-2">
        <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <svg v-else-if="saved" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        {{ saving ? 'Saving…' : saved ? 'Saved' : 'Save overrides' }}
      </button>
    </header>

    <!-- Search -->
    <div class="bg-white border-b border-stone-200 px-6 py-3 flex flex-col items-center">
      <div class="relative max-w-2xl w-full">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="searchInput" type="text" placeholder="Search by address, description, or sale number…"
          class="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 bg-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-coral" />
      </div>
      <p class="text-stone-400 text-xs mt-2 text-center">{{ filtered.length }} listings — {{
        Object.keys(overrides).length }} with overrides</p>
    </div>

    <!-- Listings -->
    <div class="max-w-3xl mx-auto px-4 py-4 space-y-2">
      <div v-for="listing in filtered" :key="listing.saleNumber"
        :class="hasOverride(listing.saleNumber) ? 'border-coral/40 bg-coral/5' : 'border-stone-200 bg-white'"
        class="rounded-xl border p-4">

        <!-- Header row -->
        <div class="flex items-start gap-2 mb-2">
          <span
            class="shrink-0 text-xs font-bold text-coral bg-peach/30 border border-peach rounded-lg px-1.5 py-0.5 leading-none mt-px tabular-nums">
            #{{ String(listing.saleNumber).padStart(3, '0') }}
          </span>
          <span class="font-bold text-sm text-stone-900 flex-1">{{ listing.address }}</span>
        </div>

        <!-- Description -->
        <p v-if="listing.description" class="text-xs text-stone-500 mb-3 leading-snug line-clamp-2">
          {{ listing.description }}
        </p>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 items-center">
          <!-- Base tags (can click to toggle remove) -->
          <button v-for="tag in listing.tags" :key="tag" @click="toggleRemove(listing.saleNumber, tag)" :class="isRemoved(listing.saleNumber, tag)
            ? 'bg-red-100 text-red-400 line-through opacity-60 hover:opacity-100'
            : 'bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-500'"
            class="text-xs font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            :title="isRemoved(listing.saleNumber, tag) ? 'Click to un-remove' : 'Click to remove'">
            {{ tag }}
          </button>

          <!-- Added tags -->
          <span v-for="tag in (getOverride(listing.saleNumber).add ?? [])" :key="'add-' + tag"
            class="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
            {{ tag }}
            <button @click="removeAdded(listing.saleNumber, tag)"
              class="text-green-500 hover:text-red-500 transition-colors cursor-pointer leading-none">×</button>
          </span>

          <!-- Add tag button -->
          <div class="relative">
            <button v-if="addingTagFor !== listing.saleNumber" @click="addingTagFor = listing.saleNumber"
              class="text-xs font-semibold px-2 py-0.5 rounded-full border-2 border-dashed border-stone-300 text-stone-400 hover:border-coral hover:text-coral transition-colors cursor-pointer">
              + add tag
            </button>
            <select v-else @change="addTag(listing.saleNumber, $event.target.value)" @blur="addingTagFor = null"
              class="text-xs border border-coral rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-coral bg-white"
              autofocus>
              <option value="">— pick a tag —</option>
              <option v-for="tag in availableTagsFor(listing.saleNumber)" :key="tag" :value="tag">{{ tag }}</option>
            </select>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
