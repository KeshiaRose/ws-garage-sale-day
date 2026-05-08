# Unofficial West Seattle Garage Sale Day Map

An unofficial companion map for [West Seattle Garage Sale Day](https://westseattleblog.com/wsgaragesaledaymap/) happening on Saturday, May 9, 2026. Search and filter hundreds of listings, save your favorites, and plan your route.

> **Not the official map.** This is a hobby project and is not affiliated with the West Seattle Blog or the West Seattle Garage Sale Day organizers in any way.

## Running locally

```bash
npm install
npm run dev
```

### Generating listing data

The raw listing data lives in `src/data/listings.json` (fetched from the ZeeMaps API).

The map loads processed and tagged listing data from `src/data/tagged-listings.json`.

```bash
# Fetch the latest listing data and descriptions
node src/data/fetch-listings.js

# Process the listing data and write src/data/tagged-listings.json
node src/data/process-listings.js

# Analyze word frequencies across descriptions (this was a one-time script to inform tag rules)
node src/data/word-freq.js
```

## Contributing

If you see any mistakes or have suggestions, please open an issue or submit a pull request.
