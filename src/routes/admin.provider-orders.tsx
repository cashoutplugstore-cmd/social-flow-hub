import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/provider-orders")({ component: AdminProviderOrders });

const statuses = ["all", "pending", "processing", "completed", "failed", "cancelled"] as const;
type Status = (typeof statuses)[number];
type Row = { id: string; order_id: string; provider_id: string; external_id: string | null; status: string; last_sync_at: string | null; created_at: string };

function AdminProviderOrders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let q = supabase.from("provider_orders").select("id,order_id,provider_id,external_id,status,last_sync_at,created_at").order("created_at", { ascending: false });
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [status]);

  const filtered = useMemo(() => {
    const n = search.trim().toLowerCase();
    return n ? rows.filter((r) => [r.id, r.order_id, r.provider_id, r.external_id ?? ""].some((v) => v.toLowerCase().includes(n))) : rows;
  }, [rows, search]);

  async function setProviderStatus(id: string, next: string) {
    setBusy(id);
    const { error } = await supabase.from("provider_orders").update({ status: next, last_sync_at: new Date().toISOString() } as never).eq("id", id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("تم تحديث حالة تنفيذ الطلب");
    await load();
  }

  return <PageShell>
    <PageHeader eyebrow="الإدارة" title="طلبات المزودين" description="متابعة تنفيذ الطلبات وتحديث حالتها بأمان." />
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="surface-card mb-5 rounded-2xl p-4"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم الطلب أو المزود أو external ID" /></div><div className="flex flex-wrap gap-2">{statuses.map((s) => <Button key={s} size="sm" variant={status === s ? "hero" : "outline"} onClick={() => setStatus(s)}>{s === "all" ? "الكل" : s}</Button>)}<Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />تحديث</Button></div></div></div>
      {loading ? <Loader2 className="mx-auto animate-spin" /> : filtered.length === 0 ? <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">لا توجد طلبات مزودين.</div> : <div className="space-y-3">{filtered.map((r) => <div key={r.id} className="surface-card rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><b>#{r.order_id.slice(0, 8)}</b><p className="text-muted-foreground text-xs">Provider: {r.provider_id}</p><p className="text-muted-foreground text-xs">External: {r.external_id ?? "—"}</p></div><span className="text-sm font-semibold">{r.status}</span></div><div className="mt-4 flex flex-wrap gap-2">{["pending", "processing", "completed", "failed", "cancelled"].map((s) => <Button key={s} size="sm" variant={r.status === s ? "hero" : "outline"} disabled={busy === r.id || r.status === s} onClick={() => void setProviderStatus(r.id, s)}>{busy === r.id && r.status !== s ? <Loader2 className="animate-spin" /> : s}</Button>)}</div></div>)}</div>}
    </div>
  </PageShell>;
}
