"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { CategoryKey } from "@/lib/products";

const STORAGE_KEY = "ecosoft-cart-v1";

// Denormalised snapshot stored in the cart so the client bundle does not need
// to import the full (heavy) PRODUCTS catalogue just to render the cart.
export type CartLine = {
  slug: string;
  name: string;
  price: number;
  image?: string;
  category: CategoryKey;
  qty: number;
};

export type CartItemInput = Omit<CartLine, "qty">;

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (l): l is CartLine =>
        !!l &&
        typeof l.slug === "string" &&
        typeof l.name === "string" &&
        typeof l.price === "number",
    )
    .map((l) => ({
      slug: l.slug,
      name: l.name,
      price: l.price,
      image: typeof l.image === "string" ? l.image : undefined,
      category: l.category,
      qty: Math.max(1, Math.floor(Number(l.qty)) || 1),
    }));
}

// ---- Module-level external store (subscribed to via useSyncExternalStore) ----
const EMPTY: CartLine[] = [];
let state: CartLine[] = EMPTY;
let initialized = false;
const listeners = new Set<() => void>();

function ensureInit() {
  if (initialized) return;
  initialized = true;
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = sanitize(JSON.parse(raw));
  } catch {
    /* ignore corrupt storage */
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  ensureInit();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = e.newValue ? sanitize(JSON.parse(e.newValue)) : EMPTY;
    } catch {
      state = EMPTY;
    }
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureInit();
  return state;
}

function getServerSnapshot() {
  return EMPTY;
}

function update(updater: (prev: CartLine[]) => CartLine[]) {
  ensureInit();
  state = updater(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private-mode errors */
  }
  emit();
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // true on the client after hydration, false during SSR — lets the UI avoid a
  // flash of "empty cart" before localStorage is read.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const add = useCallback((item: CartItemInput, qty = 1) => {
    const amount = Math.max(1, Math.floor(qty) || 1);
    update((prev) => {
      const i = prev.findIndex((l) => l.slug === item.slug);
      if (i === -1) return [...prev, { ...item, qty: amount }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + amount };
      return next;
    });
  }, []);

  const remove = useCallback((slug: string) => {
    update((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    update((prev) =>
      qty <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, qty: Math.floor(qty) } : l)),
    );
  }, []);

  const clear = useCallback(() => update(() => EMPTY), []);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const total = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.qty, 0),
    [lines],
  );

  return { lines, count, total, hydrated, add, remove, setQty, clear };
}
