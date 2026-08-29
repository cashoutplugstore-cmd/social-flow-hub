import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, WalletCards, PlusCircle } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { dateAr, money } from "@/lib/format";

export const Route = createFileRoute("/dashboard/wallet")({
  head: () => ({ meta: [{ title: "المحفظة | ViralHub" }] }),
  component: WalletPage,
});

type DepositRow = {
  id: string;
  amount: number | string;
  method: string;
  status: string;
  created_at: string;
};

const depositStatusLabel: Record<string, string> = {
  pending: "بانتظار الدفع",
  detected: "تم رصد الدفع",
  confirmed: "مُعتمد",
  failed: "فاشل",
  expired: "منتهي الصلاحية",
  cancelled: "ملغي",
};

function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(userId: string) {
    const [w, t, d] = await Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("id,type,amount,balance_after,description_ar,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("deposit_requests")
        .select("id,amount,method,status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setBalance(w.data?.balance ?? 0);
    setTx(t.data ?? []);
    setDeposits((d.data as DepositRow[] | null) ?? []);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      await load(data.user.id);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading)
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </PageShell>
    );

  return (
    <PageShell>
      <PageHeader eyebrow="حسابي" title="المحفظة" description="تابع رصيدك وحركات المحفظة واشحن رصيدك." />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="surface-card rounded-2xl p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <WalletCards className="text-primary mb-3 size-8" />
              <p className="text-muted-foreground text-sm">الرصيد الحالي</p>
              <p className="mt-1 text-4xl font-black">{money(balance)}</p>
            </div>
            <Link
              to="/dashboard/wallet/topup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90"
            >
              <PlusCircle className="size-5" />
              شحن المحفظة
            </Link>
          </div>
        </div>
        {deposits.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 font-bold">طلبات الشحن</h2>
            <div className="space-y-2">
              {deposits.map((d) => (
                <Link
                  key={d.id}
                  to="/dashboard/wallet/deposit/$id"
                  params={{ id: d.id }}
                  className="surface-card flex items-center justify-between gap-4 rounded-xl p-4 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{d.method}</p>
                    <p className="text-muted-foreground text-xs">{dateAr(d.created_at)}</p>
                  </div>
                  <div className="text-end">
                    <strong>{money(d.amount)}</strong>
                    <p className="text-muted-foreground text-xs">{depositStatusLabel[d.status] ?? d.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6">

          <h2 className="mb-3 font-bold">آخر العمليات</h2>
          {tx.length === 0 ? (
            <div className="surface-card rounded-xl p-6 text-muted-foreground">لا توجد عمليات بعد.</div>
          ) : (
            <div className="space-y-2">
              {tx.map((x) => (
                <div key={x.id} className="surface-card flex justify-between gap-4 rounded-xl p-4">
                  <div>
                    <p className="font-medium">{x.description_ar || x.type}</p>
                    <p className="text-muted-foreground text-xs">{dateAr(x.created_at)}</p>
                  </div>
                  <strong>{money(x.amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
