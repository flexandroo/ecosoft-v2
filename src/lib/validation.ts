export function isValidUkrainianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("380") ? `0${digits.slice(3)}` : digits;
  return /^0\d{9}$/.test(normalized) && !/^0+$/.test(normalized);
}

export function isValidEmail(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
