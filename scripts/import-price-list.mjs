// Import retail USD prices (РРЦ) from an Ecosoft franchise price list (.xlsx).
//
//   node --env-file=.env.local scripts/import-price-list.mjs "Price Ecosoft ... .xlsx"          # dry run: show changes
//   node --env-file=.env.local scripts/import-price-list.mjs "Price Ecosoft ... .xlsx" --apply  # write price_usd
//
// Needs NEXT_PUBLIC_SUPABASE_URL and, for --apply, SUPABASE_SECRET_KEY. Only
// products.price_usd is written; the database turns it into the UAH price at
// the current NBU rate (trigger) and refreshes the rate twice a day (pg_cron).
// Filter media are listed per litre/kg: the price is multiplied by the bag size
// from the product name ("… 25 л"). Products missing from the list are untouched.

import fs from "node:fs";
import zlib from "node:zlib";

const [file, flag] = process.argv.slice(2);
const apply = flag === "--apply";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const key = apply ? process.env.SUPABASE_SECRET_KEY : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!file || !url || !key) {
  console.error("usage: node --env-file=.env.local scripts/import-price-list.mjs <price.xlsx> [--apply]");
  console.error("needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_SECRET_KEY with --apply)");
  process.exit(1);
}

// ---- Minimal .xlsx (zip) reader ------------------------------------------------
function unzip(buffer) {
  const files = new Map();
  let eocd = buffer.length - 22;
  while (eocd >= 0 && buffer.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip/xlsx file");
  const count = buffer.readUInt16LE(eocd + 10);
  let p = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buffer.readUInt16LE(p + 10);
    const size = buffer.readUInt32LE(p + 20);
    const nameLen = buffer.readUInt16LE(p + 28);
    const extraLen = buffer.readUInt16LE(p + 30);
    const commentLen = buffer.readUInt16LE(p + 32);
    const local = buffer.readUInt32LE(p + 42);
    const name = buffer.toString("utf8", p + 46, p + 46 + nameLen);
    const dataStart = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(dataStart, dataStart + size);
    if (name.endsWith(".xml") || name.endsWith(".rels")) {
      files.set(name, (method === 8 ? zlib.inflateRawSync(raw) : raw).toString("utf8"));
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const colIndex = (ref) => [...ref.replace(/\d+/g, "")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

function readSheets(files) {
  const shared = [...(files.get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    decode([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")),
  );
  const rels = files.get("xl/_rels/workbook.xml.rels");
  const target = Object.fromEntries([...rels.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2]]));
  return [...files.get("xl/workbook.xml").matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => {
    const xml = files.get("xl/" + target[m[2]].replace(/^\/?xl\//, ""));
    const rows = [...xml.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)].map((r) => {
      const cells = [];
      for (const c of r[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = c[1].match(/r="([A-Z]+\d+)"/)?.[1];
        const type = c[1].match(/t="([^"]+)"/)?.[1];
        const v = c[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        const inline = c[2]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
        let value = v ?? (inline != null ? decode(inline) : undefined);
        if (type === "s" && v != null) value = shared[Number(v)];
        if (ref && value !== undefined) cells[colIndex(ref)] = String(value).trim();
      }
      return cells;
    });
    return { name: decode(m[1]), rows };
  });
}

// ---- Price list → { model: { usd, perUnit, bag } } ---------------------------------
const number = (v) => {
  const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const list = {};
for (const sheet of readSheets(unzip(fs.readFileSync(file)))) {
  let header = null;
  let lastPrice = null;
  for (const cells of sheet.rows) {
    const model = cells.findIndex((c) => c === "Модель");
    const rrp = cells.findIndex((c) => /^РРЦ/.test(c ?? ""));
    if (model >= 0 && rrp >= 0) {
      header = { model, rrp, bag: cells.findIndex((c) => /Мішок/.test(c ?? "")) };
      lastPrice = null;
      continue;
    }
    if (!header || !/^[A-Za-z0-9][A-Za-z0-9._/-]{2,}$/.test(cells[header.model] ?? "")) continue;
    const own = number(cells[header.rrp]);
    // Filter media rows of one material share the per-litre price of the first row.
    const perUnitSheet = header.bag >= 0;
    if (own) lastPrice = own;
    const price = own ?? (perUnitSheet ? lastPrice : null);
    if (price) list[cells[header.model]] = { usd: price, perUnit: perUnitSheet, bag: perUnitSheet ? number(cells[header.bag]) : null };
  }
}

// ---- Compare with the catalogue --------------------------------------------------
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const res = await fetch(`${url}/rest/v1/products?select=sku,name,price,price_usd&order=sku`, { headers });
if (!res.ok) throw new Error(`products: HTTP ${res.status}`);
const products = await res.json();

const changes = [];
const missing = [];
for (const p of products) {
  const item = list[p.sku];
  if (!item) {
    missing.push(p);
    continue;
  }
  let usd = item.usd;
  if (item.perUnit) {
    const qty = number(p.name.match(/(\d+(?:[.,]\d+)?)\s*(?:кг|л)(?![а-яіїєґa-z])/i)?.[1]) ?? item.bag;
    usd = Math.round(item.usd * qty * 100) / 100;
  }
  if (Number(p.price_usd) !== usd) changes.push({ sku: p.sku, name: p.name, from: p.price_usd, to: usd });
}

console.log(`Price list: ${Object.keys(list).length} models. Catalogue: ${products.length} products, ${products.length - missing.length} found in the list.`);
console.log(`\nUSD price changes: ${changes.length}`);
for (const c of changes) console.log(`  ${c.sku.padEnd(20)} ${String(c.from ?? "—").padStart(9)} → ${String(c.to).padStart(9)}  ${c.name.slice(0, 60)}`);
console.log(`\nNot in the price list (left as is): ${missing.length}`);
for (const p of missing) console.log(`  ${p.sku.padEnd(20)} $${p.price_usd ?? "—"}  ${p.name.slice(0, 60)}`);

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write these prices.");
  process.exit(0);
}
for (const c of changes) {
  const r = await fetch(`${url}/rest/v1/products?sku=eq.${encodeURIComponent(c.sku)}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ price_usd: c.to }),
  });
  if (!r.ok) console.error(`  ${c.sku}: HTTP ${r.status} ${await r.text()}`);
}
console.log(`\nApplied ${changes.length} changes. UAH prices follow the current NBU rate; the site updates within 5 minutes.`);
