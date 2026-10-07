// Report inconsistent product characteristics: the same property under several
// names, mixed units and products without characteristics.
//
//   node scripts/audit-specs.mjs            # bundled catalogue (src/lib/products.ts)
//   node --env-file=.env.local scripts/audit-specs.mjs   # live database, read-only
//
// The storefront already unifies how values look (src/lib/spec-format.ts);
// this report lists what has to be fixed in the data itself.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

async function loadProducts() {
  if (SUPABASE_URL && KEY) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=sku,name,category,details&is_hidden=eq.false`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) throw new Error(`Supabase: HTTP ${res.status}`);
    console.log(`Source: database ${SUPABASE_URL}\n`);
    return res.json();
  }
  const { PRODUCTS } = await import("../src/lib/products.ts");
  console.log("Source: bundled src/lib/products.ts\n");
  return PRODUCTS;
}

/** Name without unit/qualifiers, used to group spellings of one property. */
function baseName(label) {
  return label
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/,.*$/, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\b(робоча|робочий|номінальна|максимальна|вміст)\b/g, "")
    .replace(/[^a-zа-яіїєґ0-9 ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unitOf(label, value) {
  const fromLabel = label.match(/,\s*([^,]+)$/)?.[1];
  const fromValue = String(value).match(/[a-zа-яіїєґ°³/]+(?:\/[a-zа-яіїєґ]+)?\s*$/i)?.[0];
  return (fromLabel ?? fromValue ?? "—").trim();
}

const products = await loadProducts();
const groups = new Map();
const withoutSpecs = [];

for (const p of products) {
  const specs = p.details?.specs ?? [];
  if (!specs.length) withoutSpecs.push(`${p.sku ?? "?"}  ${p.name}`);
  for (const s of specs) {
    const key = baseName(s.label);
    if (!key) continue;
    const g = groups.get(key) ?? { labels: new Map(), units: new Map(), count: 0 };
    g.count += 1;
    g.labels.set(s.label, (g.labels.get(s.label) ?? 0) + 1);
    // Units only make sense for numeric values ("1,5 л/хв"), not for text such as "Квартира, дача".
    if (/\d/.test(String(s.value))) {
      const unit = unitOf(s.label, s.value);
      g.units.set(unit, (g.units.get(unit) ?? 0) + 1);
    }
    groups.set(key, g);
  }
}

const distinctLabels = new Set(products.flatMap((p) => (p.details?.specs ?? []).map((s) => s.label)));
console.log(`Products: ${products.length}, distinct characteristic names: ${distinctLabels.size}\n`);

console.log("== One property, several names or units ==");
const messy = [...groups.entries()]
  .filter(([, g]) => g.labels.size > 1 || g.units.size > 1)
  .sort((a, b) => b[1].count - a[1].count);
for (const [key, g] of messy) {
  console.log(`\n«${key}» — ${g.count} rows`);
  for (const [label, n] of g.labels) console.log(`   name: ${label}  ×${n}`);
  if (g.units.size > 1) console.log(`   units: ${[...g.units].map(([u, n]) => `${u} ×${n}`).join(", ")}`);
}

console.log(`\n== Products without characteristics: ${withoutSpecs.length} ==`);
for (const line of withoutSpecs) console.log(`   ${line}`);
