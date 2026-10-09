import type { SiteSettings } from "@/lib/settings-shared";

type SocialKey = keyof SiteSettings["socials"];

/** Brand colour of each network's round button (Instagram uses its gradient). */
export const SOCIAL_BUTTON_STYLE: Record<SocialKey, string> = {
  instagram: "bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285aeb_90%)]",
  facebook: "bg-[#1877f2]",
  telegram: "bg-[#229ed9]",
  viber: "bg-[#7360f2]",
  youtube: "bg-[#ff0000]",
  tiktok: "bg-[#010101]",
};

/** Simple white glyphs drawn for a 24×24 box; recognisable at button size. */
export function SocialIcon({ network, className }: { network: SocialKey; className?: string }) {
  const common = { viewBox: "0 0 24 24", className, "aria-hidden": true } as const;
  switch (network) {
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8Z" />
          <path d="m10 15 5.2-3L10 9v6Z" className="fill-[#ff0000]" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common} fill="currentColor">
          <path d="M20.7 4.1 2.9 11c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.7 5.4c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.5c.3-1.3-.5-1.9-1.4-1.5Zm-3.4 4.3-8 7.2-.3 3.3-1.6-5 9.5-6c.4-.3.8-.1.4.5Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4A20 20 0 0 0 14.3 4c-2.2 0-3.8 1.4-3.8 3.9v2.6H8v3h2.5V21h3Z" />
        </svg>
      );
    case "viber":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3c5 0 8 2.4 8 7.5S17 18 12 18c-.8 0-1.5 0-2.2-.2L6.5 20v-3.2C4.9 15.6 4 13.5 4 10.5 4 5.4 7 3 12 3Z" />
          <path d="M9.5 8.5c.4 1.8 1.7 3.4 3.5 4.3l.9-.9c.2-.2.5-.2.7-.1l1.2.7c.3.2.3.5.1.8-.5.7-1.3 1-2.2.8a7 7 0 0 1-5-5c-.2-.9.1-1.7.8-2.2.3-.2.6-.1.8.1l.7 1.2c.1.2.1.5-.1.7l-.4.6Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.5 3h-3v12a2.5 2.5 0 1 1-2.5-2.5c.3 0 .6 0 .9.1V9.5a5.5 5.5 0 1 0 4.6 5.5V9a7 7 0 0 0 4 1.3v-3A4 4 0 0 1 16.5 3Z" />
        </svg>
      );
  }
}
