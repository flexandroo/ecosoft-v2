import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PAGE_KEYS, PAGE_META } from "@/lib/pages-shared";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle, formatDateTime } from "../ui";

export const metadata: Metadata = { title: "Сторінки" };

export default async function PagesAdminPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("site_pages").select("key, updated_at");
  const edited = new Map((data ?? []).map((row) => [row.key as string, row.updated_at as string]));

  return (
    <>
      <PageTitle
        title="Сторінки"
        subtitle="Тексти інформаційних сторінок. Телефони, адреса, графік і реквізити беруться з «Налаштувань»."
      />
      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Сторінка</th>
              <th className="px-4 py-2.5 font-medium">Адреса</th>
              <th className="px-4 py-2.5 font-medium">Змінено</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {PAGE_KEYS.map((key) => (
              <tr key={key} className="hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/pages/${key}`} className="font-medium hover:text-primary">
                    {PAGE_META[key].label}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  <a
                    href={PAGE_META[key].path}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 font-mono text-[13px] text-muted-foreground hover:text-foreground"
                  >
                    {PAGE_META[key].path} <ExternalLink className="size-3.5" />
                  </a>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {edited.has(key) ? formatDateTime(edited.get(key)) : "Стандартний текст"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
