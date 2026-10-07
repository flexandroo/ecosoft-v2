"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { ProductImage } from "@/components/catalog/product-image";
import { useDialog } from "@/components/site/use-dialog";
import { cn } from "@/lib/utils";

/**
 * Product photos: thumbnails (a column on desktop, a row on phones), the main
 * photo with a counter and arrows, and a full-screen view.
 */
export function ProductGallery({
  images,
  alt,
  badges,
  fallback,
}: {
  images: string[];
  alt: string;
  /** Overlay in the top-left corner of the main photo (discount, availability). */
  badges?: React.ReactNode;
  /** Shown when there are no photos. */
  fallback: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const count = images.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  const zoomRef = useRef<HTMLDivElement>(null);
  useDialog(zoom, zoomRef, () => setZoom(false));

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, go]);

  if (!count) {
    return <div className="relative grid aspect-square place-items-center rounded-3xl border border-border bg-white">{fallback}</div>;
  }

  const arrow =
    "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white";

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {count > 1 && (
        <ul
          className="flex gap-2 overflow-x-auto pb-1 md:max-h-[560px] md:w-20 md:shrink-0 md:flex-col md:overflow-y-auto md:overflow-x-visible md:pb-0"
          aria-label="Фото товару"
        >
          {images.map((src, i) => (
            <li key={src + i} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Фото ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl border bg-white transition-colors md:size-20",
                  i === index ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40",
                )}
              >
                <ProductImage src={src} alt="" sizes="80px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-3xl border border-border bg-white">
        <button type="button" onClick={() => setZoom(true)} aria-label="Збільшити фото" className="absolute inset-0 cursor-zoom-in">
          <ProductImage
            src={images[index]}
            alt={index === 0 ? alt : `${alt} — фото ${index + 1}`}
            sizes="(min-width: 1024px) 50vw, 100vw"
            preload={index === 0}
            quality={85}
            className="object-contain p-6"
          />
        </button>
        {badges && <div className="pointer-events-none absolute top-4 left-4 flex flex-wrap gap-2">{badges}</div>}
        {count > 1 && (
          <>
            <span className="absolute top-4 right-4 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-muted-foreground tabular ring-1 ring-black/5">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => go(-1)} aria-label="Попереднє фото" className={cn(arrow, "left-3")}>
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Наступне фото" className={cn(arrow, "right-3")}>
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="absolute right-4 bottom-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-medium text-foreground shadow-sm ring-1 ring-black/5 hover:bg-white"
        >
          <Maximize2 className="size-3.5" /> Збільшити
        </button>
      </div>

      {zoom &&
        createPortal(
          <div ref={zoomRef} className="fixed inset-0 z-[70] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label="Фото товару">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted-foreground tabular">
                {index + 1} / {count}
              </span>
              <button
                type="button"
                onClick={() => setZoom(false)}
                aria-label="Закрити"
                className="grid size-11 place-items-center rounded-full hover:bg-muted"
              >
                <X className="size-6" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <ProductImage src={images[index]} alt={alt} sizes="100vw" quality={85} className="object-contain p-4 md:p-10" />
              {count > 1 && (
                <>
                  <button type="button" onClick={() => go(-1)} aria-label="Попереднє фото" className={cn(arrow, "left-4 size-12")}>
                    <ChevronLeft className="size-6" />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Наступне фото" className={cn(arrow, "right-4 size-12")}>
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
