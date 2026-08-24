import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, CreditCard, Headphones, Loader2, Package, ShieldCheck, ShoppingBag, Users, WalletCards } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "الإدارة | ViralHub" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  useEffect(() => { let active = true; (async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) { window.location.href = "/login"; return; }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);

    if (roleError) {
      if (active) { setError(roleError.message); setLoading(false); }
      return;
    }

    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) { if (active) { setLoading(false); setAllowed(false); } return; }

    const { data, error: statsError } = await supabase.rpc("admin_stats");
    if (active) {
      if (statsError) setError(statsError.message);
      setStats((data ?? {}) as Record<string, number>);
      setAllowed(true);
      setLoading(false);
    }
  })(); return () => { active = false; }; }, []);

  if (loading) return <PageShell><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div></PageShell>;
  if (!allowed) return <PageShell><div className="mx-auto max-w-xl px-4 py-20 text-center"><ShieldCheck className="text-destructive mx-auto size-12" /><h1 className="mt-4 text-2xl font-extrabold">غير مصرح</h1><p className="text-muted-foreground mt-2">ليس لديك صلاحية الوصول إلى لوحة الإدارة.</p>{error && <p className="text-destructive mt-3 text-xs break-all">{error}</p>}<Link className="text-primary mt-5 inline-block font-bold" to="/">العودة للرئيسية</Link></div></PageShell>;

  const cards = [
    ["المستخدمون", stats.users ?? stats.total_users ?? 0, Users],
    ["الطلبات", stats.orders ?? stats.total_orders ?? 0, ShoppingBag],
    ["الخدمات", stats.services ?? stats.total_services ?? 0, Package],
    ["التذاكر", stats.tickets ?? stats.open_tickets ?? 0, Headphones],
    ["الإيرادات", money(stats.revenue ?? stats.total_revenue ?? 0), CreditCard],
    ["المحفظة", money(stats.wallet_balance ?? stats.total_balance ?? 0), WalletCards],
  ] as const;
  const links = [["المستخدمون","/admin/users",Users],["الخدمات","/admin/services",Package],["الطلبات","/admin/orders",ShoppingBag],["المدفوعات","/admin/payments",CreditCard],["التذاكر","/admin/tickets",Headphones],["المزودون","/admin/providers",Activity],["سجل التدقيق","/admin/audit",ShieldCheck]] as const;

  return <PageShell><PageHeader eyebrow="إدارة" title="لوحة الإدارة" description="مراقبة المنصة وإدارة المستخدمين والخدمات والطلبات." /><div className="mx-auto max-w-7xl px-4 py-10"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([title,value,Icon]) => <div key={title} className="surface-card rounded-2xl p-5"><Icon className="text-primary mb-4 size-6" /><p className="text-muted-foreground text-sm">{title}</p><p className="mt-1 text-2xl font-extrabold">{typeof value === "number" ? num(value) : value}</p></div>)}</div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{links.map(([title,to,Icon]) => <Link key={title} to={to} className="surface-card flex items-center gap-3 rounded-2xl p-5 hover:-translate-y-0.5 transition-transform"><Icon className="text-primary size-5" /><span className="font-bold">{title}</span></Link>)}</div></div></PageShell>;
}
