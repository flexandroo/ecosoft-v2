import type { Metadata } from "next";
import { InfoPage, infoPageMetadata } from "@/components/site/info-page";

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("privacy");
}

export default function PrivacyPage() {
  return <InfoPage pageKey="privacy" />;
}
