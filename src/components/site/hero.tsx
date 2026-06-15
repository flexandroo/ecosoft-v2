import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

const HERO_VIDEO_SRC = "/hero.mp4";
const HERO_POSTER = "";

export function Hero() {
  return (
    <section
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-center overflow-hidden bg-[oklch(0.18_0.04_220)] text-white"
      aria-label="Чиста вода для дому"
    >
      <video
        className="absolute inset-0 -z-10 size-full object-cover"
        src={HERO_VIDEO_SRC}
        poster={HERO_POSTER}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />

      <div className="absolute inset-0 -z-10 bg-[oklch(0.18_0.04_220)]/55" aria-hidden />

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-24 md:px-8 md:pb-32 md:pt-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
            <ShieldCheck className="size-3.5 text-white" />
            Сертифіковано NSF · 12 років на ринку
          </span>

          <h1 className="mt-5 font-[family-name:var(--font-manrope)] text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-[68px] lg:leading-[1.04]">
            Чиста вода у кожному крані вашого дому
          </h1>

          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Системи зворотного осмосу, помʼякшувачі та фільтри від українського виробника.
            Підбір під аналіз води, монтаж під ключ, гарантія 5 років.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/catalog"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-foreground transition-colors hover:bg-white/90"
            >
              Підібрати систему
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/consultation"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
            >
              Безкоштовна консультація
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-6">
            <Stat value="50K+" label="клієнтів" />
            <Stat value="5 років" label="гарантія" />
            <Stat value="24 год" label="монтаж" />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="tabular text-2xl font-bold text-white sm:text-3xl">{value}</dt>
      <dd className="mt-1 text-xs text-white/70 sm:text-sm">{label}</dd>
    </div>
  );
}
