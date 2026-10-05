"use client";

import { useRef, useState } from "react";
import { isValidUkrainianPhone } from "@/lib/validation";
import { pushGenerateLead } from "@/utils/gtmEcommerce";
import { createLeadIdentity, getMarketingAttribution } from "@/utils/marketing-attribution";

/**
 * Shared state + submit for every "call me back" form (header modal, inline
 * homepage form, ...). Keeps the /api/callback payload and the
 * generate_lead / Meta Lead tracking identical wherever the form is rendered.
 */
export function useCallbackRequest(source?: string) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const leadIdentity = useRef<ReturnType<typeof createLeadIdentity> | null>(null);

  const phoneValid = isValidUkrainianPhone(phone);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !phoneValid) return;
    setSubmitting(true);
    setError(null);
    leadIdentity.current ??= createLeadIdentity("CALL");
    const identity = leadIdentity.current;
    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          externalId: identity.externalId,
          eventId: identity.eventId,
          attribution: getMarketingAttribution(),
          name: name.trim(),
          phone: phone.trim(),
          company,
          source: source ?? "site",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; leadId?: string };
      if (!res.ok || !data.ok) throw new Error("failed");
      pushGenerateLead({ leadId: data.leadId ?? identity.externalId, leadType: "callback" });
      setSent(true);
    } catch {
      setError("Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.");
    } finally {
      setSubmitting(false);
    }
  }

  return { name, setName, phone, setPhone, company, setCompany, submitting, sent, error, phoneValid, submit };
}
