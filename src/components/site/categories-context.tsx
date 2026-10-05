"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CATEGORIES, type StoreCategory } from "@/lib/categories-shared";

const CategoriesContext = createContext<StoreCategory[]>(DEFAULT_CATEGORIES);

/** Admin-managed category names/order for client components (header menu, pills). */
export function StoreCategoriesProvider({ value, children }: { value: StoreCategory[]; children: React.ReactNode }) {
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

/** Visible categories in admin order. */
export function useStoreCategories(): StoreCategory[] {
  return useContext(CategoriesContext).filter((c) => !c.hidden);
}
