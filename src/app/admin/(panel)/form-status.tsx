"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { FormState } from "../actions";

export function SubmitButton({ children, pendingLabel = "Зберігаємо…" }: { children: React.ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="text-sm text-rose-700">{state.error}</p>;
  if (state.ok) return <p className="text-sm text-emerald-700">{state.ok}</p>;
  return null;
}
