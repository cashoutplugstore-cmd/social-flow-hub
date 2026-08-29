import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { dateAr, money, num } from "@/lib/format";

export const Route = createFileRoute("/order/$id")({
  head: () => ({ meta: [{ title: "تفاصيل الطلب | ViralHub" }] }),
  component: OrderPage,
});

type Order = {
  id: string;
  order_number: string;
  service_name: string;
  platform: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  target_input: string | null;
  extra_note: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

function OrderPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select(
          "id,order_number,service_name,platform,quantity,unit_price,total_price,target_input,extra_note,status,admin_note,created_at,updated_at",
        )
        .eq("id", id)
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (active) {
        setOrder(data as Order | null);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading)
    return (
      <PageShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      </PageShell>
    );
  if (!order)
    return (
      <PageShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">الطلب غير موجود</h1>
          <Button className="mt-5" asChild>
            <Link to="/dashboard/orders">العودة للطلبات</Link>
          </Button>
        </div>
      </PageShell>
    );

  return (
    <PageShell>
      <PageHeader
        eyebrow={`طلب #${order.order_number}`}
        title={order.service_name}
        description={`${order.platform} · ${dateAr(order.created_at)}`}
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="surface-card space-y-5 rounded-2xl p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-muted-foreground text-xs">الحالة</p><p className="mt-1 font-bold">{order.status}</p></div>
            <div><p className="text-muted-foreground text-xs">الكمية</p><p className="mt-1 font-bold">{num(order.quantity)}</p></div>
            <div><p className="text-muted-foreground text-xs">الإجمالي</p><p className="mt-1 font-bold">{money(order.total_price)}</p></div>
            <div><p className="text-muted-foreground text-xs">سعر الوحدة</p><p className="mt-1 font-bold">{money(order.unit_price)}</p></div>
          </div>
          <div><p className="text-muted-foreground text-xs">الهدف</p><p className="mt-1 break-all rounded-lg border p-3 text-sm">{order.target_input || "—"}</p></div>
          {order.extra_note && <div><p className="text-muted-foreground text-xs">ملاحظتك</p><p className="mt-1 rounded-lg border p-3 text-sm">{order.extra_note}</p></div>}
          {order.admin_note && <div><p className="text-muted-foreground text-xs">ملاحظة الإدارة</p><p className="mt-1 rounded-lg border p-3 text-sm">{order.admin_note}</p></div>}
          <Button variant="outline" asChild><Link to="/dashboard/orders"><ArrowRight /> العودة للطلبات</Link></Button>
        </div>
      </div>
    </PageShell>
  );
}
