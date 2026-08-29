import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Bitcoin, CreditCard, Loader2, WalletCards, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/wallet_/topup")({
  head: () => ({ meta: [{ title: "شحن المحفظة | ViralHub" }] }),
  component: TopupPage,
});

type Method = "card" | "bitcoin" | "google_pay" | "bank_transfer";

const methods: { id: Method; label: string; description: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "بطاقة", description: "دفع آمن بالبطاقة", icon: CreditCard },
  { id: "google_pay", label: "Google Pay", description: "دفع سريع عبر Google Pay", icon: WalletCards },
  { id: "bitcoin", label: "Bitcoin", description: "الدفع بالبيتكوين", icon: Bitcoin },
  { id: "bank_transfer", label: "تحويل بنكي", description: "طلب تحويل ومراجعة الإدارة", icon: Building2 },
];

function TopupPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("card");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState(0);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUid(data.user.id);
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (active) {
        setBalance(Number(wallet?.balance ?? 0));
        setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function submit() {
    if (!uid) return;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 5 || numericAmount > 5000) {
      toast.error("المبلغ يجب أن يكون بين 5 و5000 USD");
      return;
    }

    setSending(true);
    const idempotencyKey = `${uid}:${crypto.randomUUID()}`;
    const { data, error } = await supabase.rpc("create_deposit_request", {
      _amount: numericAmount,
      _method: method,
      _idempotency_key: idempotencyKey,
    });
    setSending(false);

    if (error) {
      toast.error(error.message || "تعذر إنشاء طلب الشحن");
      return;
    }

    if (method === "bank_transfer") {
      toast.success("تم إنشاء طلب التحويل البنكي، بانتظار المراجعة");
    } else {
      toast.success("تم إنشاء طلب الدفع. سيتم تأكيد الرصيد بعد التحقق من الدفع");
    }
    setAmount("");
    void data;
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="المحفظة"
        title="شحن المحفظة"
        description="اختر طريقة الدفع وأنشئ طلب شحن آمن. لا يتم إضافة الرصيد قبل التحقق من الدفع."
      />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="surface-card rounded-2xl p-7">
          <div className="mb-7 flex items-center gap-3">
            <WalletCards className="text-primary size-7" />
            <div>
              <p className="text-muted-foreground text-sm">الرصيد الحالي</p>
              <p className="text-2xl font-black">${balance.toFixed(2)}</p>
            </div>
          </div>

          <label className="text-sm font-medium" htmlFor="topup-amount">مبلغ الشحن</label>
          <Input
            id="topup-amount"
            className="mt-2"
            type="number"
            min="5"
            max="5000"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="مثال: 10"
          />
          <p className="text-muted-foreground mt-2 text-xs">الحد الأدنى $5 والحد الأقصى $5000.</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {methods.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`rounded-xl border p-4 text-start transition ${method === id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                aria-pressed={method === id}
              >
                <div className="flex items-center gap-3">
                  <Icon className="text-primary size-5" />
                  <div>
                    <p className="font-bold">{label}</p>
                    <p className="text-muted-foreground text-xs">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button className="mt-6 w-full" size="lg" variant="hero" onClick={() => void submit()} disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : <WalletCards />}
            إنشاء طلب الشحن
          </Button>

          <p className="text-muted-foreground mt-3 text-center text-xs">
            الدفع بالبطاقة وGoogle Pay وBitcoin يحتاج تأكيدًا من مزود الدفع قبل إضافة الرصيد.
          </p>

          <Button className="mt-3 w-full" variant="ghost" asChild>
            <Link to="/dashboard/wallet"><ArrowRight />العودة إلى المحفظة</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
