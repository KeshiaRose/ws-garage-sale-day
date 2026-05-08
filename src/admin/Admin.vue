<script setup>
import { ref, computed, onMounted } from 'vue'
import allListings from '../data/tagged-listings.json'

const TAG_RULES = [
  {
    tag: "Clothing",
    re: /\b(clothes|clothing|apparel|shirts?|t-?shirts?|tshirts?|jackets?|coats?|dresses?|pants|jeans|hats?|sweaters?|outfits?|womens?|mens?|leggings|scarves|skirts|suits|attire|workwear|denim|tees?|tshirts?)\b/i,
  },
  {
    tag: "Women's Clothing",
    re: /\b(womens?|ladies|womenswear|blouses?|lingerie|maternity)\b/i,
  },
  {
    tag: "Men's Clothing",
    re: /\b(mens?|menswear|guys?\s+clothes|gentlemens?)\b/i,
  },
  {
    tag: "Shoes & Footwear",
    re: /\b(shoes?|sneakers?|boots?|sandals?|heels?|loafers?|footwear|cleats?|slippers?)\b/i,
  },
  {
    tag: "Furniture",
    re: /\b(furniture|furnishings?|couches?|sofas?|chairs?|tables?|desks?|dressers?|bookcases?|bookshelves|bookshelf|cabinets?|shelves|shelf|shelving|armoires?|nightstand|ottoman|recliner|sectional|benches?|credenza)\b/i,
  },
  {
    tag: "Kids & Baby",
    re: /\b(kids?|baby|babies|toddlers?|infants?|children|childrens?|strollers?|cribs?|boys?|girls?|youth|preschool|newborn|kiddos)\b/i,
  },
  {
    tag: "Toys & Games",
    re: /\b(toys?|games?|puzzles?|legos?|pokemon|nintendo|xbox|playstation|board\s?game|video\s?game|dolls?|dollhouse|stuffed|playsets?|nerf|transformers|minecraft|tabletop|gaming|figurines?|squishmallows?|barbie|barbies?|trading\s?cards?)\b/i,
  },
  {
    tag: "Books",
    re: /\b(books?|novels?|magazines?|textbooks?|comics?|cookbooks?|nonfiction|paperback|hardcover)\b/i,
  },
  {
    tag: "Plants & Garden",
    re: /\b(plants?|garden|gardening|houseplants?|seedlings?|succulents?|cactus|terrariums?|propagation|planters?|perennials?|herbs?|shrubs?|natives?|flowers?|trees?|seeds?|cuttings?|soil|botanical|pots?)\b/i,
  },
  {
    tag: "Art & Crafts",
    re: /\b(art\b|arts\b|artwork|paintings?|prints?|ceramics?|pottery|canvases?|sketchbooks?|crafts?|crafting|handmade|hand.?turned|artisan|watercolor|sewing|fabrics?|yarn|quilting|quilts?|letterpress|crochet|textiles?|collages?)\b/i,
  },
  {
    tag: "Vintage & Antiques",
    re: /\b(vintage|antiques?|retro|mid-?century|mcm|ephemera|relics|artifacts?)\b/i,
  },
  {
    tag: "Electronics",
    re: /\b(electronics?|computers?|laptops?|tablets?|phones?|tvs?|television|stereo|audio|speakers?|cameras?|printers?|monitors?|consoles?|chargers?|cables?|drone|ipad|gadgets?|gpu|ps[345]|wii|dvds?|vhs)\b/i,
  },
  {
    tag: "Music & Records",
    re: /\b(records?|vinyl|cds?|music|guitars?|drums?|piano|instruments?|cassettes?|tapes?|amplifiers?|amps?|saxophone|musical|lps?)\b/i,
  },
  {
    tag: "Tools",
    re: /\b(tools?|hardware|drills?|saws?|woodworking|workshop|carpentry|chainsaw|lawn\s?mower|mowers?|trimmer|rototiller|dewalt|ryobi|makita|stihl|husqvarna|building\s+materials?)\b/i,
  },
  {
    tag: "Kitchen & Dining",
    re: /\b(kitchen|kitchenware|cooking|cookware|appliances?|dishes|plates?|glassware|pots?|pans?|utensils?|dining|bakeware|mixer|blender|microwave|espresso|cuisinart|pyrex|cast\s?iron|kitchenaid|crockpot|instant\s?pot|cookbooks?|drinkware)\b/i,
  },
  {
    tag: "Sports & Outdoors",
    re: /\b(sports?|sporting|outdoors?|camping|bikes?|bicycles?|kayaks?|skis?|skiing|snowboards?|golf|tennis|yoga|exercise|fitness|running|rowing|rower|longboard|skateboards?|climbing|hiking|fishing|baseball|soccer|softball|pickleball|weights|kettlebells|elliptical|treadmill|peloton|scooters?|paddleboard|snorkel|scuba|ebikes?)\b/i,
  },
  {
    tag: "Home Goods",
    re: /\b(decor|lamps?|rugs?|mirrors?|lighting|linens?|pillows?|candles?|vases?|frames?|framed|ornaments?|blankets?|bedding|curtains?|drapes?|home\s?goods|household\s?goods|housewares?|house\s?wares?|household\s?items?)\b/i,
  },
  {
    tag: "Jewelry & Accessories",
    re: /\b(jewel\w*|necklaces?|bracelets?|earrings?|bags?|purses?|handbags?|accessories|watches?|sunglasses|scarves?|beads?|gemstones?)\b/i,
  },
  {
    tag: "Food & Treats",
    re: /\b(lemonade|treats?|baked?\s?goods?|homemade\s+food|refreshments?|snacks?|cookies?|pastries?|bakery|edibles?|sourdough|produce|vegetables?|veggies?|fruits?|musubi|pupusas?|popsicles?)\b/i,
  },
  {
    tag: "Pet Supplies",
    re: /\b(dogs?|cats?|pets?|animals?|kennels?|crates?|leash|aquarium|fish\s?tank|bird|guinea\s?pig)\b/i,
  },
  {
    tag: "Free / PWYW",
    re: /\bfree\b|pay.?what.?you.?wish|PWYW|name.?your.?price/i,
  },
  {
    tag: "Movies & Entertainment",
    re: /\b(dvds?|blu.?rays?|blurays?|vhs\b|movies?|films?|cinema|entertainment\b|streaming\b|roku\b|firestick|video\s?games?|nintendo\b|playstation\b|xbox\b|ps[2345]\b|wii\b|gamecube|game\s?boy|gameboy|sega\b|atari\b|game\s+cartridges?|game\s+discs?|switch\s+game|game\s+cases?|posters?\b|scifi\b|sci.?fi\b)\b/i,
  },
  {
    tag: "Appliances",
    re: /\b(grills?|bbq\b|barbecue|pellet\s+grill|smokers?\b|washer\b|dryers?\b|refrigerator|fridge\b|dishwasher|toasters?|air\s?fryer|coffee\s?maker|keurig|nespresso|vacuums?\b|vacuum\s+cleaner|shop.?vac|dehumidifier|humidifier|space\s+heater|air\s+purifier|rice\s+cooker|chest\s+freezer|stand\s+mixer|stoves?\b|griddle\b|juicers?\b|generators?\b|air\s+conditioner)\b/i,
  },
  {
    tag: "Holiday & Seasonal",
    re: /\b(christmas|halloween|easter|thanksgiving|xmas\b|wreaths?\b|garlands?\b|nativity|menorah|advent\b|trick.?or.?treat|christmas\s+tree|holiday\s+decor|holiday\s+items?|seasonal\s+decor|ornaments?\b|pumpkins?\b|spooky\b|skeletons?\b)\b/i,
  },
  {
    tag: "Cycling",
    re: /\b(bikes?\b|bicycles?\b|cycling\b|biking\b|e.?bikes?\b|mountain\s+bikes?\b|road\s+bikes?\b|bmx\b|gravel\s+bikes?\b|bike\s+rack|bike\s+parts?|bike\s+accessories|bike\s+lock|bike\s+helmet|bike\s+trailer|bike\s+seat|cycle\s+gear|schwinn\b|woom\b|mongoose\b)\b/i,
  },
  {
    tag: "Office & School",
    re: /\b(office\s+supplies?|school\s+supplies?|backpacks?\b|binders?\b|filing\s+cabinet|filing\b|office\s+chair|whiteboard|calculators?\b|staplers?\b|planners?\b|three.?ring|art\s+supplies?|school\s+books?|textbooks?|homeschool\b)\b/i,
  },
  {
    tag: "Collectibles",
    re: /\b(collectibles?|collectables?|collectors?|memorabilia|trading\s+cards?|pokemon\s+cards?|sports\s+cards?|baseball\s+cards?|basketball\s+cards?|football\s+cards?|magic\s+the\s+gathering|mtg\b|funko|funko\s+pop|action\s+figures?|die.?cast|hot\s+wheels|matchbox\b|coins?\b|stamps?\b|comic\s+books?|comics?\b|signed\b|autographed?|limited\s+edition|first\s+edition|rookie\s+card|bobbleheads?\b|tcgs?\b|memorabilia\b)\b/i,
  },
  {
    tag: "Automotive",
    re: /\b(automotive|auto\s+parts?|car\s+parts?|tires?\b|motor\s+oil|jumper\s+cables?|car\s+accessories|dashcam|car\s+stereo|trailers?\b|truck\s+bed|floor\s+mats?\b|car\s+rack|roof\s+rack|tow\s+hitch|oil\s+change|motorcycles?\b|vespa\b|generators?\b)\b/i,
  },
  {
    tag: "Miscellaneous",
    re: /\b(miscellaneous|misc\b|variety|eclectic|assorted|random|something\s+for\s+everyone|all\s+kinds|downsizing|downsize|moving\s+sale|cleanout|clear\s?out|clearing\b|purge|everything\s+must\s+go|lots\s+to\s+discover|everything\b|mix\b|vendors?|goods\b|junk\b|cohousing|pop.?up|block\s+sale|personal\s+items?)\b/i,
  },
];

const ALL_TAGS = TAG_RULES.map(r => r.tag)

const listings = allListings.filter(l => !l.canceled)
const overrides = ref({})
const searchInput = ref('')
const activeTag = ref(null)
const saved = ref(true)
const saving = ref(false)
const addingTagFor = ref(null)

onMounted(async () => {
  const res = await fetch('/api/overrides')
  overrides.value = await res.json()
})

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightDescription(text) {
  if (!text || !activeTag.value) return escapeHtml(text ?? '')
  const rule = TAG_RULES.find(r => r.tag === activeTag.value)
  if (!rule) return escapeHtml(text)
  const re = new RegExp(rule.re.source, rule.re.flags)
  let result = '', lastIndex = 0, match
  while ((match = re.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index))
    result += `<mark style="background:#fef08a;border-radius:2px;padding:0 1px">${escapeHtml(match[0])}</mark>`
    lastIndex = match.index + match[0].length
  }
  result += escapeHtml(text.slice(lastIndex))
  return result
}

const availableTags = computed(() => {
  const tagSet = new Set()
  for (const l of listings) for (const t of effectiveTags(l)) tagSet.add(t)
  return ALL_TAGS.filter(t => tagSet.has(t))
})

const filtered = computed(() => {
  const q = searchInput.value.trim().toLowerCase()
  return listings.filter(l => {
    if (activeTag.value && !effectiveTags(l).includes(activeTag.value)) return false
    if (!q) return true
    return l.address.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      String(l.saleNumber).includes(q)
  })
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

    <!-- Search + filters -->
    <div class="bg-white border-b border-stone-200 px-6 py-3 flex flex-col items-center gap-2">
      <div class="relative max-w-2xl w-full">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input v-model="searchInput" type="text" placeholder="Search by address, description, or sale number…"
          class="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 bg-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-coral" />
      </div>
      <div class="flex flex-wrap justify-center gap-1.5 max-w-2xl w-full">
        <button @click="activeTag = null"
          :class="activeTag === null ? 'bg-navy text-white' : 'bg-peach/40 text-navy hover:bg-peach/70'"
          class="text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer shrink-0">
          All
        </button>
        <button v-for="tag in availableTags" :key="tag" @click="activeTag = activeTag === tag ? null : tag"
          :class="activeTag === tag ? 'bg-coral text-white' : 'bg-peach/40 text-navy hover:bg-peach/70'"
          class="text-xs font-semibold px-3 py-1 rounded-full transition-colors cursor-pointer shrink-0 whitespace-nowrap">
          {{ tag }}
        </button>
      </div>
      <p class="text-stone-400 text-xs text-center">{{ filtered.length }} listings — {{
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
        <p v-if="listing.description" class="text-xs text-stone-500 mb-3 leading-snug"
          v-html="highlightDescription(listing.description)" />

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
