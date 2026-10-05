import Link from "next/link";
import { isExternalHref } from "@/lib/menus-shared";

/** Menu entry: site pages go through next/link, external sites open in a new tab. */
export function MenuLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      {...(isExternalHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
