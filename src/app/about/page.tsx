import type { Metadata } from "next";
import { InfoPage, infoPageMetadata } from "@/components/site/info-page";

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("about");
}

export default function AboutPage() {
  return <InfoPage pageKey="about" />;
}
