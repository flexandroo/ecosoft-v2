"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackMetaPageView } from "@/utils/metaPixel";

/**
 * Next.js changes routes without reloading the document. Meta's base snippet
 * covers the initial URL; this tracker covers every subsequent client-side
 * navigation, including a return to the home page.
 */
export function MetaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const urlKey = query ? `${pathname}?${query}` : pathname;
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    if (previousUrl.current === null) {
      previousUrl.current = urlKey;
      return;
    }

    if (previousUrl.current === urlKey) return;
    previousUrl.current = urlKey;
    trackMetaPageView();
  }, [urlKey]);

  return null;
}
