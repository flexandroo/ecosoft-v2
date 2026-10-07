"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Header } from "@/components/site/header";

/** Shown instead of a blank page when a storefront page fails to render. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />
      <main id="main-content" className="flex flex-1 items-center bg-muted/30 px-4 pb-20 pt-16 md:px-8">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
          <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
            Не вдалося завантажити сторінку
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Сталася тимчасова помилка. Спробуйте ще раз або поверніться на головну.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <RotateCcw className="size-4" /> Спробувати ще раз
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-muted"
            >
              На головну
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
