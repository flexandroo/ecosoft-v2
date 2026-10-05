"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-shared";

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

/** Makes the admin-managed public settings available to client components. */
export function SiteSettingsProvider({ value, children }: { value: SiteSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SettingsContext);
}
