"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser";

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads an image straight from the browser to the public `media` bucket
 * (Storage RLS allows staff only) and reports its public URL.
 */
export function ImageUploadButton({ folder, onUploaded }: { folder: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!TYPES.includes(file.type)) return setError("Лише JPG, PNG, WebP або AVIF.");
    if (file.size > MAX_BYTES) return setError("Файл більший за 10 МБ.");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const supabase = getBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "31536000", contentType: file.type });
      if (uploadError) throw uploadError;
      onUploaded(supabase.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted">
        <Upload className="size-4" />
        {busy ? "Завантаження…" : "Завантажити фото"}
        <input
          type="file"
          accept={TYPES.join(",")}
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </label>
      {error && <span className="text-xs text-rose-700">{error}</span>}
    </span>
  );
}
