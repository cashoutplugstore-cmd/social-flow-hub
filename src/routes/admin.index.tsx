import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CreditCard, Headphones, Loader2, Package, ShieldCheck, ShoppingBag, Star, Users, WalletCards, Clock, Globe2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "الإدارة | ViralHub" }] }),
  component: AdminPage,
});

type Analytics = Record<string, any>;

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [stats, setStats] = useState<Analytics>({});
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      window.location.href = "/login";
      return;
    }
    const { data: roles, error: roleError } = await supabase.from("user_roles").select("role").eq("user_id", auth.user.id);
    if (roleError) {
      setError(roleError.message);
      setLoading(false);
      return;
    }
    if (!(roles ?? []).some((r) => r.role === "admin")) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - 30);
    const { data, error: analyticsError } = await supabase.rpc("admin_analytics", {
      _from: from.toISOString(),
      _to: to.toISOString(),
    });
    if (analyticsError) setError(analyticsError.message);
    setStats((data ?? {}) as Analytics);
    setAllowed(true);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(() => [
    ["إيرادات 30 يوم", money(stats.revenue_range), CreditCard],
    ["إجمالي الإيرادات", money(stats.revenue_total), BarChart3],
    ["الطلبات", stats.orders_total, ShoppingBag],
    ["المستخدمون", stats.users_total, Users],
    ["مستخدمون جدد", stats.users_new, Users],
    ["المستخدمون النشطون", stats.users_active, Activity],
    ["شحنات مؤكدة", money(stats.deposits_range), WalletCards],
    ["شحنات معلقة", stats.deposits_pending, Clock],
    ["متوسط الطلب", money(stats.aov), CreditCard],
    ["متوسط التقييم", stats.rating_avg ? `${stats.rating_avg} / 5` : "0 / 5", Star],
    ["مراجعات منشورة", stats.reviews_total, Star],
    ["الزوار", stats.visitors_range, Globe2],
  ] as const, [stats]);

  const links = [
    ["المستخدمون", "/admin/users", Users],
    ["الخدمات", "/admin/services", Package],
    ["الطلبات", "/admin/orders", ShoppingBag],
    ["المدفوعات والإيداعات", "/admin/payments", CreditCard],
    ["المراجعات", "/admin/reviews", Star],
    ["التذاكر", "/admin/tickets", Headphones],
    ["المزودون", "/admin/providers", Activity],
    ["سجل التدقيق", "/admin/audit", ShieldCheck],
  ] as const;

  if (loading) return <PageShell><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div></PageShell>;
  if (!allowed) return <PageShell><div className="mx-auto max-w-xl px-4 py-20 text-center"><ShieldCheck className="text-destructive mx-auto size-12" /><h1 className="mt-4 text-2xl font-extrabold">غير مصرح</h1><p className="text-muted-foreground mt-2">ليس لديك صلاحية الوصول إلى لوحة الإدارة.</p>{error && <p className="text-destructive mt-3 text-xs break-all">{error}</p>}</div></PageShell>;

  const series = Array.isArray(stats.revenue_series) ? stats.revenue_series : [];
  const maxRevenue = Math.max(1, ...series.map((x: any) => Number(x.revenue ?? 0)));
  const countries = Object.entries(stats.visitors_by_country ?? {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 8);

  return <PageShell>
    <PageHeader eyebrow="إدارة" title="مركز التحكم" description="إحصائيات حقيقية وإدارة مركزية للطلبات والخدمات والعملاء والمدفوعات والمراجعات." />
    <div className="mx-auto max-w-7xl px-4 py-8">
      {error && <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      <div className="mb-6 flex flex-wrap gap-3">
        <button className="surface-card rounded-xl px-4 py-2 text-sm font-bold" onClick={() => void load()}>تحديث البيانات</button>
        <Link to="/admin/orders" className="surface-card rounded-xl px-4 py-2 text-sm font-bold">مراجعة الطلبات</Link>
        <Link to="/admin/payments" className="surface-card rounded-xl px-4 py-2 text-sm font-bold">مراجعة الإيداعات</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([title, value, Icon]) => <div key={title} className="surface-card rounded-2xl p-5"><Icon className="text-primary mb-4 size-6" /><p className="text-muted-foreground text-sm">{title}</p><p className="mt-1 text-2xl font-extrabold">{typeof value === "number" ? num(value) : value}</p></div>)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="surface-card rounded-2xl p-6"><div className="flex items-center justify-between"><div><h2 className="text-lg font-extrabold">الإيرادات والطلبات — آخر 30 يوم</h2><p className="text-muted-foreground text-sm">بيانات مباشرة من النظام</p></div><BarChart3 className="text-primary" /></div><div className="mt-6 flex h-56 items-end gap-1 overflow-hidden">{series.map((point: any) => <div key={point.d} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-primary/70 transition-all group-hover:bg-primary" style={{ height: `${Math.max(4, (Number(point.revenue ?? 0) / maxRevenue) * 100)}%` }} title={`${point.d}: ${money(point.revenue)}`} /></div>)}</div></section>
        <section className="surface-card rounded-2xl p-6"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">الزوار حسب الدولة</h2><Globe2 className="text-primary" /></div><div className="mt-5 space-y-3">{countries.length ? countries.map(([country, count]) => <div key={country} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2"><span className="font-semibold">{country}</span><span className="text-muted-foreground text-sm">{num(Number(count))}</span></div>) : <p className="text-muted-foreground text-sm">لا توجد بيانات زوار ضمن الفترة.</p>}</div></section>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{links.map(([title, to, Icon]) => <Link key={title} to={to} className="surface-card flex items-center gap-3 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"><Icon className="text-primary size-5" /><span className="font-bold">{title}</span></Link>)}</div>
    </div>
  </PageShell>;
}
