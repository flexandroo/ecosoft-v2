import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { PageTitle } from "../../ui";
import { BannerForm, type EditableBanner } from "./banner-form";

export const metadata: Metadata = { title: "Банер" };

const EMPTY: EditableBanner = {
  id: "",
  placement: "hero",
  eyebrow: "",
  title: "",
  subtitle: "",
  cta_label: "Детальніше",
  href: "/catalog",
  image_desktop: "",
  image_mobile: "",
  theme: "dark",
  sort: 0,
  is_active: true,
  starts_at: null,
  ends_at: null,
};

export default async function BannerEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  let banner = EMPTY;
  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await createSessionClient();
    const { data } = await supabase.from("banners").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    banner = data as EditableBanner;
  }

  return (
    <>
      <div className="mb-2 text-sm">
        <Link href="/admin/banners" className="text-muted-foreground hover:text-foreground">
          ← Банери
        </Link>
      </div>
      <PageTitle title={banner.id ? banner.title : "Новий банер"} />
      {created && <p className="mb-4 text-sm text-emerald-700">Банер створено.</p>}
      <BannerForm banner={banner} />
    </>
  );
}
