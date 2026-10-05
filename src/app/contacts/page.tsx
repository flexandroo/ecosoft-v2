import type { Metadata } from "next";
import { InfoPage, infoPageMetadata } from "@/components/site/info-page";

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("contacts");
}

export default function ContactsPage() {
  return <InfoPage pageKey="contacts" />;
}
