export const META_PIXEL_ID = "2319473598859580";

type MetaPixelParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Send an event directly to Meta Pixel. The base snippet in the root layout
 * creates the queue before hydration, so events are retained while
 * fbevents.js is still loading.
 */
export function trackMetaEvent(
  event: string,
  params: MetaPixelParams = {},
  eventId?: string,
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;

  if (eventId) {
    window.fbq("track", event, params, { eventID: eventId });
    return;
  }

  window.fbq("track", event, params);
}

export function trackMetaPageView(): void {
  trackMetaEvent("PageView");
}
