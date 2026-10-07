"use client";

import { useActionState, useEffect, useRef } from "react";
import { addStaff } from "../../_actions/staff";
import type { FormState } from "../../_actions/form-state";
import { FormMessage, SubmitButton } from "../form-status";
import { Field, inputClass } from "../ui";

export function AddStaffForm() {
  const [state, action] = useActionState<FormState, FormData>(addStaff, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-3 space-y-3">
      <Field label="Імʼя">
        <input name="name" className={inputClass} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" required className={inputClass} />
      </Field>
      <Field label="Початковий пароль" hint="Мінімум 10 символів. Передайте працівнику особисто.">
        <input name="password" type="text" minLength={10} required autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="Роль">
        <select name="role" defaultValue="manager" className={inputClass}>
          <option value="manager">Менеджер</option>
          <option value="admin">Адміністратор</option>
        </select>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Додаємо…">Додати</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
