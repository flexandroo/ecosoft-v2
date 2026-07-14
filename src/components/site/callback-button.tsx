"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, X, Check } from "lucide-react";

/**
 * "Безкоштовний дзвінок" — a callback request. Renders a trigger button that
 * opens a small modal asking for a phone (name optional) and posts it to
 * /api/callback, which forwards it to Telegram.
 *
 * `className` styles the trigger so callers (header on dark hero, footer, etc.)
 * control its appearance. `source` is passed through to the Telegram message.
 */
export function CallbackButton({
  className,
  children,
  source,
}: {
  className?: string;
  children?: React.ReactNode;
  source?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children ?? (
          <>
            <Phone className="size-4" aria-hidden />
            Безкоштовний дзвінок
          </>
        )}
      </button>
      {open && <CallbackModal source={source} onClose={() => setOpen(false)} />}
    </>
  );
}

function CallbackModal({
  source,
  onClose,
}: {
  source?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const phoneValid = phone.replace(/\D/g, "").length >= 9;

  useEffect(() => {
    phoneRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Lock body scroll while the modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !phoneValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          company,
          source: source ?? "site",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("failed");
      setSent(true);
    } catch {
      setError("Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Замовити безкоштовний дзвінок"
    >
      <button
        aria-label="Закрити"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-t-2xl bg-background p-6 text-foreground shadow-xl sm:rounded-2xl">
        <button
          type="button"
          aria-label="Закрити"
          onClick={onClose}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        {sent ? (
          <div className="py-4 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="size-6" />
            </span>
            <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
              Дякуємо! Ми передзвонимо
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Наш менеджер зателефонує вам найближчим часом.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Закрити
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight">
              Безкоштовний дзвінок
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Залиште номер — передзвонимо, допоможемо підібрати рішення під вашу воду.
            </p>

            {/* Honeypot */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />

            <div className="mt-5 space-y-3">
              <div>
                <label htmlFor="cb-name" className="sr-only">
                  Імʼя
                </label>
                <input
                  id="cb-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Імʼя (необовʼязково)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label htmlFor="cb-phone" className="sr-only">
                  Телефон
                </label>
                <input
                  id="cb-phone"
                  ref={phoneRef}
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+380 __ ___ __ __ *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm tabular outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !phoneValid}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Надсилаємо…" : "Замовити дзвінок"}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Натискаючи, ви погоджуєтесь на обробку даних для звʼязку з вами.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
