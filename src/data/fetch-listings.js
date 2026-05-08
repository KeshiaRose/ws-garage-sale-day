import { writeFileSync, existsSync, readFileSync } from "fs";

const OUT_PATH = new URL("./listings.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

async function fetchSalesList() {
  console.log("Fetching sales list...");
  const res = await fetch("https://www.zeemaps.com/emarkers?g=7045507&k=REGULAR&e=true");
  if (!res.ok) throw new Error(`Sales list fetch failed: ${res.status}`);
  const salesList = await res.json();
  console.log(`Found ${salesList.length} sales`);
  return salesList;
}

async function fetchDetail(id) {
  const url = `https://www.zeemaps.com/etext?g=7045507&j=1&eids=[${id}]&emb=1&g=7045507`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Detail sale fetch failed: ${res.status} for id ${id}`);
  const details = await res.json();
  return details;
}

function parseSaleNumber(nm) {
  const m = nm?.match(/Sale\s+0*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function extractDescription(detail) {
  const fields = detail?.fields ?? {};
  const values = Object.values(fields);
  return values[0] ?? "";
}

async function main() {
  const salesList = await fetchSalesList();

  let existingListings = [];
  if (existsSync(OUT_PATH)) {
    existingListings = JSON.parse(readFileSync(OUT_PATH, "utf-8"));
  }

  const remainingListings = salesList.filter((s) => !existingListings.some((l) => l.id === s.id));
  console.log(
    `\nFetching descriptions for ${remainingListings.length}/${salesList.length} sales (${
      salesList.length - remainingListings.length
    } already fetched)...`
  );

  const BATCH_DELAY_MS = 300;
  const BATCH_SIZE = 10;

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  for (let batchStart = 0; batchStart < remainingListings.length; batchStart += BATCH_SIZE) {
    const batch = remainingListings.slice(batchStart, batchStart + BATCH_SIZE);

    const batchPromises = batch.map(async (listing) => {
      const { id, nm } = listing;
      try {
        const details = await fetchDetail(id);
        const description = extractDescription(details);
        const saleNumber = parseSaleNumber(nm);
        return { ...listing, description, saleNumber };
      } catch (err) {
        console.error(`Fetching details for sale ${id} failed: ${err.message}`);
        return { ...listing };
      }
    });

    const results = await Promise.all(batchPromises);

    for (const result of results) {
      if (result) {
        existingListings.push(result);
      }
    }

    console.log(
      `Processed ${Math.min(batchStart + BATCH_SIZE, remainingListings.length)} of ${
        remainingListings.length
      }`
    );

    if (batchStart + BATCH_SIZE < remainingListings.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
  writeFileSync(OUT_PATH, JSON.stringify(existingListings, null, 2), "utf-8");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
