import { readFileSync, writeFileSync } from "fs";

const IN_PATH = new URL("./listings.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const OUT_PATH = new URL("./tagged-listings.json", import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  "$1"
);

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
    tag: "For a Cause",
    re: /\b(nonprofits?|non-?profits?|fundraisers?|fundraising|charity|charities|benefiting|benefit\s+sale|proceeds|proceeds\s+(go\s+to|benefit|support|donated?|will\s+go)|501\s*c\s*3|pta\b|pto\b|school\s+fundraiser)\b/i,
  },
  {
    tag: "Open Sunday",
    re: /\b(sundays?|open\s+sunday|sat\.?\s*[&\/]\s*sun\.?|saturday\s+and\s+sunday|both\s+days?|sunday\s+only|sunday\s+too|weekend\s+sale)\b/i,
  },
  {
    tag: "Miscellaneous",
    re: /\b(miscellaneous|misc\b|variety|eclectic|assorted|random|something\s+for\s+everyone|all\s+kinds|downsizing|downsize|moving\s+sale|cleanout|clear\s?out|clearing\b|purge|everything\s+must\s+go|lots\s+to\s+discover|everything\b|mix\b|vendors?|goods\b|junk\b|cohousing|pop.?up|block\s+sale|personal\s+items?)\b/i,
  },
];

const CANCELED_RE = /\bcanceled\b/i;

const CANCELED_SALES = new Set([43, 51, 52, 174, 326, 349, 477, 546, 595]);

const listings = JSON.parse(readFileSync(IN_PATH, "utf-8"));

let taggedCount = 0;
const processed = listings.map((listing) => {
  const desc = listing.description ?? "";
  const canceled = CANCELED_RE.test(desc) || CANCELED_SALES.has(listing.saleNumber);
  const tags = canceled ? [] : TAG_RULES.filter(({ re }) => re.test(desc)).map(({ tag }) => tag);
  if (!canceled && desc && tags.length === 0) tags.push("Miscellaneous");
  if (!canceled && tags.length > 0) taggedCount++;
  return {
    id: listing.id,
    saleNumber: listing.saleNumber,
    address: listing.s,
    fullAddress: listing.a,
    zipCode: listing.zip,
    lat: listing.lat,
    lng: listing.lng,
    description: canceled ? "" : desc,
    canceled,
    tags,
  };
});

writeFileSync(OUT_PATH, JSON.stringify(processed, null, 2), "utf-8");

const active = processed.filter((l) => !l.canceled);
const canceled = processed.filter((l) => l.canceled);

const freq = {};
for (const { tags } of active) {
  for (const t of tags) freq[t] = (freq[t] ?? 0) + 1;
}
const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

console.log(`${active.length} active listings, ${canceled.length} canceled\n`);
console.log(`Tagged ${taggedCount}/${active.length} active listings\n`);
console.log("Tag breakdown:");
for (const [tag, count] of sorted) {
  console.log(`  ${tag.padEnd(24)} ${count}`);
}

const untagged = active.filter((l) => l.tags.length === 0);
if (untagged.length > 0) {
  console.log(`\nUntagged active listings (${untagged.length}):`);
  for (const l of untagged) {
    console.log(
      `  #${String(l.saleNumber).padStart(3, "0")}  ${l.description || "(no description)"}`
    );
  }
}
