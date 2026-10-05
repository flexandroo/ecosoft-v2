import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Building2,
  CheckCircle2,
  Clock,
  Coffee,
  Droplet,
  Factory,
  Filter,
  FlaskConical,
  Gauge,
  Headphones,
  HelpCircle,
  Home,
  Landmark,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { CtaNote, InfoCard, SectionHeading } from "@/components/site/content";
import { ContactForm } from "@/components/site/contact-form";
import { getSitePage } from "@/lib/pages";
import { PAGE_META, parseInline, type PageIcon, type PageKey, type PageSection } from "@/lib/pages-shared";
import { parsePostBody } from "@/lib/posts-shared";
import { getSiteSettings } from "@/lib/settings";
import {
  formatClosedDays,
  formatOpenHours,
  mapsUrl,
  toPhoneContacts,
  type SiteSettings,
} from "@/lib/settings-shared";
import { cn } from "@/lib/utils";

const ICONS: Record<PageIcon, LucideIcon> = {
  Truck,
  MapPin,
  Home,
  Building2,
  Landmark,
  Wallet,
  ShieldCheck,
  Wrench,
  Settings,
  Coffee,
  Factory,
  FlaskConical,
  HelpCircle,
  Headphones,
  Droplet,
  Award,
  Phone,
  Clock,
  Package,
  CheckCircle2,
  Users,
  Sparkles,
  Filter,
  Gauge,
};

const COLUMNS: Record<2 | 3 | 4, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export async function infoPageMetadata(key: PageKey): Promise<Metadata> {
  const page = await getSitePage(key);
  return {
    title: page.seoTitle || page.title,
    description: page.metaDescription || page.subtitle,
    alternates: { canonical: PAGE_META[key].path },
  };
}

/** Header + sections + footer of an information page edited in /admin/pages. */
export async function InfoPage({ pageKey }: { pageKey: PageKey }) {
  const [page, settings] = await Promise.all([getSitePage(pageKey), getSiteSettings()]);
  const { layout, label } = PAGE_META[pageKey];
  const fill = tokenFiller(settings);
  const sections = page.sections.map((section, i) => (
    <Section key={i} section={section} fill={fill} settings={settings} narrow={layout === "narrow"} />
  ));

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title={page.title}
          subtitle={page.subtitle || undefined}
          image={page.image || undefined}
          imageAlt={page.imageAlt}
          crumbs={[{ href: "/", label: "Головна" }, { label }]}
        />
        {layout === "narrow" ? (
          <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 md:px-8 md:py-16">{sections}</article>
        ) : layout === "contacts" ? (
          <div className="mx-auto max-w-[1100px] space-y-14 px-4 py-12 md:px-8 md:py-16">{sections}</div>
        ) : (
          <div className={cn("mx-auto max-w-5xl px-4 py-12 md:px-8 md:py-16", pageKey === "about" ? "space-y-16" : "space-y-14")}>
            {sections}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------

type Fill = (text: string) => string;

/** Replaces {телефони}, {email}, {адреса}… with values from the settings (phones become links). */
function tokenFiller(settings: SiteSettings): Fill {
  const values: Record<string, string> = {
    "{телефони}": toPhoneContacts(settings.phones)
      .map((p) => `[${p.display}](${p.href})`)
      .join(" або "),
    "{email}": `[${settings.email}](mailto:${settings.email})`,
    "{адреса}": settings.address.full,
    "{коротка-адреса}": settings.address.short,
    "{графік}": formatOpenHours(settings.hours),
  };
  return (text) => text.replace(/\{[а-яіїєґa-z-]+\}/gi, (token) => values[token.toLowerCase()] ?? token);
}

function Inline({ text, fill }: { text: string; fill: Fill }) {
  return (
    <>
      {parseInline(fill(text)).map((part, i) =>
        part.href ? (
          <a key={i} href={part.href} className="font-medium text-foreground underline underline-offset-2">
            {part.text}
          </a>
        ) : part.bold ? (
          <strong key={i} className="text-foreground">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

function Body({ body, fill, className }: { body: string; fill: Fill; className?: string }) {
  return (
    <div className={cn("space-y-4 text-muted-foreground", className)}>
      {parsePostBody(body).map((block, i) =>
        block.type === "h2" ? (
          <h3 key={i} className="pt-2 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight text-foreground">
            <Inline text={block.text} fill={fill} />
          </h3>
        ) : block.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1.5 pl-5">
            {block.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} fill={fill} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="leading-relaxed">
            <Inline text={block.text} fill={fill} />
          </p>
        ),
      )}
    </div>
  );
}

function Heading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  if (!eyebrow && !title && !lead) return null;
  return <SectionHeading eyebrow={eyebrow || undefined} title={title} lead={lead || undefined} />;
}

function Section({
  section,
  fill,
  settings,
  narrow,
}: {
  section: PageSection;
  fill: Fill;
  settings: SiteSettings;
  narrow: boolean;
}) {
  switch (section.type) {
    case "text": {
      if (narrow) {
        return (
          <section className={cn(section.boxed && "rounded-2xl border border-border bg-card p-6")}>
            {section.title && (
              <h2 className="mb-2 font-[family-name:var(--font-manrope)] text-xl font-bold tracking-tight">{section.title}</h2>
            )}
            <Body body={section.body} fill={fill} />
          </section>
        );
      }
      return (
        <section>
          <Heading {...section} />
          {section.boxed ? (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
              <Body body={section.body} fill={fill} />
            </div>
          ) : (
            <Body body={section.body} fill={fill} />
          )}
        </section>
      );
    }

    case "cards":
      return (
        <section>
          <Heading {...section} />
          <div className={cn("grid gap-4", COLUMNS[section.columns])}>
            {section.items.map((item, i) =>
              section.layout === "inline" ? (
                <div key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {(() => {
                      const Icon = ICONS[item.icon];
                      return <Icon className="size-5" />;
                    })()}
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      <Inline text={item.text} fill={fill} />
                    </p>
                  </div>
                </div>
              ) : (
                <InfoCard key={i} icon={ICONS[item.icon]} title={item.title}>
                  <Inline text={item.text} fill={fill} />
                </InfoCard>
              ),
            )}
          </div>
        </section>
      );

    case "steps":
      return (
        <section>
          <Heading {...section} />
          {section.layout === "cards" ? (
            <ol className="grid gap-4 sm:grid-cols-2">
              {section.items.map((s, i) => (
                <li key={i} className="rounded-2xl border border-border bg-card p-5">
                  <span className="font-[family-name:var(--font-manrope)] text-3xl font-extrabold tabular text-primary/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title && <h3 className="mt-2 font-[family-name:var(--font-manrope)] text-lg font-bold tracking-tight">{s.title}</h3>}
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    <Inline text={s.text} fill={fill} />
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="space-y-3">
              {section.items.map((s, i) => (
                <li key={i} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground tabular">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">
                    {s.title && <strong className="mr-1">{s.title}.</strong>}
                    <Inline text={s.text} fill={fill} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      );

    case "notes":
      return (
        <section>
          <Heading {...section} />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {section.items.map((s, i) => (
              <li key={i} className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Inline text={s} fill={fill} />
              </li>
            ))}
          </ul>
        </section>
      );

    case "cta":
      if (section.layout === "banner") {
        return (
          <section className="overflow-hidden rounded-3xl bg-[oklch(0.18_0.04_220)] px-6 py-12 text-white md:px-12 md:py-16">
            <div className="max-w-2xl">
              {section.title && (
                <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">{section.title}</h2>
              )}
              {section.text && <p className="mt-3 text-white/80">{fill(section.text)}</p>}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={section.primaryHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
                >
                  {section.primaryLabel}
                  <ArrowRight className="size-4" />
                </Link>
                {section.secondaryLabel && section.secondaryHref && (
                  <Link
                    href={section.secondaryHref}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/10"
                  >
                    {section.secondaryLabel}
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
      }
      return (
        <CtaNote
          text={[section.title, fill(section.text)].filter(Boolean).join(" ")}
          primary={{ href: section.primaryHref, label: section.primaryLabel }}
          secondary={
            section.secondaryLabel && section.secondaryHref ? { href: section.secondaryHref, label: section.secondaryLabel } : undefined
          }
        />
      );

    case "requisites": {
      const { legal } = settings;
      const rows = [
        { label: "IBAN", value: legal.iban },
        { label: "Банк", value: legal.bank },
        { label: "Код ЄДРПОУ", value: legal.edrpou },
        { label: "Телефони", value: toPhoneContacts(settings.phones).map((phone) => phone.display).join(" · ") },
      ].filter((row) => row.value);
      return (
        <section>
          <Heading {...section} />
          <div className="max-w-2xl rounded-2xl border border-border bg-card p-5">
            <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold tracking-tight">{legal.name}</h3>
            <dl className="mt-3 divide-y divide-border text-sm">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[auto_1fr] gap-4 py-2.5">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="break-all text-right font-medium text-foreground tabular">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );
    }

    case "contacts":
      return <ContactsBlock settings={settings} />;
  }
}

type Contact = { icon: LucideIcon; label: string; value: string; href?: string; hint?: string };

function ContactsBlock({ settings }: { settings: SiteSettings }) {
  const phones = toPhoneContacts(settings.phones);
  const routeUrl = mapsUrl(settings.address.full);
  const contacts: Contact[] = [
    ...phones.map((phone, index) => ({
      icon: Phone,
      label: phone.label || (phones.length === 1 ? "Телефон" : `Телефон ${index + 1}`),
      value: phone.display,
      href: phone.href,
      hint: "Дзвінки за тарифами вашого оператора",
    })),
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, label: "Адреса", value: settings.address.full, href: routeUrl, hint: "Відкрити на карті" },
    {
      icon: Clock,
      label: "Графік роботи",
      value: formatOpenHours(settings.hours),
      hint: formatClosedDays(settings.hours) || undefined,
    },
  ];
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
      <div>
        <SectionHeading eyebrow="Звʼязок" title="Як з нами звʼязатися" />
        <ul className="space-y-3">
          {contacts.map((c) => (
            <li key={c.label}>
              <ContactRow {...c} />
            </li>
          ))}
        </ul>
        <a
          href={routeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Прокласти маршрут
          <ArrowUpRight className="size-4" />
        </a>
      </div>
      <div>
        <SectionHeading eyebrow="Зворотний звʼязок" title="Залишити звернення" />
        <ContactForm />
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, href, hint }: Contact) {
  const body = (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-medium text-foreground">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      {href && <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" />}
    </div>
  );
  if (!href) return body;
  const external = href.startsWith("http");
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="block">
      {body}
    </a>
  );
}
