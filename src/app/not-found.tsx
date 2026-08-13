import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex flex-1 items-center bg-muted/30 px-4 pb-20 pt-32 md:px-8">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm md:p-12">
          <p className="font-[family-name:var(--font-manrope)] text-6xl font-extrabold tracking-tight text-primary tabular">
            404
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-2xl font-bold tracking-tight md:text-3xl">
            Такої сторінки немає
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Можливо, посилання застаріло. Перейдіть до каталогу або знайдіть потрібну модель через пошук.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/catalog"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              До каталогу <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/search?focus=search"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Search className="size-4" /> Пошук
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Home className="size-4" /> Головна
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
