import Image from "next/image";

/**
 * Product photo that fills its (positioned) parent. Local photos are full-size
 * originals (up to 1200×1200), so Next serves each slot a resized copy picked
 * from `sizes`; admin uploads in Supabase storage are already compressed and
 * are shown as they are.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  className,
  preload = false,
  quality,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  preload?: boolean;
  quality?: 75 | 85;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      loading={preload ? undefined : "lazy"}
      quality={quality}
      unoptimized={/^https?:\/\//.test(src)}
      className={className}
    />
  );
}
