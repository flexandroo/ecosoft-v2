import type { Metadata } from "next";
import { supabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: { absolute: "Вхід · Адмінка Sofiivka Water" },
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; denied?: string }>;
}) {
  const { next, denied } = await searchParams;
  const safeNext = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sofiivka Water</p>
        <h1 className="mt-1 font-heading text-2xl font-bold">Вхід в адмінку</h1>
        {!supabaseConfigured() ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            База даних ще не підключена: задайте NEXT_PUBLIC_SUPABASE_URL і
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
          </p>
        ) : (
          <>
            {denied && (
              <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
                Цей акаунт не має доступу до адмінки.
              </p>
            )}
            <LoginForm next={safeNext} />
          </>
        )}
      </div>
    </main>
  );
}
