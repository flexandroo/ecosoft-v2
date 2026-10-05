"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Upload, X } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, uploadMedia, type MediaAsset } from "@/lib/media-upload";
import type { MediaUsage } from "@/lib/admin/media";
import { deleteMedia, updateMediaAlt } from "../../actions";
import { formatDateTime, inputClass } from "../ui";

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

export function MediaGrid({ assets, usage }: { assets: MediaAsset[]; usage: Record<string, MediaUsage[]> }) {
  const router = useRouter();
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<MediaAsset | null>(null);

  async function upload(files: File[]) {
    setError(null);
    setBusy(files.length);
    for (const file of files) {
      try {
        await uploadMedia(file, "library");
      } catch (err) {
        setError(`${file.name}: ${err instanceof Error ? err.message : "не вдалося завантажити"}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/85">
          <Upload className="size-4" />
          {busy ? `Завантаження… (${busy})` : "Завантажити фото"}
          <input
            type="file"
            multiple
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            disabled={busy > 0}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) void upload(files);
            }}
          />
        </label>
        <span className="text-xs text-muted-foreground">
          JPG, PNG, WebP, AVIF. Фото автоматично стискаються у WebP і зменшуються до 2000 px.
        </span>
        {error && <span className="w-full text-sm text-rose-700">{error}</span>}
      </div>

      {assets.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {assets.map((asset) => {
            const used = usage[asset.url] ?? [];
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setOpen(asset)}
                  className="group block w-full overflow-hidden rounded-xl border bg-card text-left hover:ring-2 hover:ring-primary/40"
                >
                  <span className="block aspect-square bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.url} alt={asset.alt} loading="lazy" className="size-full object-contain" />
                  </span>
                  <span className="block border-t px-2.5 py-2">
                    <span className="block truncate text-xs font-medium">{asset.alt || asset.path.split("/").pop()}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{formatSize(asset.size_bytes)}</span>
                      {used.length ? (
                        <span className="rounded-full bg-emerald-100 px-1.5 text-emerald-800">використ. {used.length}</span>
                      ) : (
                        <span className="rounded-full bg-muted px-1.5">не використ.</span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Файлів ще немає.</p>
      )}

      {open && (
        <MediaDetails
          key={open.id}
          asset={open}
          used={usage[open.url] ?? []}
          onClose={() => setOpen(null)}
          onDeleted={() => {
            setOpen(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function MediaDetails({
  asset,
  used,
  onClose,
  onDeleted,
}: {
  asset: MediaAsset;
  used: MediaUsage[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [alt, setAlt] = useState(asset.alt);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Файл">
      <button aria-label="Закрити" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-background shadow-xl sm:rounded-2xl md:grid-cols-[1.2fr_1fr]">
        <div className="grid place-items-center bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.url} alt={alt} className="max-h-[60vh] w-full object-contain" />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold break-all">{asset.path.split("/").pop()}</p>
            <button aria-label="Закрити" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-muted">
              <X className="size-4" />
            </button>
          </div>
          <dl className="space-y-1 text-xs text-muted-foreground">
            <div>
              {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
              {formatSize(asset.size_bytes)} · {asset.mime_type.replace("image/", "").toUpperCase()}
            </div>
            <div>Завантажено {formatDateTime(asset.created_at)}</div>
          </dl>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Опис (alt) для SEO</span>
            <input value={alt} onChange={(e) => setAlt(e.target.value)} className={inputClass} placeholder="Що зображено на фото" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || alt === asset.alt}
              onClick={() =>
                startTransition(async () => {
                  await updateMediaAlt(asset.id, alt);
                  setMessage("Опис збережено");
                })
              }
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Зберегти опис
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(asset.url);
                setMessage("Посилання скопійовано");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              <Copy className="size-4" /> Копіювати посилання
            </button>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium">Де використовується</p>
            {used.length ? (
              <ul className="mt-1 space-y-1 text-sm">
                {used.map((u) => (
                  <li key={u.href}>
                    <Link href={u.href} className="text-primary hover:underline">
                      {{ product: "Товар", banner: "Банер", category: "Категорія", post: "Блог", page: "Сторінка" }[u.kind]}: {u.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Ніде — файл можна видалити.</p>
            )}
          </div>

          <button
            type="button"
            disabled={pending || used.length > 0}
            onClick={() => {
              if (!confirm("Видалити файл назавжди?")) return;
              startTransition(async () => {
                const result = await deleteMedia(asset.id);
                if (result.ok) onDeleted();
                else setMessage(result.error ?? "Не вдалося видалити");
              });
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40"
          >
            <Trash2 className="size-4" /> Видалити файл
          </button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
      </div>
    </div>
  );
}
