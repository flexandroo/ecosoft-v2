import type { Metadata } from "next";
import { InfoPage, infoPageMetadata } from "@/components/site/info-page";

export function generateMetadata(): Promise<Metadata> {
  return infoPageMetadata("returns");
}

export default function ReturnsPage() {
  return <InfoPage pageKey="returns" />;
}
