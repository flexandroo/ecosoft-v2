"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "../_actions/session";
import type { FormState } from "../_actions/form-state";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, null);

  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 h-10 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Пароль</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 h-10 w-full rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-ring/40"
        />
      </label>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <Button type="submit" size="lg" className="h-10 w-full" disabled={pending}>
        {pending ? "Входимо…" : "Увійти"}
      </Button>
    </form>
  );
}
