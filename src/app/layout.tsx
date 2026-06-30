import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const SITE_DESCRIPTION =
  "Офіційний партнерський магазин Ecosoft. Підбираємо, доставляємо, монтуємо та обслуговуємо системи очищення води для квартири, будинку та бізнесу. Доставка по Україні, монтаж під ключ.";

export const metadata: Metadata = {
  title: {
    default: "Системи очищення води Ecosoft — офіційний партнерський магазин",
    template: "%s · Магазин Ecosoft",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://ecosoft.ua"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Магазин Ecosoft",
    title: "Системи очищення води Ecosoft — офіційний партнерський магазин",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Системи очищення води Ecosoft — офіційний партнерський магазин",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
