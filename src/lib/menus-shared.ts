// Header and footer navigation: types, defaults and validation. Safe to import
// from client components. Defaults are the menus the site used before the
// admin existed, so an empty or unreachable database changes nothing.

export type MenuLink = { label: string; href: string };
/** Header item; `desktop` = utility bar above the header, `mobile` = phone drawer. */
export type HeaderMenuItem = MenuLink & { desktop: boolean; mobile: boolean };
export type FooterColumn = { title: string; links: MenuLink[] };
export type SiteMenus = { header: HeaderMenuItem[]; footer: FooterColumn[] };

export const MENU_LIMITS = { headerItems: 10, footerColumns: 4, footerLinks: 12, label: 60, href: 300 } as const;

export const DEFAULT_MENUS: SiteMenus = {
  header: [
    { label: "Рішення", href: "/solutions", desktop: false, mobile: true },
    { label: "Доставка і оплата", href: "/delivery", desktop: true, mobile: true },
    { label: "Повернення та обмін", href: "/returns", desktop: true, mobile: true },
    { label: "Блог", href: "/blog", desktop: true, mobile: true },
    { label: "Про нас", href: "/about", desktop: true, mobile: true },
    { label: "Контакти", href: "/contacts", desktop: true, mobile: true },
  ],
  footer: [
    {
      title: "Каталог",
      links: [
        { href: "/catalog/reverse-osmosis", label: "Зворотний осмос" },
        { href: "/catalog/filtration-systems", label: "Фільтраційні системи" },
        { href: "/catalog/mainline-filters", label: "Магістральні фільтри" },
        { href: "/catalog/ro-cartridges", label: "Картриджі" },
        { href: "/catalog/horeca", label: "Для бізнесу (HoReCa)" },
      ],
    },
    {
      title: "Компанія",
      links: [
        { href: "/about", label: "Про нас" },
        { href: "/blog", label: "Блог" },
        { href: "/contacts", label: "Контакти" },
      ],
    },
    {
      title: "Клієнтам",
      links: [
        { href: "/delivery", label: "Доставка та оплата" },
        { href: "/returns", label: "Повернення та обмін" },
        { href: "/contacts", label: "Підбір та консультація" },
        { href: "/privacy", label: "Політика конфіденційності" },
      ],
    },
  ],
};

/** Site path ("/delivery"), full https:// URL, phone or email link. */
export function isValidMenuHref(href: string): boolean {
  return /^\/(?!\/)\S*$/.test(href) || /^https:\/\/[^\s/]+\.[^\s]+$/.test(href) || /^(tel|mailto):\S+$/.test(href);
}

/** Links that leave the site open in a new tab. */
export function isExternalHref(href: string): boolean {
  return href.startsWith("https://");
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

function toLink(value: unknown): MenuLink {
  const v = (value ?? {}) as Record<string, unknown>;
  return { label: text(v.label, MENU_LIMITS.label), href: text(v.href, MENU_LIMITS.href) };
}

function toHeaderItem(value: unknown): HeaderMenuItem {
  const v = (value ?? {}) as Record<string, unknown>;
  return { ...toLink(value), desktop: v.desktop !== false, mobile: v.mobile !== false };
}

function toColumn(value: unknown): FooterColumn {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    title: text(v.title, MENU_LIMITS.label),
    links: (Array.isArray(v.links) ? v.links : []).map(toLink),
  };
}

const usable = (link: MenuLink) => Boolean(link.label && isValidMenuHref(link.href));

/** Stored rows over defaults: a stored menu replaces the default one; broken items are dropped. */
export function mergeMenus(stored: Partial<Record<keyof SiteMenus, unknown>>): SiteMenus {
  return {
    header: Array.isArray(stored.header)
      ? stored.header.map(toHeaderItem).filter(usable).slice(0, MENU_LIMITS.headerItems)
      : DEFAULT_MENUS.header,
    footer: Array.isArray(stored.footer)
      ? stored.footer
          .map(toColumn)
          .map((col) => ({ ...col, links: col.links.filter(usable).slice(0, MENU_LIMITS.footerLinks) }))
          .filter((col) => col.title || col.links.length)
          .slice(0, MENU_LIMITS.footerColumns)
      : DEFAULT_MENUS.footer,
  };
}

/** Strict check of an admin form payload; rows left completely empty are ignored. */
export function validateMenus(input: unknown): { menus: SiteMenus } | { error: string } {
  const v = (input ?? {}) as Record<string, unknown>;
  const blank = (link: MenuLink) => !link.label && !link.href;
  const check = (link: MenuLink, where: string): string | null => {
    if (!link.label) return `${where}: вкажіть назву пункту.`;
    if (!link.href) return `${where}: вкажіть посилання для «${link.label}».`;
    if (!isValidMenuHref(link.href)) {
      return `${where}: посилання «${link.href}» має починатися з «/» (сторінка сайту) або з https://.`;
    }
    return null;
  };

  const header = (Array.isArray(v.header) ? v.header : []).map(toHeaderItem).filter((item) => !blank(item));
  if (header.length > MENU_LIMITS.headerItems) return { error: `У шапці може бути до ${MENU_LIMITS.headerItems} пунктів.` };
  for (const item of header) {
    const error = check(item, "Шапка");
    if (error) return { error };
  }

  const footer = (Array.isArray(v.footer) ? v.footer : [])
    .map(toColumn)
    .map((col) => ({ ...col, links: col.links.filter((link) => !blank(link)) }))
    .filter((col) => col.title || col.links.length);
  if (footer.length > MENU_LIMITS.footerColumns) return { error: `У футері може бути до ${MENU_LIMITS.footerColumns} колонок.` };
  for (const col of footer) {
    if (!col.title) return { error: "Футер: вкажіть заголовок колонки." };
    if (!col.links.length) return { error: `Футер: колонка «${col.title}» порожня.` };
    if (col.links.length > MENU_LIMITS.footerLinks) {
      return { error: `Футер: у колонці «${col.title}» може бути до ${MENU_LIMITS.footerLinks} посилань.` };
    }
    for (const link of col.links) {
      const error = check(link, `Футер, «${col.title}»`);
      if (error) return { error };
    }
  }

  return { menus: { header, footer } };
}
