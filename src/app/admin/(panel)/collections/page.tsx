import type { Metadata } from "next";
import Link from "next/link";
import { createSessionClient } from "@/lib/supabase/server";
import { Card, PageTitle } from "../ui";
import { CollectionRowControls, NewCollectionForm } from "./controls";

export const metadata: Metadata = { title: "Підбірки" };

export default async function CollectionsPage() {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("collections")
    .select("id, slug, title, show_on_home, sort, collection_items(count)")
    .order("sort");
  const collections = (data ?? []) as unknown as {
    id: string;
    slug: string;
    title: string;
    show_on_home: boolean;
    collection_items: { count: number }[];
  }[];

  return (
    <>
      <PageTitle
        title="Підбірки"
        subtitle="Добірки товарів з ручним порядком. Позначені «На головній» показуються стрічками у цьому порядку."
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-x-auto p-0 sm:p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Підбірка</th>
                <th className="px-4 py-2.5 font-medium">Товарів</th>
                <th className="px-4 py-2.5 font-medium">На головній</th>
                <th className="px-4 py-2.5 text-right font-medium">Порядок</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {collections.map((c, index) => (
                <tr key={c.id} className="hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/collections/${c.id}`} className="font-medium hover:text-primary">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">{c.collection_items[0]?.count ?? 0}</td>
                  <CollectionRowControls
                    id={c.id}
                    onHome={c.show_on_home}
                    first={index === 0}
                    last={index === collections.length - 1}
                  />
                </tr>
              ))}
              {!collections.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Підбірок ще немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Нова підбірка</h2>
          <NewCollectionForm />
        </Card>
      </div>
    </>
  );
}
