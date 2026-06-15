import { Award, Truck, Wrench, HeadphonesIcon } from "lucide-react";

const ITEMS = [
  {
    icon: Award,
    title: "Сертифіковано NSF",
    desc: "Міжнародні стандарти якості",
  },
  {
    icon: Truck,
    title: "Доставка по Україні",
    desc: "За 1–3 дні, безкоштовно від 5000 ₴",
  },
  {
    icon: Wrench,
    title: "Монтаж під ключ",
    desc: "Сертифіковані інженери",
  },
  {
    icon: HeadphonesIcon,
    title: "Сервіс 24/7",
    desc: "Підтримка та заміна картриджів",
  },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px overflow-hidden bg-border md:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3 bg-card p-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="size-5" />
            </span>
            <div>
              <div className="text-sm font-semibold">{item.title}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
