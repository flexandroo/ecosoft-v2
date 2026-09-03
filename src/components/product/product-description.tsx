import {
  Check,
  Droplets,
  Info,
  PackageCheck,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DescriptionContent =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

type DescriptionSection = {
  title: string;
  content: DescriptionContent[];
};

const HEADING_PATTERN = new RegExp(
  [
    "^\\d+\\s+(?:основн|головн).*(?:переваг|етап)",
    "^(?:основні|головні)\\s+переваги",
    "^результати\\s+(?:використання|застосування)",
    "^користувачі$",
    "^головне\\s+про",
    "^особливості\\s+моделі",
    "^технологія\\s+очищення",
    "^додаткова\\s+мінералізація",
    "^інженерні\\s+рішення",
    "^що\\s+входить",
    "^як\\s+.*(?:працює|очищає)",
    "^які\\s+.*(?:особливості|зміни)",
    "^чому\\s+",
    "ідеальне\\s+рішення",
  ].join("|"),
  "iu",
);

const LIST_SECTION_PATTERN =
  /переваг|результат|користувач|підходить|рекоменду|комплект|набір|зміниться|зміни відбудуться|гарантує|скоротяться|етап|це:?$/iu;

const BULLET_PATTERN = /^(?:[✓✔•●▪◦]|[-–—])\s*/u;

function cleanHeading(value: string) {
  return value.replace(/\s*:\s*$/u, "").trim();
}

function isHeading(block: string, index: number, blockCount: number) {
  const value = block.trim();

  if (!value || value.includes("\n") || value.length > 120) return false;
  if (BULLET_PATTERN.test(value) || /^[*]/u.test(value)) return false;
  if (HEADING_PATTERN.test(value)) return true;
  if (/[?:]$/u.test(value)) return true;

  const letters = value.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/gu, "");
  const isUppercase = letters.length >= 6 && letters === letters.toUpperCase();
  if (isUppercase) return true;

  return (
    index === 0 &&
    blockCount > 1 &&
    value.length <= 72 &&
    !/[.!;,]$/u.test(value)
  );
}

function stripBullet(value: string) {
  return value.replace(BULLET_PATTERN, "").trim();
}

function looksLikeListItem(value: string, listSection: boolean) {
  const text = value.trim();
  if (!text) return false;
  if (BULLET_PATTERN.test(text)) return true;

  return (
    listSection &&
    text.length <= 240 &&
    text.split(/[.!?]+/u).filter(Boolean).length <= 2
  );
}

function parseContent(blocks: string[], title: string): DescriptionContent[] {
  const content: DescriptionContent[] = [];
  const listSection = LIST_SECTION_PATTERN.test(title);
  let pendingItems: string[] = [];

  const flushList = () => {
    if (pendingItems.length > 0) {
      content.push({ type: "list", items: pendingItems });
      pendingItems = [];
    }
  };

  for (const block of blocks) {
    const lines = block
      .split(/\n+/u)
      .map((line) => line.trim())
      .filter(Boolean);
    const explicitList = lines.some((line) => BULLET_PATTERN.test(line));
    const compactLines =
      lines.length > 1 && lines.every((line) => line.length <= 240);

    if (
      explicitList ||
      compactLines ||
      (lines.length === 1 && looksLikeListItem(lines[0], listSection))
    ) {
      pendingItems.push(...lines.map(stripBullet).filter(Boolean));
      continue;
    }

    flushList();
    content.push({ type: "paragraph", text: lines.join(" ") });
  }

  flushList();
  return content;
}

function parseDescription(text: string): DescriptionSection[] {
  const blocks = text
    .replace(/\r\n?/gu, "\n")
    .split(/\n\s*\n/gu)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return [];

  const rawSections: { title: string; blocks: string[] }[] = [];
  let current = { title: "Про товар", blocks: [] as string[] };

  blocks.forEach((block, index) => {
    if (isHeading(block, index, blocks.length)) {
      if (current.blocks.length > 0) rawSections.push(current);
      current = { title: cleanHeading(block), blocks: [] };
      return;
    }

    current.blocks.push(block);
  });

  if (current.blocks.length > 0) rawSections.push(current);

  // A heading at the very end is still useful context, but needs visible content.
  if (rawSections.length === 0) {
    return [
      {
        title: "Про товар",
        content: [{ type: "paragraph", text: blocks.join(" ") }],
      },
    ];
  }

  return rawSections.map((section) => ({
    title: section.title,
    content: parseContent(section.blocks, section.title),
  }));
}

function iconForSection(title: string): LucideIcon {
  if (/переваг|результат|змін/iu.test(title)) return Sparkles;
  if (/користувач|підходить|рекоменду/iu.test(title)) return Users;
  if (/комплект|набір|короб/iu.test(title)) return PackageCheck;
  if (/технолог|працює|очищ|етап/iu.test(title)) return Settings2;
  if (/монтаж|обслугов|заміна|сервіс/iu.test(title)) return Wrench;
  if (/захист|безпек|гарант/iu.test(title)) return ShieldCheck;
  if (/вода|мінералізац/iu.test(title)) return Droplets;
  return Info;
}

export function ProductDescription({ text }: { text: string }) {
  const sections = parseDescription(text);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="divide-y divide-border">
        {sections.map((section, sectionIndex) => {
          const Icon = iconForSection(section.title);

          return (
            <section
              key={`${section.title}-${sectionIndex}`}
              className="px-5 py-6 md:px-8 md:py-8"
            >
              <div className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-[1.125rem]" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                  {section.title}
                </h3>
              </div>

              <div className="mt-4 min-w-0 max-w-[72ch] space-y-4 sm:pl-[3.375rem]">
                {section.content.map((item, contentIndex) =>
                  item.type === "paragraph" ? (
                    <p
                      key={contentIndex}
                      className={`leading-7 text-foreground/80 ${
                        sectionIndex === 0 && contentIndex === 0
                          ? "text-base md:text-[1.0625rem]"
                          : "text-[0.9375rem] md:text-base"
                      }`}
                    >
                      {item.text}
                    </p>
                  ) : (
                    <ul
                      key={contentIndex}
                      className="grid gap-x-8 gap-y-3 sm:grid-cols-2"
                    >
                      {item.items.map((listItem, itemIndex) => (
                        <li
                          key={`${listItem}-${itemIndex}`}
                          className="flex items-start gap-2.5 text-[0.9375rem] leading-6 text-foreground/85"
                        >
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                            <Check className="size-3" aria-hidden="true" />
                          </span>
                          <span>{listItem}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
