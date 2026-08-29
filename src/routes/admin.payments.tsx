import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

type Deposit = {
  id: string;
  user_id: string;
  amount: number | string;
  currency: string;
  method: string;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  created_at: string;
  expires_at: string;
};

const STATUS_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "بانتظار الدفع" },
  { id: "detected", label: "تم رصد الدفع" },
  { id: "confirmed", label: "معتمد" },
  { id: "failed", label: "مرفوض/فاشل" },
] as const;

const MANUAL_METHODS = ["manual", "bank_transfer", "bitcoin"];

function AdminPayments() {
  const [rows, setRows] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("all");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("deposit_requests" as never)
      .select("id,user_id,amount,currency,method,status,provider,provider_reference,created_at,expires_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setRows((data as Deposit[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);


  async function approve(row: Deposit) {
    if (!MANUAL_METHODS.includes(row.method)) {
      toast.error("الدفع بالبطاقة وGoogle Pay يتم تأكيده فقط عبر Webhook موثّق");
      return;
    }
    const reason = (reasons[row.id] ?? "").trim() || "تم التحقق من الدفع بواسطة الإدارة";
    if (reason.length < 5) {
      toast.error("السبب يجب أن يكون 5 أحرف على الأقل");
      return;
    }
    setBusy(row.id);
    const { error } = await supabase.rpc("admin_confirm_deposit", {
      _deposit_id: row.id,
      _reason: reason,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم تأكيد الشحن وإضافة الرصيد وتسجيل العملية في سجل التدقيق");
    setReasons((prev) => ({ ...prev, [row.id]: "" }));
    await load();
  }

  async function reject(row: Deposit) {
    const reason = (reasons[row.id] ?? "").trim() || "لم يتم التحقق من الدفع";
    setBusy(row.id);
    const { error } = await supabase.rpc("admin_reject_deposit", {
      _deposit_id: row.id,
      _reason: reason,
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم رفض طلب الشحن وتسجيل السبب في سجل التدقيق");
    setReasons((prev) => ({ ...prev, [row.id]: "" }));
    await load();
  }

  const visible = rows.filter((row) => {
    if (filter === "all") return true;
    if (filter === "failed") return ["failed", "expired", "cancelled"].includes(row.status);
    return row.status === filter;
  });

  const pendingTotal = rows
    .filter((row) => ["pending", "detected"].includes(row.status))
    .reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <PageShell>
      <PageHeader
        eyebrow="الإدارة"
        title="المدفوعات وطلبات الشحن"
        description="إدارة طلبات الإيداع من مصدرها الصحيح. لا يتم تعديل رصيد المحفظة مباشرة من الواجهة، وكل اعتماد أو رفض يُسجَّل في سجل التدقيق."
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === item.id ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted/60"}`}
                aria-pressed={filter === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">
              قيد الانتظار: <strong className="text-foreground">{money(pendingTotal)}</strong>
            </span>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : ""} /> تحديث
            </Button>
          </div>
        </div>
        {loading ? (
          <Loader2 className="mx-auto animate-spin" />
        ) : visible.length === 0 ? (
          <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">
            لا توجد طلبات شحن بهذه الحالة.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((row) => {
              const canManualApprove = MANUAL_METHODS.includes(row.method);
              const actionable = ["pending", "detected"].includes(row.status);
              return (
                <div key={row.id} className="surface-card rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-5">
                    <div className="min-w-[220px]">
                      <div className="flex items-center gap-2 font-bold">
                        <span>{row.method}</span>
                        <span className="rounded-full border px-2 py-0.5 text-xs">{row.status}</span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">User: {row.user_id.slice(0, 8)} · {new Date(row.created_at).toLocaleString("ar")}</p>
                      {row.provider_reference && <p className="text-muted-foreground text-xs">Ref: {row.provider_reference}</p>}
                    </div>
                    <strong className="text-lg">{money(row.amount)}</strong>
                  </div>
                  {actionable && (
                    <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center">
                      <Input
                        value={reasons[row.id] ?? ""}
                        onChange={(event) => setReasons((prev) => ({ ...prev, [row.id]: event.target.value }))}
                        placeholder="سبب الاعتماد أو الرفض (يُسجَّل في سجل التدقيق)"
                        maxLength={200}
                        className="sm:flex-1"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="hero" disabled={busy === row.id || !canManualApprove} onClick={() => void approve(row)}>
                          {busy === row.id ? <Loader2 className="animate-spin" /> : <Check />} اعتماد
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => void reject(row)}>
                          {busy === row.id ? <Loader2 className="animate-spin" /> : <X />} رفض
                        </Button>
                      </div>
                    </div>
                  )}
                  {actionable && !canManualApprove && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      هذه الطريقة تُعتمد تلقائيًا عبر Webhook موثّق فقط — يمكن رفضها يدويًا.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </PageShell>
  );
}
