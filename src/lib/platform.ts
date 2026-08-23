import {
  Facebook,
  Instagram,
  Megaphone,
  MessageCircle,
  Music2,
  Palette,
  Send,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

export const PLATFORM_META: Record<
  string,
  { label: string; icon: LucideIcon; accentClass: string; ringClass: string }
> = {
  tiktok: { label: "تيك توك", icon: Music2, accentClass: "text-tiktok", ringClass: "bg-tiktok/12" },
  youtube: {
    label: "يوتيوب",
    icon: Youtube,
    accentClass: "text-youtube",
    ringClass: "bg-youtube/12",
  },
  instagram: {
    label: "إنستغرام",
    icon: Instagram,
    accentClass: "text-instagram",
    ringClass: "bg-instagram/12",
  },
  telegram: {
    label: "تيليجرام",
    icon: Send,
    accentClass: "text-telegram",
    ringClass: "bg-telegram/12",
  },
  facebook: {
    label: "فيسبوك",
    icon: Facebook,
    accentClass: "text-facebook",
    ringClass: "bg-facebook/12",
  },
  x: { label: "منصة X", icon: Twitter, accentClass: "text-x", ringClass: "bg-x/12" },
  discord: {
    label: "ديسكورد",
    icon: MessageCircle,
    accentClass: "text-discord",
    ringClass: "bg-discord/12",
  },
  marketing: {
    label: "التسويق الرقمي",
    icon: Megaphone,
    accentClass: "text-marketing",
    ringClass: "bg-marketing/12",
  },
  design: {
    label: "تصميم المحتوى",
    icon: Palette,
    accentClass: "text-design",
    ringClass: "bg-design/12",
  },
};

export function platformMeta(slug: string | null | undefined) {
  return (slug && PLATFORM_META[slug]) || PLATFORM_META["marketing"]!;
}

export const ORDER_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "قيد الانتظار", className: "bg-muted text-muted-foreground" },
  paid: { label: "مدفوع", className: "bg-info/15 text-info" },
  processing: { label: "قيد التنفيذ", className: "bg-warning/18 text-warning" },
  completed: { label: "مكتمل", className: "bg-success/18 text-success" },
  cancelled: { label: "ملغي", className: "bg-destructive/15 text-destructive" },
  refunded: { label: "مسترد", className: "bg-primary/15 text-primary" },
};

export const TICKET_STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: "مفتوحة", className: "bg-info/15 text-info" },
  pending: { label: "بانتظار الرد", className: "bg-warning/18 text-warning" },
  answered: { label: "تم الرد", className: "bg-success/18 text-success" },
  closed: { label: "مغلقة", className: "bg-muted text-muted-foreground" },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد المراجعة", className: "bg-warning/18 text-warning" },
  succeeded: { label: "مكتمل", className: "bg-success/18 text-success" },
  failed: { label: "فاشل", className: "bg-destructive/15 text-destructive" },
  refunded: { label: "مسترد", className: "bg-primary/15 text-primary" },
};

export const TX_TYPE_META: Record<string, { label: string }> = {
  deposit: { label: "إيداع" },
  purchase: { label: "شراء" },
  refund: { label: "استرداد" },
  adjustment: { label: "تعديل" },
};

export const PAYMENT_METHODS = [
  { value: "stripe", label: "بطاقة عبر Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "crypto", label: "عملات رقمية (USDT/BTC)" },
  { value: "card", label: "بطاقة مصرفية" },
  { value: "manual", label: "تحويل يدوي" },
] as const;
