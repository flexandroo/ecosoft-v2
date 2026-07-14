"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          message: fd.get("message"),
          company: fd.get("company"), // honeypot
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) throw new Error("failed");
      form.reset();
      setSent(true);
    } catch {
      setError(
        "Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Check className="size-6" />
        </span>
        <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
          Дякуємо за звернення
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Ми отримали ваше повідомлення і звʼяжемося з вами найближчим часом.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-5 text-sm font-semibold text-primary hover:underline"
        >
          Надіслати ще одне
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      {/* Honeypot — hidden from users, filled only by bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Імʼя" htmlFor="cf-name">
          <input
            id="cf-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Ваше імʼя"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </Field>
        <Field label="Телефон" htmlFor="cf-phone">
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+380 __ ___ __ __"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm tabular outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Email" htmlFor="cf-email" optional>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Повідомлення" htmlFor="cf-message">
          <textarea
            id="cf-message"
            name="message"
            required
            rows={4}
            placeholder="Опишіть вашу воду, тип обʼєкта або питання"
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </Field>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {submitting ? "Надсилаємо…" : "Надіслати"}
        {!submitting && <Send className="size-4" />}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        Натискаючи «Надіслати», ви погоджуєтесь на обробку даних для звʼязку з вами.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {optional && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (необовʼязково)
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
