import Link from "next/link";

/*
 * Halloween decor. Everything here renders on every page but stays hidden
 * unless <html data-season="halloween"> (see src/lib/season.ts).
 */

export function Pumpkin({ face = true, className }: { face?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden className={className}>
      <path d="M31 12c0-5 2-9 7-11" stroke="#3f6212" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="34" rx="16" ry="19" fill="#c2410c" />
      <ellipse cx="44" cy="34" rx="16" ry="19" fill="#c2410c" />
      <ellipse cx="32" cy="34" rx="15" ry="21" fill="#f97316" />
      {face && (
        <path
          d="M21 30l5-7 5 7zM33 30l5-7 5 7zM19 38q13 11 26 0l-4 1.5-3.5-2-3.5 3-4-3-4 3-3.5-3z"
          fill="#fde68a"
        />
      )}
    </svg>
  );
}

function Bat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 30" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M32 9L35 4l1.5 5.5C40 9 42 10 43 12c6-5 14-7 21-6-5 3-7 7-7 12-3-2-7-2-10 1-2-3-6-3-9 0-2 2-4 5-6 9-2-4-4-7-6-9-3-3-7-3-9 0-3-3-7-3-10-1 0-5-2-9-7-12 7-1 15 1 21 6 1-2 3-3 6.5-2.5L29 4z"
      />
    </svg>
  );
}

/** Cobweb anchored to the top-right corner, drawn from spokes and sagging rings. */
const WEB_PATH = (() => {
  const c = { x: 120, y: 0 };
  const spokes = [0, 1, 2, 3, 4].map((i) => (i * Math.PI) / 8);
  const pt = (a: number, r: number) => `${(c.x - Math.cos(a) * r).toFixed(1)} ${(c.y + Math.sin(a) * r).toFixed(1)}`;
  let d = spokes.map((a) => `M${c.x} ${c.y}L${pt(a, 118)}`).join("");
  for (const r of [28, 52, 76, 100]) {
    d += `M${pt(spokes[0], r)}`;
    for (let i = 1; i < spokes.length; i++) {
      d += `Q${pt((spokes[i - 1] + spokes[i]) / 2, r * 0.84)} ${pt(spokes[i], r)}`;
    }
  }
  return d;
})();

/**
 * Decor layer for photo banners. Sits between the banner image/gradients
 * (-z-20/-z-10) and the copy, inside the banner's `isolate` stacking context.
 * `minimal` keeps only the cobweb and bats, for banners whose art must stay
 * untouched (the homepage slider); pass a `className` to lift it above slides.
 */
export function HalloweenBannerDecor({
  tone = "dark",
  minimal = false,
  className = "-z-[5]",
}: {
  tone?: "dark" | "light";
  minimal?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 hidden overflow-hidden halloween:block ${className}`}>
      {!minimal && (
        <>
          {/* twilight grade: violet dusk with a pumpkin-orange glow on the right */}
          <div
            className={
              dark
                ? "absolute inset-0 bg-[radial-gradient(55%_85%_at_88%_100%,rgba(249,115,22,0.32),transparent_70%),linear-gradient(90deg,transparent_35%,rgba(59,7,100,0.38))]"
                : "absolute inset-0 bg-[radial-gradient(50%_90%_at_90%_100%,rgba(249,115,22,0.22),transparent_70%),linear-gradient(90deg,transparent_45%,rgba(88,28,135,0.16))]"
            }
          />

          <div className="absolute right-[16%] top-[22%] hidden size-12 rounded-full bg-[#fef3c7] shadow-[0_0_40px_14px_rgba(254,243,199,0.35)] sm:block md:size-16" />
        </>
      )}

      <svg
        viewBox="0 0 120 120"
        className={`absolute right-0 top-0 size-28 md:size-36 ${dark ? "text-white/45" : "text-slate-500/40"}`}
      >
        <path d={WEB_PATH} fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>

      {!minimal && (
        <div className="absolute bottom-0 right-[5%] hidden items-end gap-1 sm:flex">
          <Pumpkin className="w-14 drop-shadow-[0_0_14px_rgba(249,115,22,0.55)] md:w-20" />
          <Pumpkin face={false} className="w-9 md:w-12" />
        </div>
      )}

      <div className={`motion-reduce:hidden ${dark ? "text-slate-950" : "text-slate-800"}`}>
        <span className="halloween-bat absolute left-0 top-[30%] w-9 [animation-delay:0.4s]">
          <Bat className="halloween-wing w-full" />
        </span>
        <span className="halloween-bat absolute left-0 top-[48%] w-6 [animation-delay:1.1s]">
          <Bat className="halloween-wing w-full" />
        </span>
        <span className="halloween-bat absolute left-0 top-[20%] w-5 [animation-delay:1.7s]">
          <Bat className="halloween-wing w-full" />
        </span>
      </div>
    </div>
  );
}

/** One-line seasonal strip at the very top of the header. */
export function HalloweenBar() {
  return (
    <Link
      href="/catalog"
      className="group/season hidden h-9 items-center justify-center gap-2 bg-[#1c1027] px-4 text-xs font-medium text-orange-100 halloween:flex sm:text-sm"
    >
      <Pumpkin className="size-4 shrink-0" />
      <span className="truncate">
        Нічого страшного — лише чиста вода
        <span className="hidden md:inline"> · Безкоштовна доставка від 5 000 ₴</span>
      </span>
      <span className="hidden shrink-0 font-semibold text-orange-400 underline-offset-4 transition-colors group-hover/season:text-orange-300 group-hover/season:underline sm:inline">
        До каталогу →
      </span>
    </Link>
  );
}
