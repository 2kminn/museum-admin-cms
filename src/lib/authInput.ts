export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const email = normalizeEmail(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function toDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function toKoreanMobileDigits(value: string) {
  return toDigits(value).slice(0, 11);
}

export function formatKoreanMobile(digits: string) {
  const d = toDigits(digits).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export function isValidKoreanMobileDigits(digits: string) {
  const d = toDigits(digits);
  return d.length === 11 && d.startsWith("010");
}

