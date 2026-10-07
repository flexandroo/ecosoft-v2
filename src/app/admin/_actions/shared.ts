import "server-only";
import { requireStaff } from "@/lib/admin/auth";

export type { FormState } from "./form-state";

export function str(fd: FormData, key: string, max = 2000): string {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function optionalNumber(fd: FormData, key: string): number | null {
  const raw = str(fd, key, 32).replace(/\s/g, "").replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

export function optionalDate(fd: FormData, key: string): string | null {
  const raw = str(fd, key, 40);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function oneOf<T extends string>(list: readonly { id: T }[], value: string, fallback: T): T {
  return list.some((item) => item.id === value) ? (value as T) : fallback;
}


export async function requireAdmin() {
  const staff = await requireStaff();
  if (staff.role !== "admin") throw new Error("Лише адміністратор може керувати працівниками.");
  return staff;
}
