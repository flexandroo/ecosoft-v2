"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, X } from "lucide-react";
import { POST_KINDS, parsePostBody, slugify, type PostKind } from "@/lib/posts-shared";
import { cn } from "@/lib/utils";
import { deletePost, savePost, type FormState } from "../../../actions";
import { FormMessage, SubmitButton } from "../../form-status";
import { ImageUploadButton } from "../../image-upload";
import { Card, Field, inputClass, textareaClass } from "../../ui";
import { useUnsavedChanges } from "../../use-unsaved-changes";

export type EditablePost = {
  id: string;
  slug: string;
  kind: PostKind;
  title: string;
  excerpt: string;
  body: string;
  cover_image: string | null;
  gallery: string[];
  location: string;
  related_href: string;
  related_label: string;
  seo_title: string;
  meta_description: string;
  is_published: boolean;
  published_at: string;
};

const kyivFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Kyiv",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO timestamp → value for <input type="datetime-local"> in Kyiv time (same on server and browser). */
function toLocalInput(iso: string): string {
  return kyivFormat.format(new Date(iso)).replace(" ", "T");
}

/** Kyiv wall-clock "2026-10-06T10:00" → ISO timestamp. */
function kyivToIso(local: string): string {
  const asUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asUtc)) return "";
  const offset = Date.parse(`${toLocalInput(new Date(asUtc).toISOString())}:00Z`) - asUtc;
  return new Date(asUtc - offset).toISOString();
}

export function PostForm({ post, livePath }: { post: EditablePost; livePath: string | null }) {
  const [state, action] = useActionState<FormState, FormData>(savePost, null);
  const formRef = useRef<HTMLFormElement>(null);
  useUnsavedChanges(formRef, state);
  const [kind, setKind] = useState<PostKind>(post.kind);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [body, setBody] = useState(post.body);
  const [cover, setCover] = useState(post.cover_image ?? "");
  const [gallery, setGallery] = useState<string[]>(post.gallery);
  const [when, setWhen] = useState(() => toLocalInput(post.published_at));
  const [seoTitle, setSeoTitle] = useState(post.seo_title);
  const [metaDescription, setMetaDescription] = useState(post.meta_description);
  const [preview, setPreview] = useState(false);
  const [deleting, startDelete] = useTransition();
  const isCase = kind === "case";
  const publishedAtIso = when ? kyivToIso(when) : "";

  const moveImage = (i: number, delta: -1 | 1) =>
    setGallery((list) => {
      const next = [...list];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      return next;
    });

  return (
    <form ref={formRef} action={action} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <input type="hidden" name="id" value={post.id} />
      <input type="hidden" name="cover_image" value={cover} />
      <input type="hidden" name="gallery" value={JSON.stringify(gallery)} />
      <input type="hidden" name="published_at" value={publishedAtIso} />

      <div className="min-w-0 space-y-5">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <Field label="Тип">
              <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as PostKind)} className={inputClass}>
                {POST_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Заголовок (H1)">
              <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className={inputClass} />
            </Field>
          </div>
          {isCase && (
            <Field label="Обʼєкт" hint="Тип обʼєкта і місто, напр. «Приватний будинок, Бровари». Показується на картці кейсу.">
              <input name="location" defaultValue={post.location} maxLength={120} className={inputClass} />
            </Field>
          )}
          {!isCase && <input type="hidden" name="location" value={post.location} />}
          <Field label="Короткий опис" hint="1–2 речення для картки в блозі і для Google, якщо SEO-опис порожній.">
            <textarea name="excerpt" defaultValue={post.excerpt} rows={2} maxLength={400} className={textareaClass} />
          </Field>
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Текст</h2>
            <div className="flex rounded-lg border p-0.5 text-sm">
              {[
                { on: false, label: "Редагування" },
                { on: true, label: "Перегляд" },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setPreview(t.on)}
                  className={cn("rounded-md px-3 py-1", preview === t.on ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <input type="hidden" name="body" value={body} />
          {preview ? (
            <div className="min-h-64 space-y-3 rounded-lg border p-4 text-[15px] leading-relaxed text-muted-foreground">
              {parsePostBody(body).map((block, i) =>
                block.type === "h2" ? (
                  <h3 key={i} className="pt-2 text-lg font-bold text-foreground">
                    {block.text}
                  </h3>
                ) : block.type === "ul" ? (
                  <ul key={i} className="list-disc space-y-1 pl-5">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{block.text}</p>
                ),
              )}
              {!body.trim() && <p>Текст порожній.</p>}
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              aria-label="Текст запису"
              className={`${textareaClass} font-mono text-[13px] leading-relaxed`}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Абзаци розділяйте порожнім рядком. Підзаголовок: рядок, що починається з «## ». Список: кожен пункт з нового рядка з «- ».
          </p>
        </Card>

        {isCase && (
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Фото з обʼєкта</h2>
                <p className="text-xs text-muted-foreground">Показуються галереєю під текстом кейсу, до 30 фото.</p>
              </div>
              <ImageUploadButton folder="blog" multiple onUploaded={(url) => setGallery((list) => (list.includes(url) ? list : [...list, url].slice(0, 30)))} />
            </div>
            {gallery.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {gallery.map((src, i) => (
                  <li key={src} className="group relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                      <span className="flex gap-1">
                        <ThumbButton label="Лівіше" disabled={i === 0} onClick={() => moveImage(i, -1)}>
                          <ArrowLeft className="size-3.5" />
                        </ThumbButton>
                        <ThumbButton label="Правіше" disabled={i === gallery.length - 1} onClick={() => moveImage(i, 1)}>
                          <ArrowRight className="size-3.5" />
                        </ThumbButton>
                      </span>
                      <ThumbButton label="Прибрати фото" onClick={() => setGallery((list) => list.filter((u) => u !== src))}>
                        <X className="size-3.5" />
                      </ThumbButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Фото ще немає
              </div>
            )}
          </Card>
        )}

        <Card className="space-y-4">
          <h2 className="font-semibold">Пошук Google</h2>
          <Field label="SEO-заголовок" hint={`Якщо порожній, береться заголовок. ${seoTitle.length}/60 символів.`}>
            <input name="seo_title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={120} className={inputClass} />
          </Field>
          <Field label="SEO-опис" hint={`Якщо порожній, береться короткий опис. ${metaDescription.length}/160 символів.`}>
            <textarea
              name="meta_description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={300}
              className={textareaClass}
            />
          </Field>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="space-y-4">
          <h2 className="font-semibold">Публікація</h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="is_published" defaultChecked={post.is_published} className="size-4 accent-primary" />
            Опубліковано на сайті
          </label>
          <Field label="Дата публікації (за Києвом)" hint="Якщо дата в майбутньому, запис зʼявиться на сайті в цей час.">
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required className={inputClass} />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>Зберегти</SubmitButton>
            {livePath && (
              <a href={livePath} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                На сайті <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
          <FormMessage state={state} />
        </Card>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Обкладинка</h2>
            <span className="flex items-center gap-2">
              <ImageUploadButton folder="blog" onUploaded={setCover} />
            </span>
          </div>
          {cover ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="aspect-[16/9] w-full rounded-lg border object-cover" />
              <button type="button" onClick={() => setCover("")} className="text-sm text-muted-foreground hover:text-foreground">
                Прибрати обкладинку
              </button>
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Без обкладинки
            </div>
          )}
          <p className="text-xs text-muted-foreground">На картці в блозі, у шапці запису і при поширенні в соцмережах.</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Кнопка під текстом</h2>
          <Field label="Текст кнопки" hint="Напр. «Системи зворотного осмосу». Порожньо — кнопки не буде.">
            <input name="related_label" defaultValue={post.related_label} maxLength={80} className={inputClass} />
          </Field>
          <Field label="Посилання" hint="Напр. /catalog/reverse-osmosis">
            <input name="related_href" defaultValue={post.related_href} maxLength={300} className={inputClass} />
          </Field>
        </Card>

        <Card className="space-y-3">
          <Field label="Адреса сторінки" hint="Латиницею через дефіс. Після публікації краще не змінювати: старі посилання перестануть працювати.">
            <div className="flex">
              <span className="inline-flex h-9 items-center rounded-l-lg border border-r-0 bg-muted px-2 text-xs text-muted-foreground">/blog/</span>
              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                required
                maxLength={100}
                className={`${inputClass} rounded-l-none font-mono text-[13px]`}
              />
            </div>
          </Field>
          {slugify(title) !== slug && (
            <button type="button" onClick={() => setSlug(slugify(title))} className="text-xs font-medium text-primary hover:underline">
              Згенерувати із заголовка: {slugify(title)}
            </button>
          )}
        </Card>

        <button
          type="button"
          disabled={deleting}
          onClick={() => {
            if (confirm(`Видалити «${post.title}» назавжди?`)) startDelete(() => deletePost(post.id));
          }}
          className="text-sm text-rose-700 hover:underline disabled:opacity-50"
        >
          {deleting ? "Видаляємо…" : "Видалити запис"}
        </button>
      </div>
    </form>
  );
}

function ThumbButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md bg-white/90 text-foreground shadow-sm hover:bg-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}
