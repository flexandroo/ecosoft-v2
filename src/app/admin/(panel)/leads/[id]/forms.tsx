"use client";

import { useActionState, useEffect, useRef } from "react";
import { LEAD_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@/lib/admin/constants";
import { addLeadComment, updateLead } from "../../../_actions/leads";
import type { FormState } from "../../../_actions/form-state";
import { FormMessage, SubmitButton } from "../../form-status";
import { Field, inputClass, textareaClass } from "../../ui";

type ManagedLead = {
  id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  assigned_to: string | null;
  manager_note: string | null;
  address: string | null;
};

export function LeadManageForm({ lead, staff }: { lead: ManagedLead; staff: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(updateLead, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={lead.id} />
      <Field label="Статус">
        <select name="status" defaultValue={lead.status} className={inputClass}>
          {LEAD_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Відповідальний">
        <select name="assigned_to" defaultValue={lead.assigned_to ?? ""} className={inputClass}>
          <option value="">— не призначено —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Оплата">
          <select name="payment_method" defaultValue={lead.payment_method} className={inputClass}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Статус оплати">
          <select name="payment_status" defaultValue={lead.payment_status} className={inputClass}>
            {PAYMENT_STATUSES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Адреса доставки">
        <input name="address" defaultValue={lead.address ?? ""} className={inputClass} />
      </Field>
      <Field label="Нотатка менеджера">
        <textarea name="manager_note" defaultValue={lead.manager_note ?? ""} rows={3} className={textareaClass} />
      </Field>
      <p className="text-xs text-muted-foreground">
        Статус «Успішно завершена» передає продаж (Purchase) у Meta та GA4 для оптимізації реклами.
      </p>
      <div className="flex items-center gap-3">
        <SubmitButton>Зберегти</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function LeadCommentForm({ id }: { id: string }) {
  const [state, action] = useActionState<FormState, FormData>(addLeadComment, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <textarea name="text" rows={2} placeholder="Коментар до заявки…" className={textareaClass} required />
      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Додаємо…">Додати коментар</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
