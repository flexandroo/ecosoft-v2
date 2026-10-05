// Blog articles and case studies: types and the light text format used in the
// admin editor. Safe to import from client components.

export type PostKind = "article" | "case";

export const POST_KINDS: { id: PostKind; label: string; plural: string }[] = [
  { id: "article", label: "Стаття", plural: "Статті" },
  { id: "case", label: "Кейс", plural: "Кейси" },
];

export type Post = {
  slug: string;
  kind: PostKind;
  title: string;
  excerpt: string;
  /** Text in the editor format, see parsePostBody. */
  body: string;
  coverImage: string | null;
  /** Case photos. */
  gallery: string[];
  /** Case object, e.g. "Приватний будинок, Бровари". */
  location: string;
  relatedHref: string;
  relatedLabel: string;
  seoTitle: string;
  metaDescription: string;
  publishedAt: string;
  updatedAt: string;
};

/** Admin status badge: draft, scheduled (publication time ahead) or published. */
export function postStatus(post: { is_published: boolean; published_at: string }) {
  if (!post.is_published) return { label: "Чернетка", tone: "bg-muted text-muted-foreground" };
  if (new Date(post.published_at).getTime() > Date.now()) return { label: "Заплановано", tone: "bg-amber-100 text-amber-900" };
  return { label: "Опубліковано", tone: "bg-emerald-100 text-emerald-800" };
}

export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

/**
 * Editor format: blocks are separated by an empty line; a block starting with
 * "## " is a subheading, a block whose lines start with "- " is a list,
 * anything else is a paragraph.
 */
export function parsePostBody(body: string): PostBlock[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block): PostBlock => {
      if (block.startsWith("## ")) return { type: "h2", text: block.slice(3).trim() };
      const lines = block.split("\n").map((l) => l.trim());
      if (lines.every((l) => /^[-•]\s+/.test(l))) return { type: "ul", items: lines.map((l) => l.replace(/^[-•]\s+/, "")) };
      return { type: "p", text: lines.join(" ") };
    });
}

/** Ukrainian title → URL segment ("Як вибрати фільтр" → "yak-vybraty-filtr"). */
export function slugify(title: string, max = 80): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i",
    й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh",
    ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "ʼ": "", "’": "",
  };
  const latin = [...title.toLowerCase()].map((ch) => map[ch] ?? ch).join("");
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/, "");
}
