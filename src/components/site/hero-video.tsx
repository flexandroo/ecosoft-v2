"use client";

import { useEffect, useState } from "react";

export function HeroVideo({ src }: { src: string }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;

    const update = () => {
      setEnabled(desktop.matches && !reducedMotion.matches && !connection?.saveData);
    };

    update();
    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  if (!enabled) return null;

  return (
    <video
      className={`absolute inset-0 -z-10 size-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      onCanPlay={() => setReady(true)}
      aria-hidden
    />
  );
}
