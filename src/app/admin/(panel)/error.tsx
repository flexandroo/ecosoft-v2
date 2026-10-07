"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, PageTitle } from "./ui";

/**
 * Keeps the admin sidebar on screen when a page or a server action fails
 * (database or network error) and shows the reason instead of a blank screen.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PageTitle title="Не вдалося виконати дію" />
      <Card className="max-w-2xl space-y-3">
        <p className="text-sm">
          Зміни могли не зберегтися. Спробуйте ще раз; якщо помилка повторюється — оновіть сторінку.
        </p>
        {error.message && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 font-mono text-xs break-words text-rose-900">{error.message}</p>
        )}
        <Button type="button" onClick={reset}>
          Спробувати ще раз
        </Button>
      </Card>
    </>
  );
}
