/**
 * Compact catalogue header: just the section title — no banner, no
 * breadcrumbs, no divider — so the first row of products is visible as soon
 * as the page opens. (Breadcrumbs stay on product pages.)
 */
export function CatalogHeader({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pt-5 md:px-8 md:pt-6">
      <h1 className="font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
        {title}
      </h1>
    </div>
  );
}
