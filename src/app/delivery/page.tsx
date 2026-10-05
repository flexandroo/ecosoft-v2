import type { Metadata } from "next";
import { InfoPage, infoPageMetadata } from "@/components/site/info-page";

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("delivery");
}

export default function DeliveryPage() {
  return <InfoPage pageKey="delivery" />;
}
