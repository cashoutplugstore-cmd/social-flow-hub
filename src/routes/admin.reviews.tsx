import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, EyeOff, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reviews")({ component: AdminReviews });

type Review = { id: string; rating: number; title: string | null; comment: string | null; display_name: string | null; verified_purchase: boolean; status: "pending" | "approved" | "hidden" | "flagged"; admin_response: string | null; created_at: string };

function AdminReviews() {
  const [rows, setRows] = useState<Review[]>([]);
  const [status, setStatus] = useState<Review["status"] | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let query = supabase.from("reviews").select("id,rating,title,comment,display_name,verified_purchase,status,admin_response,created_at").order("created_at", { ascending: false }).limit(100);
    if (status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [status]);

  const moderate = async (id: string, next: Review["status"]) => {
    setSaving(id);
    const { error } = await supabase.rpc("admin_moderate_review", { _review_id: id, _status: next, _response: responses[id]?.trim() || null });
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success(next === "approved" ? "تم نشر التقييم" : "تم تحديث حالة التقييم");
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm("حذف هذا التقييم نهائيًا؟")) return;
    setSaving(id);
    const { error } = await supabase.rpc("admin_delete_review", { _review_id: id });
    setSaving(null);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حذف التقييم");
    await load();
  };

  return <PageShell>
    <PageHeader eyebrow="الإدارة" title="مراجعات العملاء" description="مراجعة ونشر التقييمات الحقيقية المرتبطة بالطلبات المكتملة." />
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["pending", "approved", "flagged", "hidden", "all"] as const).map(x => <Button key={x} size="sm" variant={status === x ? "hero" : "outline"} onClick={() => setStatus(x)}>{x === "all" ? "الكل" : x === "pending" ? "معلقة" : x === "approved" ? "منشورة" : x === "flagged" ? "معلّمة" : "مخفية"}</Button>)}
        <Button size="sm" variant="outline" className="ms-auto" onClick={() => void load()}><RefreshCw />تحديث</Button>
      </div>
      {loading ? <Loader2 className="mx-auto animate-spin" /> : rows.length === 0 ? <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">لا توجد مراجعات في هذا القسم.</div> : <div className="space-y-4">{rows.map(r => <article key={r.id} className="surface-card rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-bold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} {r.verified_purchase && <span className="ms-2 text-xs text-primary">شراء موثّق</span>}</div><div className="text-sm text-muted-foreground">{r.display_name || "عميل"} · {new Date(r.created_at).toLocaleString("ar")}</div></div><span className="rounded-full border px-3 py-1 text-xs">{r.status}</span></div>
        {r.title && <h3 className="mt-4 font-semibold">{r.title}</h3>}{r.comment && <p className="mt-2 whitespace-pre-wrap text-sm">{r.comment}</p>}
        <Textarea className="mt-4" placeholder="رد الإدارة (اختياري)" value={responses[r.id] ?? r.admin_response ?? ""} onChange={e => setResponses(v => ({ ...v, [r.id]: e.target.value }))} />
        <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="hero" disabled={saving === r.id} onClick={() => void moderate(r.id, "approved")}><Check />نشر</Button><Button size="sm" variant="outline" disabled={saving === r.id} onClick={() => void moderate(r.id, "hidden")}><EyeOff />إخفاء</Button><Button size="sm" variant="outline" disabled={saving === r.id} onClick={() => void moderate(r.id, "flagged")}>تحديد كمشكلة</Button><Button size="sm" variant="destructive" disabled={saving === r.id} onClick={() => void remove(r.id)}><Trash2 />حذف</Button></div>
      </article>)}</div>}
    </div>
  </PageShell>;
}
