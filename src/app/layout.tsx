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

export const metadata: Metadata = {
  title: {
    default: "Ecosoft — Системи очищення води в Україні",
    template: "%s · Ecosoft",
  },
  description:
    "Фільтри, системи зворотного осмосу, помʼякшувачі та картриджі. Доставка по Україні, монтаж під ключ, сертифікована якість.",
  metadataBase: new URL("https://ecosoft.ua"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Ecosoft",
    title: "Ecosoft — Системи очищення води в Україні",
    description:
      "Фільтри, системи зворотного осмосу, помʼякшувачі та картриджі. Доставка по Україні, монтаж під ключ, сертифікована якість.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ecosoft — Системи очищення води в Україні",
    description:
      "Фільтри, системи зворотного осмосу, помʼякшувачі та картриджі. Доставка по Україні, монтаж під ключ, сертифікована якість.",
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
