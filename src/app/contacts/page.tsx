import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { PageHeader } from "@/components/site/page-header";
import { SectionHeading } from "@/components/site/content";
import { ContactForm } from "@/components/site/contact-form";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Звʼяжіться з Ecosoft: телефон, email, адреса та графік роботи. Залиште звернення — підберемо рішення під вашу воду.",
};

const ADDRESS =
  "08131, Київська обл., Бучанський р-н, с. Софіївська Борщагівка, вул. Київська, 3";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ADDRESS,
)}`;

type Contact = {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
  hint?: string;
};

const CONTACTS: Contact[] = [
  {
    icon: Phone,
    label: "Телефон",
    value: "0 800 300 999",
    href: "tel:+380800300999",
    hint: "Безкоштовно по Україні",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@ecosoft.ua",
    href: "mailto:info@ecosoft.ua",
  },
  {
    icon: MapPin,
    label: "Адреса",
    value: ADDRESS,
    href: MAPS_URL,
    hint: "Відкрити на карті",
  },
  {
    icon: Clock,
    label: "Графік роботи",
    value: "Пн–Пт: 09:00–18:00 · Сб: 10:00–15:00",
    hint: "Нд — вихідний",
  },
];

export default function ContactsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PageHeader
          title="Контакти"
          subtitle="Зателефонуйте, напишіть або залиште звернення — допоможемо підібрати систему очищення води під ваш обʼєкт."
          crumbs={[
            { href: "/", label: "Головна" },
            { label: "Контакти" },
          ]}
        />

        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
            {/* Contact details */}
            <div>
              <SectionHeading eyebrow="Звʼязок" title="Як з нами звʼязатися" />
              <ul className="space-y-3">
                {CONTACTS.map((c) => (
                  <li key={c.label}>
                    <ContactRow {...c} />
                  </li>
                ))}
              </ul>

              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Прокласти маршрут
                <ArrowUpRight className="size-4" />
              </a>
            </div>

            {/* Form */}
            <div>
              <SectionHeading
                eyebrow="Зворотний звʼязок"
                title="Залишити звернення"
              />
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ContactRow({ icon: Icon, label, value, href, hint }: Contact) {
  const body = (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 font-medium text-foreground">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      {href && (
        <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  if (!href) return body;
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block"
    >
      {body}
    </a>
  );
}
