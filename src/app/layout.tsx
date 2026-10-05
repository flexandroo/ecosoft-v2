import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/json-ld";
import { MetaPageViewTracker } from "@/components/analytics/meta-page-view-tracker";
import { SiteSettingsProvider } from "@/components/site/settings-context";
import { StoreCategoriesProvider } from "@/components/site/categories-context";
import { HeaderMenuProvider } from "@/components/site/menus-context";
import { getStoreCategories } from "@/lib/categories";
import { getSiteMenus } from "@/lib/menus";
import { getSiteSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/settings-shared";
import { META_PIXEL_ID } from "@/utils/metaPixel";

const GTM_ID = "GTM-NGD37LTG";

// Dev/preview builds set NEXT_PUBLIC_DISABLE_TRACKING=1 so test traffic never
// reaches Meta Pixel / GTM. Production never sets it: tracking stays on by default.
const TRACKING_ENABLED = process.env.NEXT_PUBLIC_DISABLE_TRACKING !== "1";

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
  metadataBase: new URL("https://sofiivkawater.com"),
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, categories, menus] = await Promise.all([getSiteSettings(), getStoreCategories(), getSiteMenus()]);
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        {TRACKING_ENABLED && (<>
        {/* Meta Pixel: direct base integration, independent from GTM timing. */}
        <Script id="meta-pixel-base" strategy="beforeInteractive">
          {`(function(w,d,s,u,id){
if(!w.fbq){
  var q=w.fbq=function(){
    var a=Array.prototype.slice.call(arguments),cmd=a[0],name=a[1],now=Date.now();
    q._inits=q._inits||{};q._events=q._events||{};
    if(cmd==='init'){
      if(q._inits[name])return;
      q._inits[name]=true;
    }
    if(cmd==='track'){
      var p=a[2]||{},simple=name==='PageView'||name==='Lead'||name==='Contact'||name==='FindLocation';
      var ids=Array.isArray(p.content_ids)?p.content_ids.join(','):'';
      var key=name+'|'+w.location.pathname+w.location.search+(simple?'':'|'+ids+'|'+String(p.value||''));
      var ttl=name==='PageView'?10000:1000;
      if(q._events[key]&&now-q._events[key]<ttl)return;
      q._events[key]=now;
    }
    q.callMethod?q.callMethod.apply(q,a):q.queue.push(a);
  };
  w._fbq=q;q.push=q;q.loaded=true;q.version='2.0';q.queue=[];
  var t=d.createElement(s);t.async=true;t.src=u;
  var first=d.getElementsByTagName(s)[0];first.parentNode.insertBefore(t,first);
}
w.fbq('init',id);w.fbq('track','PageView');
})(window,document,'script','https://connect.facebook.net/en_US/fbevents.js','${META_PIXEL_ID}');`}
        </Script>
        {/* Google Tag Manager */}
        <Script id="gtm-base" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        {/* End Google Tag Manager */}
        </>)}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {TRACKING_ENABLED && (<>
        <Suspense fallback={null}>
          <MetaPageViewTracker />
        </Suspense>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        </>)}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "OnlineStore",
                "@id": "https://sofiivkawater.com/#store",
                name: "Sofiivka Water — партнерський магазин Ecosoft",
                url: "https://sofiivkawater.com/",
                telephone: settings.phones.map((phone) => normalizePhone(phone.number)),
                email: settings.email,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: settings.address.street,
                  addressLocality: settings.address.locality,
                  addressRegion: settings.address.region,
                  postalCode: settings.address.postalCode,
                  addressCountry: "UA",
                },
              },
              {
                "@type": "WebSite",
                "@id": "https://sofiivkawater.com/#website",
                url: "https://sofiivkawater.com/",
                name: "Sofiivka Water",
                publisher: { "@id": "https://sofiivkawater.com/#store" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://sofiivkawater.com/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
        <SiteSettingsProvider value={settings}>
          <StoreCategoriesProvider value={categories}>
            <HeaderMenuProvider value={menus.header}>{children}</HeaderMenuProvider>
          </StoreCategoriesProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
