"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/auth";
import { PAYMENT_METHODS, PAYMENT_STATUSES, isLeadStatus } from "@/lib/admin/constants";
import { crmConfigured } from "@/lib/crm";
import { dispatchConversion, type ConversionLead } from "@/lib/conversions";
import { createSessionClient } from "@/lib/supabase/server";
import type { Json, TablesUpdate } from "@/lib/supabase/database.types";
import { type FormState, str, oneOf } from "./shared";

const CONVERSION_COLUMNS =
  "id, external_id, phone, email, customer_name, items, total, currency, lead_event_id, " +
  "landing_page, utm_source, utm_medium, source, fbp, fbc, ga_client_id, client_ip, user_agent, " +
  "created_at, completed_at, tracking";

export async function updateLead(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const id = str(fd, "id", 64);
  const status = str(fd, "status", 40);
  if (!isLeadStatus(status)) return { error: "Невідомий статус." };

  const { data: current, error: readError } = await supabase
    .from("leads")
    .select("status, manager_note, assigned_to, payment_method, payment_status, address")
    .eq("id", id)
    .single();
  if (readError || !current) return { error: "Заявку не знайдено." };

  const changes: TablesUpdate<"leads"> = {
    status,
    manager_note: str(fd, "manager_note", 5000) || null,
    assigned_to: str(fd, "assigned_to", 64) || null,
    payment_method: oneOf(PAYMENT_METHODS, str(fd, "payment_method", 40), "none"),
    payment_status: oneOf(PAYMENT_STATUSES, str(fd, "payment_status", 40), "unpaid"),
    address: str(fd, "address", 500) || null,
  };
  const becameCompleted = status === "completed" && current.status !== "completed";
  if (becameCompleted) changes.completed_at = new Date().toISOString();

  const { error } = await supabase.from("leads").update(changes).eq("id", id);
  if (error) return { error: `Не вдалося зберегти: ${error.message}` };

  const diff: Record<string, { from: Json | undefined; to: Json | undefined }> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (key in current && current[key as keyof typeof current] !== value) {
      diff[key] = { from: current[key as keyof typeof current], to: value };
    }
  }
  if (Object.keys(diff).length) {
    await supabase.from("lead_events").insert({
      lead_id: id,
      actor: staff.userId,
      type: diff.status ? "status" : "update",
      data: diff,
    });
  }

  // Purchase conversion for ads, exactly when the legacy CRM used to send it.
  if (becameCompleted && !crmConfigured()) {
    const { data: lead } = await supabase.from("leads").select(CONVERSION_COLUMNS).eq("id", id).single();
    if (lead) {
      const row = lead as unknown as ConversionLead & { tracking: Record<string, unknown> };
      const result = await dispatchConversion(row, "purchase");
      if (result.state !== "unconfigured") {
        await supabase
          .from("leads")
          .update({ tracking: { ...(row.tracking ?? {}), purchase: result } })
          .eq("id", id);
      }
    }
  }

  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
  return { ok: "Збережено" };
}

export async function addLeadComment(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireStaff();
  const id = str(fd, "id", 64);
  const text = str(fd, "text", 3000);
  if (!text) return { error: "Порожній коментар." };
  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("lead_events")
    .insert({ lead_id: id, actor: staff.userId, type: "comment", data: { text } });
  if (error) return { error: error.message };
  revalidatePath(`/admin/leads/${id}`);
  return { ok: "Додано" };
}
