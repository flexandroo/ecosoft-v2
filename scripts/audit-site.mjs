const baseUrl = (process.env.AUDIT_SITE_URL || "https://sofiivkawater.com").replace(/\/+$/, "");

const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, {
  signal: AbortSignal.timeout(20_000),
});
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
  match[1].replace(/&amp;/g, "&"),
);

const failures = [];
const assets = new Set();
let next = 0;
async function worker() {
  while (next < urls.length) {
    const originalUrl = urls[next++];
    const original = new URL(originalUrl);
    const testUrl = `${baseUrl}${original.pathname}${original.search}`;
    try {
      const response = await fetch(testUrl, { signal: AbortSignal.timeout(20_000) });
      const html = await response.text();
      if (response.status !== 200) failures.push(`${response.status} ${original.pathname}`);
      if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`missing title ${original.pathname}`);
      if (!/<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(html)) failures.push(`missing description ${original.pathname}`);
      if ((html.match(/<h1\b/gi) || []).length !== 1) failures.push(`invalid h1 ${original.pathname}`);
      if (!/<link[^>]+rel="canonical"/i.test(html)) failures.push(`missing canonical ${original.pathname}`);
      if (!/<meta[^>]+property="og:image"/i.test(html)) failures.push(`missing og:image ${original.pathname}`);
      if (!/application\/ld\+json/i.test(html)) failures.push(`missing json-ld ${original.pathname}`);
      for (const match of html.matchAll(/<(?:img|source)[^>]+(?:src|srcset)="(\/[^"\s,]+)/gi)) {
        assets.add(match[1]);
      }
    } catch (error) {
      failures.push(`ERR ${original.pathname}: ${error instanceof Error ? error.message : error}`);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));

for (const asset of assets) {
  const response = await fetch(`${baseUrl}${asset}`, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) failures.push(`asset ${response.status} ${asset}`);
  await response.body?.cancel();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Audited ${urls.length} sitemap pages and ${assets.size} local media URLs: all checks passed.`);
