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

### Tag overrides

Automatic tag detection isn't perfect. `src/data/tag-overrides.json` lets you manually add or remove tags for specific listings, keyed by sale number:

```json
{
  "42": { "remove": ["Miscellaneous"], "add": ["Vintage & Antiques"] },
  "107": { "remove": ["Clothing"] }
}
```

Overrides are applied at runtime in the app. When running locally, navigate to `/admin.html` for a visual interface to manage overrides without editing JSON by hand. Changes save directly to `tag-overrides.json`. The admin page is only available in dev it is not included in the production build. If you make changes, create a pull request to see them updated on the live site.

## Contributing

If you see any mistakes or have suggestions, please open an issue or submit a pull request.
