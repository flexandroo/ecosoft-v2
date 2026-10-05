"use client";

import { getBrowserClient } from "@/lib/supabase/browser";

export type MediaAsset = {
  id: string;
  path: string;
  url: string;
  folder: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  created_at: string;
};

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_SIDE = 2000;
const WEBP_QUALITY = 0.86;

type Prepared = { blob: Blob; type: string; ext: string; width: number; height: number };

/**
 * Downscale to at most 2000px on the long side and re-encode as WebP, unless the
 * file is already a small WebP/AVIF. Keeps transparency (WebP supports alpha).
 */
async function prepareImage(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const alreadyOptimal = (file.type === "image/webp" || file.type === "image/avif") && scale === 1;
  if (alreadyOptimal) {
    bitmap.close();
    return { blob: file, type: file.type, ext: file.type === "image/avif" ? "avif" : "webp", width, height };
  }
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Браузер не зміг обробити зображення.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
  if (!blob) throw new Error("Не вдалося стиснути зображення.");
  // Some browsers silently fall back to PNG when WebP encoding is unsupported.
  const type = blob.type || "image/png";
  return { blob, type, ext: type === "image/webp" ? "webp" : "png", width: w, height: h };
}

function slugifyName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").toLowerCase();
  return (
    base
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

/** Upload one image to the public "media" bucket and register it in the library. */
export async function uploadMedia(file: File, folder: string, alt = ""): Promise<MediaAsset> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error("Лише JPG, PNG, WebP або AVIF.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Файл більший за 25 МБ.");

  const prepared = await prepareImage(file);
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "library";
  // Ad blockers hide images whose URL looks like an ad ("/banners/", "-banner-"…), so banner art is
  // stored under "home/" and the word is dropped from file names.
  const storageDir = safeFolder.replace(/^banners(?=\/|$)/, "home");
  const name = slugifyName(file.name).replace(/banners?/g, "art");
  const path = `${storageDir}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${name}.${prepared.ext}`;

  const supabase = getBrowserClient();
  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, prepared.blob, { cacheControl: "31536000", contentType: prepared.type });
  if (uploadError) throw new Error(uploadError.message);

  const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      path,
      url,
      folder: safeFolder.split("/")[0],
      mime_type: prepared.type,
      size_bytes: prepared.blob.size,
      width: prepared.width,
      height: prepared.height,
      alt: alt.slice(0, 300),
      created_by: userData.user?.id ?? null,
    })
    .select("id, path, url, folder, mime_type, size_bytes, width, height, alt, created_at")
    .single();
  if (error || !data) {
    // Keep storage and library consistent: drop the orphaned file.
    await supabase.storage.from("media").remove([path]);
    throw new Error(error?.message ?? "Не вдалося зареєструвати файл у медіатеці.");
  }
  return data as MediaAsset;
}
