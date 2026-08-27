import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const statuses = ["all", "pending", "paid", "processing", "completed", "cancelled", "refunded"] as const;
type StatusFilter = (typeof statuses)[number];
type OrderRow = { id: string; user_id: string; status: string; quantity: number; total_price: number; target_input: string | null; extra_note: string | null; created_at: string };
const PAGE_SIZE = 20;

function AdminOrders() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("orders")
      .select("id,user_id,status,quantity,total_price,target_input,extra_note,created_at")
      .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data ?? []) as OrderRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [status]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => [r.id, r.user_id, r.target_input ?? "", r.extra_note ?? ""].some((v) => v.toLowerCase().includes(needle)));
  }, [rows, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const setStatusForOrder = async (id: string, nextStatus: string) => {
    setBusy(id);
    const { error } = await supabase.rpc("admin_set_order_status", { _order_id: id, _status: nextStatus, _admin_note: null });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث حالة الطلب");
    await load();
  };

  return (
    <PageShell>
      <PageHeader eyebrow="الإدارة" title="الطلبات" description="بحث ومتابعة وإدارة الطلبات من مكان واحد." />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="surface-card mb-5 rounded-2xl p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم الطلب أو العميل أو الهدف..." />
            </div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => <Button key={s} size="sm" variant={status === s ? "hero" : "outline"} onClick={() => setStatus(s)}>{s === "all" ? "الكل" : s}</Button>)}
              <Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />تحديث</Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">عرض {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} من {filtered.length}</p>
        </div>

        {loading ? <Loader2 className="mx-auto animate-spin" /> : visible.length === 0 ? <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">لا توجد طلبات مطابقة.</div> : <div className="space-y-3">{visible.map((r) => <div key={r.id} className="surface-card rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><b>#{r.id.slice(0, 8)}</b><p className="text-muted-foreground text-xs">العميل: {r.user_id} · {r.quantity} وحدة</p><p className="text-muted-foreground mt-1 text-xs">{r.target_input || "بدون هدف"}</p></div><strong>{money(r.total_price)}</strong></div>
          <div className="mt-4 flex flex-wrap gap-2">{statuses.slice(1).map((s) => <Button key={s} size="sm" variant={r.status === s ? "hero" : "outline"} disabled={busy === r.id || r.status === s} onClick={() => void setStatusForOrder(r.id, s)}>{busy === r.id && r.status !== s ? <Loader2 className="animate-spin" /> : s}</Button>)}</div>
        </div>)}</div>}

        {pageCount > 1 && <div className="mt-6 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>السابق</Button><span className="text-sm">صفحة {page} من {pageCount}</span><Button variant="outline" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)}>التالي</Button></div>}
      </div>
    </PageShell>
  );
}
