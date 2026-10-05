"use client";

import { createContext, useContext } from "react";
import { DEFAULT_MENUS, type HeaderMenuItem } from "@/lib/menus-shared";

const HeaderMenuContext = createContext<HeaderMenuItem[]>(DEFAULT_MENUS.header);

/** Admin-managed header links for the client-side header. */
export function HeaderMenuProvider({ value, children }: { value: HeaderMenuItem[]; children: React.ReactNode }) {
  return <HeaderMenuContext.Provider value={value}>{children}</HeaderMenuContext.Provider>;
}

export function useHeaderMenu(): HeaderMenuItem[] {
  return useContext(HeaderMenuContext);
}
