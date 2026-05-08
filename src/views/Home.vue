<script setup>
import { ref, computed, watch } from 'vue'
import allListings from '../data/tagged-listings.json'
import tagOverrides from '../data/tag-overrides.json'
import ListingCard from '../components/ListingCard.vue'
import MapView from '../components/MapView.vue'

const searchInput = ref('')
const search = ref('')
const activeTags = ref(new Set())
const selectedId = ref(null)
const activeTab = ref('listings')
const mobileView = ref('list')
const showFilters = ref(false)

const savedTheme = localStorage.getItem('theme')
const isDark = ref(
  savedTheme !== null ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
)

const savedOrder = ref(JSON.parse(localStorage.getItem('savedIds') ?? '[]'))
const savedIds = computed(() => new Set(savedOrder.value))

function toggleDark() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function toggleSave(id) {
  const arr = savedOrder.value
  savedOrder.value = arr.includes(id) ? arr.filter(i => i !== id) : [...arr, id]
  localStorage.setItem('savedIds', JSON.stringify(savedOrder.value))
}

function moveSaved(id, dir) {
  const arr = [...savedOrder.value]
  const idx = arr.indexOf(id)
  const swap = idx + dir
  if (swap < 0 || swap >= arr.length) return
    ;[arr[idx], arr[swap]] = [arr[swap], arr[idx]]
  savedOrder.value = arr
  localStorage.setItem('savedIds', JSON.stringify(arr))
}

const listings = allListings.filter(l => !l.canceled).map(l => {
  const ov = tagOverrides[String(l.saleNumber)]
  if (!ov) return l
  let tags = [...l.tags]
  if (ov.remove) tags = tags.filter(t => !ov.remove.includes(t))
  if (ov.add) for (const t of ov.add) if (!tags.includes(t)) tags.push(t)
  return { ...l, tags }
})

// Build vocabulary from all listing text for fuzzy correction
const vocab = new Set()
for (const l of listings) {
  for (const w of `${l.description ?? ''} ${l.address} ${l.fullAddress}`.toLowerCase().match(/[a-z']+/g) ?? []) {
    if (w.length > 2) vocab.add(w)
  }
}
const vocabArray = [...vocab]

function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1])
      curr.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > 2) return 3
    prev = curr
  }
  return prev[b.length]
}

function correctWord(word) {
  if (word.length < 3 || vocab.has(word) || /\d/.test(word)) return word
  let best = word, bestDist = 3
  for (const v of vocabArray) {
    const d = editDistance(word, v)
    if (d < bestDist) {
      best = v
      bestDist = d
      if (d === 1) break
    }
  }
  return bestDist <= 2 ? best : word
}

let debounceTimer = null
watch(searchInput, val => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { search.value = val }, 150)
})

const tagFreq = {}
for (const l of listings) {
  for (const t of l.tags) tagFreq[t] = (tagFreq[t] ?? 0) + 1
}
const TAG_ORDER = [
  'Clothing', "Women's Clothing", "Men's Clothing", 'Shoes & Footwear', 'Jewelry & Accessories', 'Kids & Baby',
  'Furniture', 'Home Decor', 'Kitchen & Dining', 'Appliances', 'Tools',
  'Books', 'Art & Crafts', 'Toys & Games', 'Music & Records', 'Movies & Entertainment', 'Electronics', 'Collectibles', 'Vintage & Antiques',
  'Sports & Outdoors', 'Cycling', 'Automotive',
  'Plants & Garden', 'Pet Supplies',
  'Food & Treats', 'Free / PWYW',
  'Office & School', 'Holiday & Seasonal', 'Miscellaneous',
]

const allTags = Object.keys(tagFreq)
  .sort((a, b) => {
    const ai = TAG_ORDER.indexOf(a)
    const bi = TAG_ORDER.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

const correctedWords = computed(() =>
  search.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
    .map(w => w.replace(/^#/, ''))
    .map(correctWord)
)

const correctedQuery = computed(() => correctedWords.value.join(' '))

const filteredListings = computed(() => {
  const words = correctedWords.value
  const q = correctedQuery.value

  const saleNum = (l) => String(l.saleNumber).padStart(3, '0')

  return listings
    .filter(l => {
      if (activeTags.value.size > 0 && !l.tags.some(t => activeTags.value.has(t))) return false
      if (!words.length) return true
      const hay = `${l.description} ${l.address} ${l.fullAddress} ${saleNum(l)}`.toLowerCase()
      return words.every(w => hay.includes(w))
    })
    .sort((a, b) => {
      if (!words.length) return 0
      const aExact = `${a.description} ${a.address} ${saleNum(a)}`.toLowerCase().includes(q)
      const bExact = `${b.description} ${b.address} ${saleNum(b)}`.toLowerCase().includes(q)
      return bExact - aExact
    })
})

const listingById = Object.fromEntries(listings.map(l => [l.saleNumber, l]))

const displayedListings = computed(() => {
  const filteredSaleNums = new Set(filteredListings.value.map(l => l.saleNumber))
  if (activeTab.value === 'favorites') {
    return savedOrder.value.filter(sn => filteredSaleNums.has(sn)).map(sn => listingById[sn]).filter(Boolean)
  }
  if (activeTab.value === 'lists' && activeList.value) {
    return activeList.value.ids.filter(sn => filteredSaleNums.has(sn)).map(sn => listingById[sn]).filter(Boolean)
  }
  return filteredListings.value
})

function toggleTag(tag) {
  const next = new Set(activeTags.value)
  next.has(tag) ? next.delete(tag) : next.add(tag)
  activeTags.value = next
}

function clearTags() {
  activeTags.value = new Set()
}

function handleMapSelect(id) {
  selectedId.value = id
}

const showModal = ref(!localStorage.getItem('seenIntro'))

function closeModal() {
  showModal.value = false
  localStorage.setItem('seenIntro', '1')
}

// Lists
const savedLists = ref(JSON.parse(localStorage.getItem('savedLists') ?? '[]'))
const activeList = ref(null)
const showCreateListModal = ref(false)
const newListName = ref('')
const createListCopied = ref(false)
const copiedListName = ref(null)
const pendingImport = ref(null)
const showDuplicatePrompt = ref(false)

function persistLists() {
  localStorage.setItem('savedLists', JSON.stringify(savedLists.value))
}

function shareUrl(list) {
  return `${window.location.origin}${window.location.pathname}?list=${encodeURIComponent(list.name)}&ids=${list.ids.join(',')}`
}

async function createList() {
  const name = newListName.value.trim().slice(0, 40)
  if (!name || savedOrder.value.length === 0) return
  const newList = { name, ids: [...savedOrder.value] }
  const idx = savedLists.value.findIndex(l => l.name === name)
  if (idx >= 0) savedLists.value[idx] = newList
  else savedLists.value = [...savedLists.value, newList]
  persistLists()
  await navigator.clipboard.writeText(shareUrl(newList))
  createListCopied.value = true
  setTimeout(() => { createListCopied.value = false }, 2000)
}

async function copyShareUrl(list) {
  await navigator.clipboard.writeText(shareUrl(list))
  copiedListName.value = list.name
  setTimeout(() => { copiedListName.value = null }, 2000)
}

function deleteList(name) {
  savedLists.value = savedLists.value.filter(l => l.name !== name)
  if (activeList.value?.name === name) activeList.value = null
  persistLists()
}

function applyImport(name, ids) {
  const newList = { name, ids }
  const idx = savedLists.value.findIndex(l => l.name === name)
  if (idx >= 0) savedLists.value[idx] = newList
  else savedLists.value = [...savedLists.value, newList]
  persistLists()
  activeTab.value = 'lists'
  activeList.value = newList
  window.history.replaceState({}, '', window.location.pathname)
}

function confirmImportNew() {
  let name = pendingImport.value.name
  let suffix = 2
  while (savedLists.value.find(l => l.name === name)) name = `${pendingImport.value.name} ${suffix++}`
  applyImport(name, pendingImport.value.ids)
  showDuplicatePrompt.value = false
  pendingImport.value = null
}

function confirmImportUpdate() {
  applyImport(pendingImport.value.name, pendingImport.value.ids)
  showDuplicatePrompt.value = false
  pendingImport.value = null
}

// Handle shared list URL on load
const urlParams = new URLSearchParams(window.location.search)
const importName = urlParams.get('list')
const importIdsRaw = urlParams.get('ids')
if (importName && importIdsRaw) {
  const importIds = importIdsRaw.split(',').map(Number).filter(sn => !!listingById[sn])
  if (importIds.length > 0) {
    if (savedLists.value.find(l => l.name === importName)) {
      pendingImport.value = { name: importName, ids: importIds }
      showDuplicatePrompt.value = true
    } else {
      applyImport(importName, importIds)
    }
  }
}
</script>

<template>
  <div :class="isDark ? 'bg-dark-bg' : 'bg-cream'" class="h-screen flex flex-col"
    style="font-family: 'Nunito', system-ui, sans-serif">

    <!-- Header -->
    <header class="bg-navy px-5 py-3 flex items-center gap-4 shrink-0">
      <div class="flex-1 min-w-0">
        <h1 class="text-white font-bold text-base tracking-tight leading-tight">
          West Seattle Garage Sale Day <span class="text-coral">2026</span>
        </h1>
        <p class="text-white/40 text-xs mt-0.5 flex items-center gap-1 whitespace-nowrap">
          Saturday May 9
          <span class="hidden md:inline-flex items-center gap-1">
            &middot;
            <a href="https://westseattleblog.com/wsgaragesaledaymap/"
              class="underline hover:text-coral inline-flex items-center gap-0.5" target="_blank"
              rel="noopener noreferrer">
              See Official Map
              <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </span>
          &middot;
          <button @click="showModal = true" class="underline hover:text-coral cursor-pointer transition-colors">
            About
          </button>
        </p>
      </div>
      <div class="flex items-center gap-2 md:gap-4">
        <div class="text-right">
          <p class="text-coral font-bold text-xl leading-none tabular-nums">{{ displayedListings.length }}</p>
          <p class="text-white/40 text-xs mt-0.5">
            {{ activeTab === 'favorites' ? 'favorited' : activeTab === 'lists' && activeList ? 'in list' :
              filteredListings.length === listings.length ? 'sales' : `of ${listings.length}` }}
          </p>
        </div>
        <!-- GitHub link -->
        <a href="https://github.com/KeshiaRose/ws-garage-sale-day" target="_blank" rel="noopener noreferrer"
          class="hidden md:block text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          title="View on GitHub">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 0 48.9043 0C21.8203 0 0 22.1074 0 49.1914C0 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" />
          </svg>
        </a>

        <!-- Dark/light toggle -->
        <button @click="toggleDark"
          class="cursor-pointer text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <!-- Moon: shown in light mode -->
          <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <!-- Sun: shown in dark mode -->
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Search + filters -->
    <div :class="isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-stone-200'"
      class="border-b px-4 pt-3 pb-2 shrink-0 space-y-2.5">
      <div class="flex gap-2">
        <div class="relative flex-1">
          <svg :class="isDark ? 'text-white/30' : 'text-stone-400'"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input v-model="searchInput" type="text" placeholder="Search by item, address, anything..." :class="isDark
            ? 'bg-dark-card border-dark-border text-white placeholder:text-white/30 focus:bg-dark-card'
            : 'bg-cream border-stone-200 text-stone-900 placeholder:text-stone-400 focus:bg-white'"
            class="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-coral transition-colors" />
        </div>
        <button @click="showFilters = !showFilters" :class="[
          'md:hidden relative shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition-colors cursor-pointer',
          showFilters || activeTags.size > 0
            ? 'bg-coral text-white border-coral'
            : isDark
              ? 'bg-dark-card border-dark-border text-white/70 hover:text-white'
              : 'bg-cream border-stone-200 text-stone-600 hover:text-stone-900'
        ]">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          <span class="text-xs">{{ activeTags.size > 0 ? activeTags.size : 'Filters' }}</span>
        </button>
      </div>

      <!-- Tag filter pills -->
      <div :class="[showFilters ? 'flex' : 'hidden', 'md:flex', 'flex-wrap justify-center gap-1.5 pb-0.5']">
        <button @click="clearTags" :class="activeTags.size === 0
          ? 'bg-navy text-white'
          : isDark
            ? 'bg-dark-border text-peach/80 hover:bg-navy/60'
            : 'bg-peach/40 text-navy hover:bg-peach/70'"
          class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer">
          All
        </button>
        <button v-for="tag in allTags" :key="tag" @click="toggleTag(tag)" :class="activeTags.has(tag)
          ? 'bg-coral text-white'
          : isDark
            ? 'bg-dark-border text-peach/80 hover:bg-navy/60'
            : 'bg-peach/40 text-navy hover:bg-peach/70'"
          class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap cursor-pointer">
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="flex flex-1 min-h-0">

      <!-- Card list -->
      <div :class="mobileView === 'map' ? 'hidden md:flex' : 'flex'"
        class="w-full md:w-[420px] shrink-0 flex-col min-h-0">

        <!-- Tabs -->
        <div :class="isDark ? 'bg-dark-surface border-dark-border' : 'bg-white border-stone-200'"
          class="flex shrink-0 border-b">
          <button @click="activeTab = 'listings'" :class="[
            'flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px cursor-pointer',
            activeTab === 'listings'
              ? 'border-coral text-coral'
              : isDark ? 'border-transparent text-white/40 hover:text-white/70' : 'border-transparent text-stone-400 hover:text-stone-600'
          ]">
            All Sales
          </button>
          <button @click="activeTab = 'favorites'" :class="[
            'flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center justify-center gap-1.5 cursor-pointer',
            activeTab === 'favorites'
              ? 'border-coral text-coral'
              : isDark ? 'border-transparent text-white/40 hover:text-white/70' : 'border-transparent text-stone-400 hover:text-stone-600'
          ]">
            Favorites
            <span v-if="savedIds.size > 0"
              :class="activeTab === 'favorites' ? 'text-coral' : isDark ? 'text-white/40' : 'text-stone-400'"
              class="text-xs font-bold tabular-nums">
              ({{ savedIds.size }})
            </span>
          </button>
          <button @click="activeTab = 'lists'; activeList = null" :class="[
            'flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center justify-center gap-1.5 cursor-pointer',
            activeTab === 'lists'
              ? 'border-coral text-coral'
              : isDark ? 'border-transparent text-white/40 hover:text-white/70' : 'border-transparent text-stone-400 hover:text-stone-600'
          ]">
            Lists
            <span v-if="savedLists.length > 0"
              :class="activeTab === 'lists' ? 'text-coral' : isDark ? 'text-white/40' : 'text-stone-400'"
              class="text-xs font-bold tabular-nums">
              ({{ savedLists.length }})
            </span>
          </button>
        </div>

        <!-- List view header -->
        <div v-if="activeTab === 'lists' && activeList" class="shrink-0 bg-navy px-3 py-2.5 flex items-center gap-2">
          <button @click="activeList = null"
            class="cursor-pointer text-white/50 hover:text-white transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <p class="text-white/50 text-xs leading-none mb-0.5">Viewing list</p>
            <p class="text-white font-bold text-sm truncate">{{ activeList.name }}</p>
          </div>
          <button @click="copyShareUrl(activeList)"
            :class="copiedListName === activeList.name ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'"
            class="cursor-pointer transition-colors shrink-0 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {{ copiedListName === activeList.name ? 'Copied!' : 'Share' }}
          </button>
        </div>

        <!-- Cards -->
        <div :class="isDark ? 'scrollbar-dark' : 'scrollbar-light'"
          class="flex-1 overflow-y-auto p-3 pb-20 md:pb-3 space-y-2">

          <!-- Lists overview -->
          <template v-if="activeTab === 'lists' && !activeList">
            <button v-if="savedIds.size > 0"
              @click="showCreateListModal = true; newListName = ''; createListCopied = false"
              :class="isDark ? 'border-coral/30 text-coral hover:bg-coral/10' : 'border-coral/40 text-coral hover:bg-coral/5'"
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed font-semibold text-sm transition-colors cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Save Favorites as List
            </button>
            <div v-for="list in savedLists" :key="list.name"
              :class="isDark ? 'bg-dark-card border-dark-border' : 'bg-white border-stone-200'"
              class="rounded-xl border p-3.5">
              <div class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm truncate" :class="isDark ? 'text-white' : 'text-stone-900'">{{
                    list.name }}</p>
                  <p class="text-xs mt-0.5" :class="isDark ? 'text-white/40' : 'text-stone-400'">{{ list.ids.length }}
                    stops</p>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button @click="activeList = list; activeTab = 'lists'"
                    :class="isDark ? 'bg-dark-border text-white/70 hover:text-white' : 'bg-stone-100 text-stone-600 hover:text-stone-900'"
                    class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                    View
                  </button>
                  <button @click="copyShareUrl(list)"
                    :class="copiedListName === list.name ? 'bg-coral text-white' : isDark ? 'bg-dark-border text-white/70 hover:text-white' : 'bg-stone-100 text-stone-600 hover:text-stone-900'"
                    class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                    {{ copiedListName === list.name ? 'Copied!' : 'Share' }}
                  </button>
                  <button @click="deleteList(list.name)"
                    :class="isDark ? 'text-white/20 hover:text-red-400' : 'text-stone-300 hover:text-red-400'"
                    class="p-1 transition-colors cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div v-if="savedLists.length === 0" :class="isDark ? 'text-white/40' : 'text-stone-400'"
              class="text-center py-16">
              <p class="text-4xl mb-3">📋</p>
              <p class="font-semibold" :class="isDark ? 'text-white/60' : 'text-stone-500'">No lists yet</p>
              <p class="text-sm mt-1">Save your Favorites as a named list to share with others</p>
            </div>
          </template>

          <!-- Listing cards (All Sales, Favorites, or List view) -->
          <template v-else>
            <button v-if="activeTab === 'favorites' && savedIds.size > 0"
              @click="showCreateListModal = true; newListName = ''; createListCopied = false"
              :class="isDark ? 'border-coral/30 text-coral hover:bg-coral/10' : 'border-coral/40 text-coral hover:bg-coral/5'"
              class="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-dashed font-semibold text-sm transition-colors cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Favorites as List
            </button>
            <template v-if="displayedListings.length > 0">
              <ListingCard v-for="listing in displayedListings" :key="listing.saleNumber"
                :id="`listing-${listing.saleNumber}`" :listing="listing" :searchQuery="correctedQuery"
                :selected="listing.saleNumber === selectedId" :isDark="isDark"
                :isSaved="savedIds.has(listing.saleNumber)" :showReorder="activeTab === 'favorites'"
                :canMoveUp="savedOrder.indexOf(listing.saleNumber) > 0"
                :canMoveDown="savedOrder.indexOf(listing.saleNumber) < savedOrder.length - 1"
                @click="selectedId = listing.saleNumber" @save="toggleSave(listing.saleNumber)"
                @move-up="moveSaved(listing.saleNumber, -1)" @move-down="moveSaved(listing.saleNumber, 1)" />
            </template>
            <div v-else :class="isDark ? 'text-white/40' : 'text-stone-400'" class="text-center py-16">
              <template v-if="activeTab === 'favorites'">
                <p class="text-4xl mb-3">⭐</p>
                <p class="font-semibold" :class="isDark ? 'text-white/60' : 'text-stone-500'">No saved sales yet</p>
                <p class="text-sm mt-1">Star sales from the All Sales tab to save your favorites</p>
              </template>
              <template v-else>
                <p class="text-4xl mb-3">🏷️</p>
                <p class="font-semibold" :class="isDark ? 'text-white/60' : 'text-stone-500'">No sales match</p>
                <p class="text-sm mt-1">Try a different search or clear your filters</p>
              </template>
            </div>
          </template>

        </div>

      </div>

      <!-- Map -->
      <div :class="[
        mobileView === 'list' ? 'hidden md:block' : 'block',
        isDark ? 'border-dark-border' : 'border-stone-200'
      ]" class="flex-1 border-l">
        <MapView :listings="displayedListings" :selectedId="selectedId" :isDark="isDark" :savedIds="savedIds"
          :mapVisible="mobileView === 'map'" @select="handleMapSelect" />
      </div>

      <!-- Mobile view toggle -->
      <button @click="mobileView = mobileView === 'list' ? 'map' : 'list'"
        class="md:hidden fixed bottom-16 left-1/2 -translate-x-1/2 z-1001 flex items-center gap-2 bg-coral text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg cursor-pointer">
        <template v-if="mobileView === 'list'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Show Map
        </template>
        <template v-else>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Show List
        </template>
      </button>

    </div>

    <!-- About modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-2000 flex items-center justify-center p-4"
        style="font-family: 'Nunito', system-ui, sans-serif">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal" />
        <div :class="isDark ? 'bg-dark-surface' : 'bg-white'"
          class="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">

          <!-- Modal header -->
          <div class="bg-navy px-6 py-4 flex items-center justify-between">
            <h2 class="text-white font-bold text-lg">About this app</h2>
            <button @click="closeModal" class="text-white/40 hover:text-white transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal body -->
          <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

            <!-- Disclaimer -->
            <div class="bg-coral/10 border border-coral/30 rounded-xl p-3.5">
              <p class="font-bold text-coral text-sm mb-1">Not the official map</p>
              <p class="text-sm" :class="isDark ? 'text-white/70' : 'text-stone-600'">
                This is a hobby project by
                <a href="https://keshiarose.com" target="_blank" rel="noopener"
                  class="underline hover:text-coral">Keshia
                  Rose</a>. I made this map to make the giant list of garage sales easier to navigate.
                For the official map, with the most recent information and updates, visit the
                <a href="https://westseattleblog.com/wsgaragesaledaymap/" target="_blank" rel="noopener"
                  class="underline hover:text-coral">West Seattle Blog</a>.
              </p>
            </div>

            <!-- Usage guide -->
            <div class="space-y-3.5">
              <div class="flex gap-3">
                <span class="text-xl shrink-0 mt-0.5">🔍</span>
                <div>
                  <p class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-stone-900'">Search</p>
                  <p class="text-sm mt-0.5" :class="isDark ? 'text-white/60' : 'text-stone-500'">Search by item,
                    address, or
                    anything in a listing's description.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl shrink-0 mt-0.5">🏷️</span>
                <div>
                  <p class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-stone-900'">Filter by category</p>
                  <p class="text-sm mt-0.5" :class="isDark ? 'text-white/60' : 'text-stone-500'">Use the category pills
                    to
                    narrow listings to what you're looking for. Tap multiple to combine filters.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl shrink-0 mt-0.5">⭐</span>
                <div>
                  <p class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-stone-900'">Favorites</p>
                  <p class="text-sm mt-0.5" :class="isDark ? 'text-white/60' : 'text-stone-500'">Star any listing to
                    save
                    it. Switch to the Favorites tab to see your list, reorder your stops, and view only your saved pins
                    on
                    the map.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl shrink-0 mt-0.5">📋</span>
                <div>
                  <p class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-stone-900'">Lists</p>
                  <p class="text-sm mt-0.5" :class="isDark ? 'text-white/60' : 'text-stone-500'">Save your Favorites as
                    a
                    named list and share the link with friends or across devices. Opening a shared link automatically
                    adds
                    the list to your Lists tab.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <span class="text-xl shrink-0 mt-0.5">🗺️</span>
                <div>
                  <p class="font-bold text-sm" :class="isDark ? 'text-white' : 'text-stone-900'">Map</p>
                  <p class="text-sm mt-0.5" :class="isDark ? 'text-white/60' : 'text-stone-500'">Coral dots are sales.
                    Gold
                    stars are your favorites. Click any pin to see details, or click a listing card to highlight it on
                    the
                    map.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal footer -->
          <div class="px-6 pb-5 pt-2">
            <p class="text-xs text-center mb-3" :class="isDark ? 'text-white/40' : 'text-stone-400'">Data last synced on
              May
              7, 2026</p>
            <button @click="closeModal"
              class="w-full bg-coral text-white font-bold py-2.5 rounded-xl cursor-pointer hover:bg-coral/90 transition-colors">
              Got it!
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- Create List modal -->
    <Teleport to="body">
      <div v-if="showCreateListModal" class="fixed inset-0 z-2000 flex items-center justify-center p-4"
        style="font-family: 'Nunito', system-ui, sans-serif">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showCreateListModal = false" />
        <div :class="isDark ? 'bg-dark-surface' : 'bg-white'"
          class="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
          <div class="bg-navy px-6 py-4 flex items-center justify-between">
            <h2 class="text-white font-bold text-lg">Save as List</h2>
            <button @click="showCreateListModal = false"
              class="text-white/40 hover:text-white transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-xs font-semibold mb-1.5" :class="isDark ? 'text-white/60' : 'text-stone-500'">
                List name <span class="font-normal">({{ newListName.length }}/50)</span>
              </label>
              <input v-model="newListName" maxlength="50" type="text" placeholder="e.g. Saturday Morning Route" :class="isDark
                ? 'bg-dark-card border-dark-border text-white placeholder:text-white/30'
                : 'bg-cream border-stone-200 text-stone-900 placeholder:text-stone-400'"
                class="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-coral transition-colors"
                @keydown.enter="newListName.trim() && createList()" />
              <p class="text-xs mt-1.5" :class="isDark ? 'text-white/40' : 'text-stone-400'">
                Saves your {{ savedOrder.length }} favorited stop{{ savedOrder.length === 1 ? '' : 's' }} as a shareable
                list.
              </p>
            </div>
            <button @click="createList" :disabled="!newListName.trim()" :class="newListName.trim()
              ? createListCopied ? 'bg-green-500 hover:bg-green-600' : 'bg-coral hover:bg-coral/90'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'"
              class="w-full text-white font-bold py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2">
              <svg v-if="createListCopied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {{ createListCopied ? 'Link copied!' : 'Create & Copy Link' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Duplicate list prompt -->
    <Teleport to="body">
      <div v-if="showDuplicatePrompt" class="fixed inset-0 z-2000 flex items-center justify-center p-4"
        style="font-family: 'Nunito', system-ui, sans-serif">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div :class="isDark ? 'bg-dark-surface' : 'bg-white'"
          class="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
          <div class="bg-navy px-6 py-4">
            <h2 class="text-white font-bold text-lg">List already exists</h2>
          </div>
          <div class="px-6 py-5 space-y-4">
            <p class="text-sm" :class="isDark ? 'text-white/70' : 'text-stone-600'">
              You already have a list named <strong>"{{ pendingImport?.name }}"</strong>. Do you want to update it or
              save
              as a new list?
            </p>
            <div class="flex gap-2">
              <button @click="confirmImportUpdate"
                :class="isDark ? 'bg-dark-border text-white hover:bg-navy/60' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'"
                class="flex-1 font-semibold py-2.5 rounded-xl cursor-pointer transition-colors text-sm">
                Update
              </button>
              <button @click="confirmImportNew"
                class="flex-1 bg-coral text-white font-semibold py-2.5 rounded-xl cursor-pointer hover:bg-coral/90 transition-colors text-sm">
                Save as New
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Footer -->
    <footer
      :class="isDark ? 'bg-dark-surface border-dark-border text-white/30' : 'bg-white border-stone-200 text-stone-400'"
      class="border-t px-5 py-2 text-xs shrink-0 text-center">
      This is a hobby project by <a href="https://keshiarose.com" target="_blank" rel="noopener"
        class="underline hover:text-coral">Keshia Rose</a>. I'm not associated with the <a
        href="https://westseattleblog.com/wsgaragesaledaymap/" target="_blank" rel="noopener"
        class="underline hover:text-coral">West Seattle Garage Sale Day</a>

      organizers.
    </footer>

  </div>
</template>
