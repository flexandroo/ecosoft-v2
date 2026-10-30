import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../../ui";
import { GuideForm } from "../../forms";

export const metadata: Metadata = { title: "Гайд" };

export default async function BotGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let guide = null;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await createSessionClient();
    const { data } = await supabase.from("bot_guides").select("id, title, body, video_url, sort, is_published").eq("id", id).maybeSingle();
    if (!data) notFound();
    guide = data;
  }
  return (
    <>
      <Link href="/admin/bot/guides" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Гайди
      </Link>
      <PageTitle title={guide?.title ?? "Новий гайд"} />
      <GuideForm key={guide?.id ?? "new"} guide={guide} />
    </>
  );
}
