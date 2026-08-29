import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bitcoin,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { dateAr, money } from "@/lib/format";

export const Route = createFileRoute("/dashboard/wallet_/deposit/$id")({
  head: () => ({
    meta: [
      { title: "متابعة حالة الإيداع | ViralHub" },
      {
        name: "description",
        content: "تابع حالة طلب شحن المحفظة خطوة بخطوة حتى اعتماد الرصيد في حسابك على ViralHub.",
      },
      { property: "og:title", content: "متابعة حالة الإيداع | ViralHub" },
      {
        property: "og:description",
        content: "تابع حالة طلب شحن المحفظة خطوة بخطوة حتى اعتماد الرصيد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DepositStatusPage,
});

type Deposit = {
  id: string;
  amount: number | string;
  currency: string;
  method: string;
  status: string;
  provider_reference: string | null;
  checkout_url: string | null;
  crypto_address: string | null;
  crypto_amount: number | string | null;
  crypto_confirmations: number;
  failure_reason: string | null;
  admin_note: string | null;
  credited_at: string | null;
  expires_at: string;
  created_at: string;
};

const methodMeta: Record<string, { label: string; icon: typeof CreditCard; hint: string }> = {
  card: { label: "بطاقة", icon: CreditCard, hint: "أكمل الدفع عبر صفحة الدفع الآمنة، ثم سيتم اعتماد الرصيد تلقائيًا بعد تأكيد المزود." },
  google_pay: { label: "Google Pay", icon: WalletCards, hint: "أكمل الدفع عبر Google Pay، ثم سيتم اعتماد الرصيد تلقائيًا بعد تأكيد المزود." },
  bitcoin: { label: "Bitcoin", icon: Bitcoin, hint: "أرسل المبلغ إلى العنوان الظاهر أدناه. يتم الاعتماد بعد تأكيد الشبكة." },
  bank_transfer: { label: "تحويل بنكي", icon: Building2, hint: "نفّذ التحويل البنكي وأرسل صورة الإيصال عبر الدعم، وستراجعه الإدارة." },
  manual: { label: "شحن يدوي", icon: WalletCards, hint: "بانتظار مراجعة الإدارة لطلب الشحن." },
};

const steps = [
  { key: "pending", label: "تم إنشاء الطلب" },
  { key: "detected", label: "تم رصد الدفع" },
  { key: "confirmed", label: "تم اعتماد الرصيد" },
];

const statusLabel: Record<string, string> = {
  pending: "بانتظار الدفع",
  detected: "تم رصد الدفع",
  confirmed: "مُعتمد",
  failed: "فاشل",
  expired: "منتهي الصلاحية",
  cancelled: "ملغي",
};

function DepositStatusPage() {
  const { id } = useParams({ from: "/dashboard/wallet_/deposit/$id" });
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (silent) setRefreshing(true);
    const { data, error } = await supabase
      .from("deposit_requests")
      .select(
        "id,amount,currency,method,status,provider_reference,checkout_url,crypto_address,crypto_amount,crypto_confirmations,failure_reason,admin_note,credited_at,expires_at,created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error && !silent) toast.error(error.message);
    setDeposit((data as Deposit | null) ?? null);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      if (active) await load();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isFinal = deposit ? ["confirmed", "failed", "expired", "cancelled"].includes(deposit.status) : false;

  useEffect(() => {
    if (!deposit || isFinal) return;
    const timer = setInterval(() => void load(true), 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deposit?.status, isFinal]);

  const activeStep = useMemo(() => {
    if (!deposit) return 0;
    if (deposit.status === "confirmed") return 2;
    if (deposit.status === "detected") return 1;
    return 0;
  }, [deposit]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (!deposit) {
    return (
      <PageShell>
        <PageHeader eyebrow="المحفظة" title="طلب الإيداع غير موجود" description="تحقق من الرابط أو راجع سجل الإيداعات في محفظتك." />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Button variant="hero" asChild>
            <Link to="/dashboard/wallet">
              <ArrowRight />
              العودة إلى المحفظة
            </Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const meta = methodMeta[deposit.method] ?? methodMeta['manual']!;
  const Icon = meta.icon;
  const failed = ["failed", "expired", "cancelled"].includes(deposit.status);

  return (
    <PageShell>
      <PageHeader
        eyebrow="المحفظة"
        title="متابعة حالة الإيداع"
        description="نتابع طلب الشحن تلقائيًا حتى اعتماد الرصيد في محفظتك."
      />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="surface-card rounded-2xl p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Icon className="text-primary size-7" />
              <div>
                <p className="text-muted-foreground text-sm">{meta.label}</p>
                <p className="text-3xl font-black">{money(deposit.amount)}</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                deposit.status === "confirmed"
                  ? "border-primary/40 text-primary"
                  : failed
                    ? "border-destructive/40 text-destructive"
                    : ""
              }`}
            >
              {deposit.status === "confirmed" ? (
                <CheckCircle2 className="size-4" />
              ) : failed ? (
                <XCircle className="size-4" />
              ) : (
                <Clock className="size-4" />
              )}
              {statusLabel[deposit.status] ?? deposit.status}
            </span>
          </div>

          <ol className="mt-8 space-y-4">
            {steps.map((step, index) => {
              const done = !failed && index <= activeStep;
              const current = !failed && index === activeStep && deposit.status !== "confirmed";
              return (
                <li key={step.key} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      done ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-4" /> : index + 1}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${done ? "" : "text-muted-foreground"}`}>{step.label}</p>
                    {current && <p className="text-muted-foreground text-xs">قيد التنفيذ الآن…</p>}
                  </div>
                </li>
              );
            })}
          </ol>

          {failed ? (
            <p className="text-destructive mt-6 rounded-xl border p-4 text-sm">
              {deposit.failure_reason || deposit.admin_note || "تم إلغاء طلب الشحن. يمكنك إنشاء طلب جديد."}
            </p>
          ) : deposit.status === "confirmed" ? (
            <p className="mt-6 rounded-xl border p-4 text-sm">
              تمت إضافة {money(deposit.amount)} إلى محفظتك {deposit.credited_at ? `في ${dateAr(deposit.credited_at)}` : ""}.
            </p>
          ) : (
            <p className="text-muted-foreground mt-6 rounded-xl border p-4 text-sm leading-relaxed">{meta.hint}</p>
          )}

          {deposit.status !== "confirmed" && deposit.checkout_url && (
            <Button className="mt-4 w-full" size="lg" variant="hero" asChild>
              <a href={deposit.checkout_url} target="_blank" rel="noreferrer noopener">
                <ExternalLink />
                إكمال الدفع
              </a>
            </Button>
          )}

          {deposit.status !== "confirmed" && deposit.crypto_address && (
            <div className="mt-4 rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">عنوان الإرسال (Bitcoin)</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all text-xs">{deposit.crypto_address}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(deposit.crypto_address!);
                    toast.success("تم نسخ العنوان");
                  }}
                >
                  <Copy />
                </Button>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                التأكيدات: {deposit.crypto_confirmations}
                {deposit.crypto_amount ? ` · المبلغ: ${deposit.crypto_amount} BTC` : ""}
              </p>
            </div>
          )}

          <dl className="text-muted-foreground mt-6 grid gap-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt>رقم الطلب</dt>
              <dd className="font-mono">{deposit.id.slice(0, 8)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>تاريخ الإنشاء</dt>
              <dd>{dateAr(deposit.created_at)}</dd>
            </div>
            {!isFinal && (
              <div className="flex justify-between gap-3">
                <dt>ينتهي في</dt>
                <dd>{dateAr(deposit.expires_at)}</dd>
              </div>
            )}
            {deposit.provider_reference && (
              <div className="flex justify-between gap-3">
                <dt>المرجع</dt>
                <dd className="font-mono break-all">{deposit.provider_reference}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" variant="outline" onClick={() => void load(true)} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
              تحديث الحالة
            </Button>
            <Button className="flex-1" variant="ghost" asChild>
              <Link to="/dashboard/wallet">
                <ArrowRight />
                العودة إلى المحفظة
              </Link>
            </Button>
          </div>

          {failed && (
            <Button className="mt-2 w-full" variant="hero" asChild>
              <Link to="/dashboard/wallet/topup">إنشاء طلب شحن جديد</Link>
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
