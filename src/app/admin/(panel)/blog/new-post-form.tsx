"use client";

import { useActionState } from "react";
import { POST_KINDS, type PostKind } from "@/lib/posts-shared";
import { createPost, type FormState } from "../../actions";
import { FormMessage, SubmitButton } from "../form-status";
import { Field, inputClass } from "../ui";

export function NewPostForm({ defaultKind }: { defaultKind: PostKind }) {
  const [state, action] = useActionState<FormState, FormData>(createPost, null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Тип">
        <select name="kind" defaultValue={defaultKind} className={inputClass}>
          {POST_KINDS.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Заголовок" hint="Запис створиться чернеткою: на сайті зʼявиться, коли ви його опублікуєте.">
        <input name="title" required maxLength={200} className={inputClass} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Створюємо…">Створити</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
