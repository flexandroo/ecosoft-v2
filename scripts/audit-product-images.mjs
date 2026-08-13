import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../src/lib/products.ts", import.meta.url), "utf8");
const urls = [
  ...new Set(
    [...source.matchAll(/https:\/\/[^\"\s]+\.(?:avif|gif|jpe?g|png|webp)(?:\?[^\"\s]*)?/gi)].map(
      (match) => match[0],
    ),
  ),
];

let next = 0;
let issues = 0;
async function worker() {
  while (next < urls.length) {
    const url = urls[next++];
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.toLowerCase().startsWith("image/")) {
        issues += 1;
        console.log(`${response.status}\t${contentType}\t${url}`);
      }
      await response.body?.cancel();
    } catch (error) {
      issues += 1;
      console.log(`ERR\t${url}\t${error instanceof Error ? error.message : error}`);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
if (issues > 0) process.exitCode = 1;
