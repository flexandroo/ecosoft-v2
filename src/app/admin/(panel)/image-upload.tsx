"use client";

import { useState } from "react";
import { Images, Upload } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, uploadMedia } from "@/lib/media-upload";
import { MediaPicker } from "./media-picker";

/**
 * "Upload" + "Pick from library" buttons for admin forms. Uploaded files are
 * compressed, stored in the public bucket and registered in the media library.
 */
export function ImageUploadButton({
  folder,
  onUploaded,
  multiple = false,
}: {
  folder: string;
  onUploaded: (url: string) => void;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handleFiles(files: File[]) {
    setError(null);
    setBusy(files.length);
    for (const file of files) {
      try {
        const asset = await uploadMedia(file, folder);
        onUploaded(asset.url);
      } catch (err) {
        setError(`${file.name}: ${err instanceof Error ? err.message : "не вдалося завантажити"}`);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="flex flex-wrap gap-2">
        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted">
          <Upload className="size-4" />
          {busy ? `Завантаження… (${busy})` : multiple ? "Завантажити фото" : "Завантажити"}
          <input
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple={multiple}
            className="sr-only"
            disabled={busy > 0}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) void handleFiles(files);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          <Images className="size-4" /> З медіатеки
        </button>
      </span>
      {error && <span className="text-xs text-rose-700">{error}</span>}
      {pickerOpen && (
        <MediaPicker
          multiple={multiple}
          onClose={() => setPickerOpen(false)}
          onPick={(urls) => {
            urls.forEach(onUploaded);
            setPickerOpen(false);
          }}
        />
      )}
    </span>
  );
}
