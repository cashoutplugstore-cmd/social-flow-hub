import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";

export const Route = createFileRoute("/dashboard/orders")({
  head: () => ({ meta: [{ title: "طلباتي | ViralHub" }] }),
  component: OrdersPage,
});

type Order = { id: string; status: string; quantity: number; total_price: number; created_at: string; service_id: string };

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; (async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/login"; return; }
    const { data } = await supabase.from("orders").select("id,status,quantity,total_price,created_at,service_id").eq("user_id", auth.user.id).order("created_at", { ascending: false });
    if (active) { setOrders((data ?? []) as Order[]); setLoading(false); }
  })(); return () => { active = false; }; }, []);

  return <PageShell><PageHeader eyebrow="حسابي" title="طلباتي" description="سجل الطلبات وحالتها الحالية." /><div className="mx-auto max-w-5xl px-4 py-10">{loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div> : orders.length === 0 ? <div className="surface-card rounded-3xl p-10 text-center"><ClipboardList className="text-primary mx-auto mb-4 size-10" /><h2 className="text-xl font-bold">لا توجد طلبات بعد</h2><Button className="mt-5" variant="hero" asChild><Link to="/services">تصفح الخدمات</Link></Button></div> : <div className="space-y-3">{orders.map(o => <div key={o.id} className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><p className="font-bold">طلب #{o.id.slice(0, 8)}</p><p className="text-muted-foreground mt-1 text-xs">{new Date(o.created_at).toLocaleString("ar-SA")} · {num(o.quantity)} وحدة</p></div><div className="text-left"><p className="font-bold">{money(o.total_price)}</p><p className="text-muted-foreground text-xs">{o.status}</p></div></div>)}</div>}</div></PageShell>;
}
