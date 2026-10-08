"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeSlide } from "@/lib/home";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 6000;

/**
 * Homepage banner slider. Slides come from the admin ("Банери головної"); the
 * first slide is rendered server-side so the hero is visible before hydration.
 */
export function HeroSlider({
  slides,
  className,
  size = "panel",
}: {
  slides: HomeSlide[];
  className?: string;
  /** "panel" sits inside the catalogue grid, "wide" spans the page. */
  size?: "panel" | "wide";
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useRef(false);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion.current) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, count, go]);

  if (!count) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Пропозиції магазину"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-muted",
        size === "wide" ? "h-[500px] md:h-[520px]" : "h-[500px] md:h-full md:min-h-[420px]",
        className,
      )}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        const dark = slide.theme === "dark";
        // A separate phone image is drawn for the portrait frame: show it whole, anchored to the bottom.
        const mobileArt = Boolean(slide.imageMobile && slide.imageMobile !== slide.imageDesktop);
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} з ${count}`}
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 transition-opacity duration-500 ease-out",
              active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
            )}
          >
            <picture>
              <source media="(max-width: 767px)" srcSet={slide.imageMobile || slide.imageDesktop} />
              <img
                src={slide.imageDesktop}
                alt=""
                fetchPriority={i === 0 ? "high" : "auto"}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn(
                  "absolute object-cover",
                  // Admin banners are wide art with the product right of centre: when the panel is
                  // narrower than the art, crop mostly from the right so the product clears the text.
                  slide.bannerArt ? "md:object-[30%_center]" : "md:object-[72%_center]",
                  // Light banners have no scrim: on phones the photo sits under the text instead of behind it.
                  dark
                    ? cn("inset-0 size-full", mobileArt ? "object-bottom" : "object-[72%_center]")
                    : mobileArt
                      ? // Full width at its own proportions; the empty top of the art fades into the panel under the text.
                        "inset-x-0 bottom-0 h-auto w-full [mask-image:linear-gradient(to_bottom,transparent,#000_22%)] md:inset-0 md:size-full md:[mask-image:none]"
                      : "inset-x-0 bottom-0 h-[44%] w-full object-[72%_center] md:inset-0 md:h-full",
                )}
              />
            </picture>
            {/* Dark banners keep a scrim so white text stays readable; light banners show the photo as is. */}
            {dark &&
              (slide.bannerArt ? (
                // Purpose-made dark art already leaves room for the text: a light scrim is enough.
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/45 md:via-black/10" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/45 to-transparent" />
              ))}
            <div
              className={cn(
                "relative flex h-full max-w-xl flex-col justify-start p-6 pt-7 md:justify-center md:p-10 lg:p-12",
                (!dark || slide.bannerArt) && "md:max-w-[46%]",
                slide.bannerArt && "md:pr-4 lg:pr-4",
                dark ? "text-white" : "text-foreground",
              )}
            >
              {slide.eyebrow && (
                <p className={cn("text-xs font-bold tracking-[0.14em] uppercase", dark ? "text-accent" : "text-primary")}>
                  {slide.eyebrow}
                </p>
              )}
              <h2
                className={cn(
                  "mt-3 font-[family-name:var(--font-manrope)] text-[28px] leading-[1.08] font-extrabold tracking-tight",
                  size === "wide" ? "md:text-[40px] lg:text-[44px]" : "md:text-[30px] 2xl:text-[38px]",
                )}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p
                  className={cn(
                    // A frosted plate keeps the small print readable over busy photos.
                    "mt-3 w-fit max-w-md rounded-xl px-3.5 py-2.5 text-[15px] leading-relaxed backdrop-blur-sm",
                    size === "wide" ? "md:text-base" : "2xl:text-base",
                    dark ? "bg-slate-950/[0.375] text-white/90" : "bg-white/[0.56] text-foreground/80",
                    // Phone art leaves room for a heading and button only.
                    mobileArt && "hidden md:block",
                  )}
                >
                  {slide.subtitle}
                </p>
              )}
              <Link
                href={slide.href}
                tabIndex={active ? 0 : -1}
                className="mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
              >
                {slide.ctaLabel}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
          <div className="flex h-11 items-center rounded-full bg-white/90 px-1.5 shadow-sm ring-1 ring-black/5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Показати слайд ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="grid h-11 min-w-6 place-items-center px-1"
              >
                <span className={cn("h-1.5 rounded-full transition-all", i === index ? "w-7 bg-primary" : "w-3 bg-foreground/25")} />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Попередній слайд"
              onClick={() => go(index - 1)}
              className="grid size-11 place-items-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 hover:bg-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Наступний слайд"
              onClick={() => go(index + 1)}
              className="grid size-11 place-items-center rounded-full bg-white/90 text-foreground shadow-sm ring-1 ring-black/5 hover:bg-white"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
