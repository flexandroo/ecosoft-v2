"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Errors from the admin layout itself (e.g. the staff check could not reach the database). */
export default function AdminRootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="font-heading text-xl font-bold">Адмінка тимчасово недоступна</h1>
        <p className="text-sm text-muted-foreground">Не вдалося зʼєднатися з базою даних. Спробуйте ще раз за хвилину.</p>
        {error.message && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 font-mono text-xs break-words text-rose-900">{error.message}</p>
        )}
        <Button type="button" onClick={reset} className="w-full">
          Спробувати ще раз
        </Button>
      </div>
    </main>
  );
}
