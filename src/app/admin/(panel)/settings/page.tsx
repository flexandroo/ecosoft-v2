import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { crmConfigured } from "@/lib/crm";
import { mergeSettings } from "@/lib/settings-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { telegramConfigured } from "@/lib/telegram";
import { META_PIXEL_ID } from "@/utils/metaPixel";
import { Card, PageTitle } from "../ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Налаштування" };

export default async function SettingsPage() {
  const staff = await requireStaff();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const stored = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  const settings = mergeSettings(stored);
  const notifications = (stored.notifications ?? {}) as { telegramExtraChatIds?: string[] };

  const integrations = [
    { label: "Telegram-бот (основний чат)", ok: telegramConfigured(), hint: "TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID на сервері" },
    { label: "Зовнішня CRM (ecosoftcrm)", ok: crmConfigured(), hint: "Поки підключена — вона надсилає серверні події в Meta/GA4" },
    { label: "Meta Conversions API", ok: Boolean(process.env.META_CAPI_ACCESS_TOKEN), hint: "META_CAPI_ACCESS_TOKEN" },
    { label: "GA4 Measurement Protocol", ok: Boolean(process.env.GA4_API_SECRET && process.env.GA4_MEASUREMENT_ID), hint: "GA4_MEASUREMENT_ID і GA4_API_SECRET" },
  ];

  return (
    <>
      <PageTitle title="Налаштування" subtitle="Контакти, графік, реквізити і сповіщення — показуються на всьому сайті" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsForm
          initial={{ ...settings, telegramExtraChatIds: notifications.telegramExtraChatIds ?? [] }}
          canEdit={staff.role === "admin"}
        />
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold">Реклама та аналітика</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Meta Pixel</dt>
                <dd className="font-mono">{META_PIXEL_ID}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Google Tag Manager</dt>
                <dd className="font-mono">GTM-NGD37LTG</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Коди реклами змінюються лише в коді сайту, щоб випадкова правка не зупинила кампанії.
            </p>
          </Card>
          <Card>
            <h2 className="mb-3 font-semibold">Інтеграції на сервері</h2>
            <ul className="space-y-3 text-sm">
              {integrations.map((item) => (
                <li key={item.label} className="flex gap-2.5">
                  {item.ok ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.ok ? "Підключено" : "Не підключено"} · {item.hint}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
