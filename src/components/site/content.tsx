import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h2>
      {lead && <p className="mt-3 max-w-2xl text-muted-foreground">{lead}</p>}
    </div>
  );
}

export function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

export function CtaNote({
  text,
  primary,
  secondary,
}: {
  text: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
      <p className="max-w-3xl text-base text-foreground">{text}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={primary.href}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
        >
          <Headphones className="size-4" />
          {primary.label}
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {secondary.label}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
