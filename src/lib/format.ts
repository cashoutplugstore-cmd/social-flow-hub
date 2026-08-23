export function money(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function num(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-US");
}

export function dateAr(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function orderTotal(pricePerUnit: number, unitSize: number, quantity: number) {
  return Math.round(((pricePerUnit * quantity) / Math.max(unitSize, 1)) * 100) / 100;
}

export const SITE_NAME = "ViralHub";
export const SITE_TAGLINE = "مركز خدمات السوشيال ميديا";
