import { MenuLink } from "@/components/site/menu-link";
import { getSiteMenus } from "@/lib/menus";
import { getSiteSettings } from "@/lib/settings";
import { SOCIAL_LABELS, toPhoneContacts, type SiteSettings } from "@/lib/settings-shared";
import { SOCIAL_BUTTON_STYLE, SocialIcon } from "@/components/site/social-icon";

// Brand column + up to four menu columns.
const GRID_COLS = [
  "",
  "md:grid-cols-[1.5fr_1fr]",
  "md:grid-cols-[1.5fr_1fr_1fr]",
  "md:grid-cols-[1.5fr_1fr_1fr_1fr]",
  "sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]",
];

export async function Footer() {
  const [settings, menus] = await Promise.all([getSiteSettings(), getSiteMenus()]);
  const PHONE_CONTACTS = toPhoneContacts(settings.phones);
  const socials = (Object.keys(SOCIAL_LABELS) as (keyof SiteSettings["socials"])[]).filter((key) => settings.socials[key]);
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1600px] px-4 py-14 md:px-8 md:py-16">
        <div className={`grid gap-10 ${GRID_COLS[menus.footer.length] ?? GRID_COLS[3]}`}>
          <div>
            <div className="font-[family-name:var(--font-manrope)] text-2xl font-extrabold lowercase tracking-tight text-primary">
              ecosoft
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Офіційний партнерський магазин Ecosoft. Підбираємо, доставляємо, монтуємо
              та обслуговуємо системи очищення води для дому та бізнесу.
            </p>
            <div className="mt-4 flex flex-col items-start gap-1">
              {PHONE_CONTACTS.map((phone) => (
                <a
                  key={phone.raw}
                  href={phone.href}
                  className="font-[family-name:var(--font-manrope)] text-lg font-bold text-foreground transition-colors hover:text-primary"
                >
                  {phone.display}
                </a>
              ))}
            </div>
            {socials.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-semibold text-foreground">Ми в соцмережах</div>
                <ul className="mt-3 flex flex-wrap gap-3" aria-label="Соцмережі">
                  {socials.map((key) => (
                    <li key={key}>
                      <a
                        href={settings.socials[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={SOCIAL_LABELS[key]}
                        title={SOCIAL_LABELS[key]}
                        className={`grid size-11 place-items-center rounded-full text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${SOCIAL_BUTTON_STYLE[key]}`}
                      >
                        <SocialIcon network={key} className="size-5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {menus.footer.map((col, i) => (
            <div key={i}>
              <div className="text-sm font-semibold">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <MenuLink
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </MenuLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} Партнерський магазин Ecosoft.</div>
          <div className="max-w-md md:text-right">
            Ecosoft — український виробник систем очищення води. Цей сайт — офіційний
            партнерський магазин: продаж, підбір, монтаж і сервіс.
          </div>
        </div>
      </div>
    </footer>
  );
}
