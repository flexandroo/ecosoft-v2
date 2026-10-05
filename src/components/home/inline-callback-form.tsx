"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useCallbackRequest } from "@/components/site/use-callback-request";
import { captureMarketingAttribution } from "@/utils/marketing-attribution";
import { cn } from "@/lib/utils";

/** "Call me back" form embedded in the page (same API + tracking as the header modal). */
export function InlineCallbackForm({
  source,
  tone = "light",
  submitLabel = "Передзвоніть мені",
  className,
}: {
  source: string;
  tone?: "light" | "dark";
  submitLabel?: string;
  className?: string;
}) {
  const f = useCallbackRequest(source);
  useEffect(() => {
    captureMarketingAttribution();
  }, []);

  const dark = tone === "dark";
  const input = cn(
    "h-12 w-full rounded-xl border px-4 text-base outline-none transition-colors focus:ring-2",
    dark
      ? "border-white/15 bg-white/10 text-white placeholder:text-white/55 focus:border-white/40 focus:ring-white/20"
      : "border-border bg-card placeholder:text-muted-foreground focus:border-ring focus:ring-ring/25",
  );

  if (f.sent) {
    return (
      <div role="status" aria-live="polite" className={cn("flex items-start gap-3", className)}>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
          <Check className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Дякуємо! Ми передзвонимо</p>
          <p className={cn("text-sm", dark ? "text-white/75" : "text-muted-foreground")}>
            Менеджер зателефонує вам найближчим часом у робочий час.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={f.submit} className={cn("space-y-3", className)} noValidate>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        value={f.company}
        onChange={(e) => f.setCompany(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={cn("mb-1 block text-sm font-medium", dark && "text-white/85")}>Імʼя</span>
          <input
            type="text"
            autoComplete="name"
            value={f.name}
            onChange={(e) => f.setName(e.target.value)}
            placeholder="Як до вас звертатися"
            className={input}
          />
        </label>
        <label className="block">
          <span className={cn("mb-1 block text-sm font-medium", dark && "text-white/85")}>
            Телефон <span aria-hidden>*</span>
          </span>
          <input
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={f.phone}
            onChange={(e) => f.setPhone(e.target.value)}
            placeholder="+380 __ ___ __ __"
            className={cn(input, "tabular")}
          />
        </label>
      </div>
      {f.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {f.error}
        </p>
      )}
      <button
        type="submit"
        disabled={f.submitting || !f.phoneValid}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
          dark ? "bg-white text-foreground hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        {f.submitting ? "Надсилаємо…" : submitLabel}
      </button>
      <p className={cn("text-xs", dark ? "text-white/60" : "text-muted-foreground")}>
        Надсилаючи форму, ви погоджуєтесь з{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          політикою конфіденційності
        </Link>
        .
      </p>
    </form>
  );
}
