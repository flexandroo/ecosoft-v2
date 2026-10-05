import { statusMeta } from "@/lib/admin/constants";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Kyiv",
});

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", meta.tone)}>
      {meta.label}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-xl border bg-card p-4 shadow-xs sm:p-5", className)}>{children}</section>;
}

/** Input styling without a width, for inline filter bars. */
export const inputBaseClass =
  "h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60";

export const inputClass = `${inputBaseClass} w-full`;

export const textareaClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block text-sm", className)}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-primary" />
      {label}
    </label>
  );
}
