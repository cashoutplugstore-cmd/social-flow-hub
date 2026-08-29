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
    if (!["manual", "bank_transfer", "bitcoin"].includes(row.method)) {
      toast.error("الدفع بالبطاقة وGoogle Pay يتم تأكيده فقط عبر Webhook موثّق");
      return;
    }
    setBusy(row.id);
    const { error } = await supabase.rpc("admin_confirm_deposit", {
      _deposit_id: row.id,
      _reason: "تم التحقق من الدفع بواسطة الإدارة",
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم تأكيد الشحن وإضافة الرصيد");
    await load();
  }

  async function reject(row: Deposit) {
    setBusy(row.id);
    const { error } = await supabase.rpc("admin_reject_deposit", {
      _deposit_id: row.id,
      _reason: "لم يتم التحقق من الدفع",
    });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم رفض طلب الشحن");
    await load();
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="الإدارة"
        title="المدفوعات وطلبات الشحن"
        description="إدارة طلبات الإيداع من مصدرها الصحيح. لا يتم تعديل رصيد المحفظة مباشرة من الواجهة."
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex justify-end">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} /> تحديث
          </Button>
        </div>
        {loading ? (
          <Loader2 className="mx-auto animate-spin" />
        ) : rows.length === 0 ? (
          <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">
            لا توجد طلبات شحن حتى الآن.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const canManualApprove = ["manual", "bank_transfer", "bitcoin"].includes(row.method);
              return (
                <div key={row.id} className="surface-card flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5">
                  <div className="min-w-[220px]">
                    <div className="flex items-center gap-2 font-bold">
                      <span>{row.method}</span>
                      <span className="rounded-full border px-2 py-0.5 text-xs">{row.status}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">User: {row.user_id.slice(0, 8)} · {new Date(row.created_at).toLocaleString("ar")}</p>
                    {row.provider_reference && <p className="text-muted-foreground text-xs">Ref: {row.provider_reference}</p>}
                  </div>
                  <strong className="text-lg">{money(row.amount)}</strong>
                  {row.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="hero" disabled={busy === row.id || !canManualApprove} onClick={() => void approve(row)}>
                        {busy === row.id ? <Loader2 className="animate-spin" /> : <Check />} موافقة
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === row.id} onClick={() => void reject(row)}>
                        {busy === row.id ? <Loader2 className="animate-spin" /> : <X />} رفض
                      </Button>
                    </div>
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
