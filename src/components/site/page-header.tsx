import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

export function PageHeader({
  title,
  subtitle,
  crumbs,
  image,
  imageAlt = "",
}: {
  title?: string;
  subtitle?: string;
  crumbs: Crumb[];
  image?: string;
  imageAlt?: string;
}) {
  const compact = !title;
  const hasImage = Boolean(image && title);

  return (
    <section
      className={`relative isolate overflow-hidden border-b border-border ${
        hasImage ? "bg-slate-900" : "bg-card"
      }`}
    >
      {hasImage && image && (
        <>
          <Image
            src={image}
            alt={imageAlt}
            fill
            preload
            sizes="100vw"
            // Admin uploads live in Supabase storage and are already compressed on upload.
            unoptimized={/^https?:\/\//.test(image)}
            className="-z-20 object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,24,43,0.94)_0%,rgba(7,24,43,0.82)_38%,rgba(7,24,43,0.35)_68%,rgba(7,24,43,0.18)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(7,24,43,0.28),transparent_55%)]"
          />
        </>
      )}

      <div
        className={`relative mx-auto max-w-[1600px] px-4 md:px-8 ${
          compact
            ? "pb-4 pt-6 md:pb-5 md:pt-8"
            : hasImage
              ? "flex min-h-[13rem] flex-col justify-end pb-8 pt-8 md:min-h-[17rem] md:pb-10 md:pt-8"
              : "pb-10 pt-10 md:pb-12 md:pt-14"
        }`}
      >
        <nav
          aria-label="Хлібні крихти"
          className={`flex flex-wrap items-center gap-1.5 text-xs ${
            hasImage ? "text-white/75" : "text-muted-foreground"
          } ${
            title ? "mb-4" : ""
          }`}
        >
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {c.href ? (
                <Link
                  href={c.href}
                  className={hasImage ? "transition-colors hover:text-white" : "hover:text-foreground"}
                >
                  {c.label}
                </Link>
              ) : (
                <span className={hasImage ? "text-white" : "text-foreground"}>{c.label}</span>
              )}
              {i < crumbs.length - 1 && <ChevronRight className="size-3" aria-hidden />}
            </span>
          ))}
        </nav>

        {title && (
          <h1
            className={`max-w-4xl font-[family-name:var(--font-manrope)] text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl ${
              hasImage ? "text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.18)]" : ""
            }`}
          >
            {title}
          </h1>
        )}

        {subtitle && (
          <p
            className={`mt-3 max-w-2xl text-base md:text-lg ${
              hasImage ? "text-white/85" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
