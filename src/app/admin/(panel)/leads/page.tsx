import type { Metadata } from "next";
import { LeadsList, type LeadsSearchParams } from "./leads-list";

export const metadata: Metadata = { title: "Заявки" };

export default async function Page({ searchParams }: { searchParams: Promise<LeadsSearchParams> }) {
  return (
    <LeadsList
      basePath="/admin/leads"
      kinds={["callback","contact"]}
      title="Заявки"
      subtitle="Зворотні дзвінки та звернення з форм"
      params={await searchParams}
    />
  );
}
