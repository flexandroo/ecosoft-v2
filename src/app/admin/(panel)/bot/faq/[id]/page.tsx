import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../../ui";
import { FaqForm } from "../../forms";

export const metadata: Metadata = { title: "Питання FAQ" };

export default async function BotFaqItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let faq = null;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await createSessionClient();
    const { data } = await supabase.from("bot_faq").select("id, question, answer, sort, is_published").eq("id", id).maybeSingle();
    if (!data) notFound();
    faq = data;
  }
  return (
    <>
      <Link href="/admin/bot/faq" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> FAQ
      </Link>
      <PageTitle title={faq?.question ?? "Нове питання"} />
      <FaqForm key={faq?.id ?? "new"} faq={faq} />
    </>
  );
}
