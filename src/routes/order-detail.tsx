import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { dateAr, money, num } from "@/lib/format";

export const Route = createFileRoute("/order-detail")({ component: OrderDetail });
function OrderDetail() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; (async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/login"; return; }
    if (!id) { setError("رقم الطلب مفقود"); setLoading(false); return; }
    const { data, error } = await supabase.from("orders").select("id,status,quantity,total_price,target_input,extra_note,created_at,service_id").eq("id", id).eq("user_id", auth.user.id).maybeSingle();
    if (active) { setOrder(data); setError(error?.message || ""); setLoading(false); }
  })(); return () => { active = false; }; }, []);
  if (loading) return <PageShell><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div></PageShell>;
  if (!order) return <PageShell><div className="mx-auto max-w-xl px-4 py-20 text-center"><Package className="text-muted-foreground mx-auto size-10" /><h1 className="mt-4 text-2xl font-bold">الطلب غير موجود</h1><p className="text-muted-foreground mt-2 text-sm">{error || "لا يمكنك الوصول إلى هذا الطلب."}</p><Button className="mt-5" asChild><Link to="/dashboard/orders">طلباتي</Link></Button></div></PageShell>;
  return <PageShell><PageHeader eyebrow="حسابي" title={`الطلب #${String(order.id).slice(0, 8)}`} description={`تم الإنشاء في ${dateAr(order.created_at)}`} /><div className="mx-auto max-w-3xl px-4 py-10"><div className="surface-card rounded-2xl p-6"><div className="grid gap-5 sm:grid-cols-2"><div><p className="text-muted-foreground text-xs">الحالة</p><p className="mt-1 font-bold">{order.status}</p></div><div><p className="text-muted-foreground text-xs">الكمية</p><p className="mt-1 font-bold">{num(order.quantity)}</p></div><div><p className="text-muted-foreground text-xs">الإجمالي</p><p className="mt-1 font-bold">{money(order.total_price)}</p></div><div><p className="text-muted-foreground text-xs">الخدمة</p><p className="mt-1 break-all font-bold">{order.service_id}</p></div></div><div className="mt-6 border-t pt-5"><p className="text-muted-foreground text-xs">الهدف</p><p className="mt-1 break-all text-sm">{order.target_input || "—"}</p></div>{order.extra_note && <div className="mt-5 border-t pt-5"><p className="text-muted-foreground text-xs">الملاحظة</p><p className="mt-1 text-sm">{order.extra_note}</p></div>}</div></div></PageShell>;
}
