import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/providers")({ component: AdminProviders });

type Provider = { id: string; name: string; adapter: string; is_active: boolean; created_at: string };

function AdminProviders() {
  const [rows, setRows] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("providers").select("id,name,adapter,is_active,created_at").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Provider[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function toggle(id: string, active: boolean) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_provider_active", { _provider_id: id, _is_active: !active });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!active ? "تم تفعيل المزود" : "تم إيقاف المزود");
    await load();
  }

  return <PageShell>
    <PageHeader eyebrow="الإدارة" title="المزودون" description="إدارة حالة مزودي الخدمات دون كشف مفاتيح API للواجهة." />
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex justify-end"><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />تحديث</Button></div>
      {loading ? <Loader2 className="mx-auto animate-spin" /> : rows.length === 0 ? <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">لا توجد مزودات.</div> : <div className="space-y-3">{rows.map((x) => <div key={x.id} className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><b>{x.name}</b><p className="text-muted-foreground mt-1 text-xs">Adapter: {x.adapter}</p></div><div className="flex items-center gap-3"><span className={x.is_active ? "text-sm" : "text-muted-foreground text-sm"}>{x.is_active ? "نشط" : "متوقف"}</span><Button size="sm" variant={x.is_active ? "outline" : "hero"} disabled={busy === x.id} onClick={() => void toggle(x.id, x.is_active)}>{busy === x.id ? <Loader2 className="animate-spin" /> : x.is_active ? "إيقاف" : "تفعيل"}</Button></div></div>)}</div>}
    </div>
  </PageShell>;
}
