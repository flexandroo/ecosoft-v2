import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../src/lib/products.ts", import.meta.url), "utf8");
const urls = [
  ...new Set(
    [...source.matchAll(/"href":\s*"(https?:[^\"]+\.pdf[^\"]*)"/gi)].map(
      (match) => match[1],
    ),
  ),
];

let issues = 0;
for (const url of urls) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/pdf,*/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().includes("pdf")) {
      issues += 1;
      console.log(`${response.status}\t${contentType}\t${url}`);
    }
    await response.body?.cancel();
  } catch (error) {
    issues += 1;
    console.log(`ERR\t${url}\t${error instanceof Error ? error.message : error}`);
  }
}

if (issues > 0) process.exitCode = 1;
