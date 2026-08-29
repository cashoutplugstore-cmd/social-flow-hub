import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShoppingCart, Trash2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";
import { useCart } from "@/hooks/useCart";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "إتمام الطلب | ViralHub" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, remove, clear, total, ready } = useCart();
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!active) return;
      const id = auth.user?.id ?? null;
      setUserId(id);
      if (id) {
        const { data } = await supabase.from("wallets").select("balance").eq("user_id", id).maybeSingle();
        if (active) setBalance(data?.balance ?? 0);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  async function placeOrder() {
    if (!userId) {
      await navigate({ to: "/login", search: { redirect: "/checkout" } });
      return;
    }
    if (!items.length) { toast.error("السلة فارغة"); return; }
    if ((balance ?? 0) < total) { toast.error("رصيد المحفظة غير كافٍ"); return; }

    setPlacing(true);
    const payload = items.map((item) => ({
      service_id: item.serviceId,
      quantity: item.quantity,
      target_input: item.target,
      extra_note: note.trim() || item.note || null,
    }));

    const { error } = await supabase.rpc("place_orders_batch", { _items: payload });
    if (error) {
      setPlacing(false);
      toast.error(error.message || "تعذر إتمام الطلب");
      return;
    }

    clear();
    setPlacing(false);
    toast.success("تم إنشاء الطلبات بنجاح");
    await navigate({ to: "/dashboard/orders" });
  }

  if (!ready || loading) return <PageShell><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div></PageShell>;

  if (!items.length) return <PageShell><div className="mx-auto max-w-2xl px-4 py-20"><div className="surface-card rounded-3xl p-10 text-center"><ShoppingCart className="text-primary mx-auto mb-4 size-10" /><h1 className="text-2xl font-extrabold">السلة فارغة</h1><p className="text-muted-foreground mt-2">أضف خدمة أولاً ثم عد إلى صفحة إتمام الطلب.</p><Button className="mt-6" variant="hero" asChild><Link to="/services">تصفح الخدمات</Link></Button></div></div></PageShell>;

  return <PageShell>
    <PageHeader eyebrow="الطلب" title="إتمام الطلب" description="راجع خدماتك وتأكد من البيانات قبل خصم الرصيد." />
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section className="space-y-3">
        {items.map((item) => <div key={item.serviceId} className="surface-card rounded-2xl p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{item.name}</h2><p className="text-muted-foreground mt-1 text-xs">{item.platform} · {num(item.quantity)} وحدة</p><p className="mt-2 text-xs break-all">{item.target}</p></div><Button variant="ghost" size="icon" onClick={() => remove(item.serviceId)} aria-label="حذف"><Trash2 className="size-4" /></Button></div><div className="mt-4 flex justify-between border-t pt-3"><span className="text-muted-foreground text-sm">الإجمالي</span><strong>{money(item.total)}</strong></div></div>)}
        <div className="surface-card rounded-2xl p-5"><label className="text-sm font-bold">ملاحظة عامة (اختياري)</label><Input className="mt-2" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="ملاحظة للطلبات" /></div>
      </section>
      <aside className="lg:sticky lg:top-20 lg:h-fit"><div className="surface-card rounded-2xl p-6"><div className="flex items-center gap-3"><WalletCards className="text-primary" /><div><p className="text-muted-foreground text-xs">رصيد المحفظة</p><strong>{money(balance ?? 0)}</strong></div></div><div className="my-5 border-t" /><div className="flex justify-between text-sm"><span>عدد الخدمات</span><span>{items.length}</span></div><div className="mt-2 flex justify-between text-lg font-extrabold"><span>الإجمالي</span><span>{money(total)}</span></div><Button variant="hero" size="lg" className="mt-6 w-full" onClick={() => void placeOrder()} disabled={placing}>{placing ? <Loader2 className="animate-spin" /> : <ShoppingCart />} تأكيد الطلب</Button>{(balance ?? 0) < total && <p className="text-destructive mt-3 text-center text-xs">الرصيد غير كافٍ. اشحن محفظتك أولاً.</p>}</div></aside>
    </div>
  </PageShell>;
}
