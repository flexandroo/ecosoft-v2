import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PAGE_META, isPageKey, mergePage } from "@/lib/pages-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle, formatDateTime } from "../../ui";
import { PageEditor } from "./page-editor";

export const metadata: Metadata = { title: "Сторінка" };

export default async function PageEditPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isPageKey(key)) notFound();
  const supabase = await createSessionClient();
  const { data } = await supabase.from("site_pages").select("content, updated_at").eq("key", key).maybeSingle();
  const page = mergePage(key, data?.content);

  return (
    <>
      <Link href="/admin/pages" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Сторінки
      </Link>
      <PageTitle
        title={PAGE_META[key].label}
        subtitle={data ? `Змінено ${formatDateTime(data.updated_at)}` : "Зараз на сайті стандартний текст"}
      />
      <PageEditor pageKey={key} initial={page} edited={Boolean(data)} />
    </>
  );
}
