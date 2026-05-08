import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const listings = JSON.parse(readFileSync(join(__dirname, "listings.json"), "utf-8"));

// Stopwords not useful for categorization
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "this",
  "that",
  "these",
  "those",
  "we",
  "us",
  "our",
  "i",
  "my",
  "you",
  "your",
  "they",
  "their",
  "it",
  "its",
  "not",
  "no",
  "so",
  "if",
  "as",
  "up",
  "out",
  "more",
  "some",
  "any",
  "all",
  "also",
  "just",
  "than",
  "then",
  "there",
  "here",
  "come",
  "get",
  "go",
  "sale",
  "garage",
  "saturday",
  "sunday",
  "friday",
  "am",
  "pm",
  "open",
  "will",
  "including",
  "available",
  "items",
  "item",
  "much",
  "many",
  "lot",
  "lots",
  "great",
  "good",
  "nice",
  "new",
  "like",
  "well",
  "other",
  "plus",
  "etc",
  "we",
  "price",
  "prices",
  "priced",
  "sell",
  "selling",
  "family",
  "multi",
  "house",
  "home",
  "yard",
]);

function normalize(word) {
  return word
    .normalize("NFD") // decompose accented chars (é → e + ́)
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // strip punctuation
}

const freq = {};

for (const { description } of listings) {
  if (!description) continue;
  const words = description.split(/[\s,;:!?()\[\]\/\\|]+/);
  for (const raw of words) {
    const word = normalize(raw);
    if (word.length < 3) continue;
    if (STOPWORDS.has(word)) continue;
    freq[word] = (freq[word] ?? 0) + 1;
  }
}

const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const lines = sorted.map(([word, count]) => `${String(count).padStart(4)}  ${word}`);
const out = lines.join("\n");

writeFileSync(join(__dirname, "word-freq.txt"), out, "utf-8");
console.log(`${sorted.length} unique words across ${listings.length} listings`);
console.log("\nTop 50:");
lines.slice(0, 50).forEach((l) => console.log(l));
