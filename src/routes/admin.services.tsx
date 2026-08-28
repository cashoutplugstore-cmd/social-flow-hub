import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Power, Save, Search, X } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/services")({ component: AdminServices });

type Category = { id: string; name_ar: string; slug: string };
type ServiceRow = { id: string; category_id: string; slug: string; name_ar: string; price_per_unit: number; unit_size: number; min_quantity: number; max_quantity: number; is_active: boolean };
type FormState = { category_id: string; name_ar: string; slug: string; price_per_unit: string; unit_size: string; min_quantity: string; max_quantity: string };

const empty: FormState = { category_id: "", name_ar: "", slug: "", price_per_unit: "0.01", unit_size: "1000", min_quantity: "100", max_quantity: "10000" };

function AdminServices() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const load = async () => {
    setLoading(true);
    const [{ data: services, error: servicesError }, { data: cats, error: catsError }] = await Promise.all([
      supabase.from("services").select("id,category_id,slug,name_ar,price_per_unit,unit_size,min_quantity,max_quantity,is_active").order("created_at", { ascending: false }),
      supabase.from("service_categories").select("id,name_ar,slug").order("sort_order", { ascending: true }),
    ]);
    if (servicesError) toast.error(`الخدمات: ${servicesError.message}`);
    if (catsError) toast.error(`الأقسام: ${catsError.message}`);
    setRows((services ?? []) as ServiceRow[]);
    setCategories((cats ?? []) as Category[]);
    setForm((current) => current.category_id || !(cats?.length) ? current : { ...current, category_id: cats[0].id });
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((x) => {
      const matchesStatus = activeFilter === "all" || (activeFilter === "active" ? x.is_active : !x.is_active);
      if (!matchesStatus) return false;
      if (!q) return true;
      const category = categories.find((c) => c.id === x.category_id);
      return `${x.name_ar} ${x.slug} ${category?.name_ar ?? ""} ${category?.slug ?? ""}`.toLowerCase().includes(q);
    });
  }, [rows, categories, query, activeFilter]);

  const save = async () => {
    if (!form.category_id) { toast.error("اختر قسم الخدمة"); return; }
    if (!form.name_ar.trim() || !form.slug.trim()) { toast.error("أدخل اسم الخدمة والـslug"); return; }
    const price = Number(form.price_per_unit), unit = Number(form.unit_size), min = Number(form.min_quantity), max = Number(form.max_quantity);
    if (![price, unit, min, max].every(Number.isFinite) || price < 0 || unit <= 0 || min <= 0 || max < min) { toast.error("تحقق من السعر والحدود والأرقام"); return; }
    setSaving(true);
    const payload = { category_id: form.category_id, name_ar: form.name_ar.trim(), slug: form.slug.trim(), price_per_unit: price, unit_size: unit, min_quantity: min, max_quantity: max, is_active: true };
    const queryBuilder = editing ? supabase.from("services").update(payload).eq("id", editing) : supabase.from("services").insert(payload);
    const { error } = await queryBuilder;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "تم تعديل الخدمة" : "تم نشر الخدمة");
    setForm({ ...empty, category_id: form.category_id });
    setEditing(null);
    await load();
  };

  const edit = (x: ServiceRow) => {
    setForm({ category_id: x.category_id, name_ar: x.name_ar, slug: x.slug, price_per_unit: String(x.price_per_unit), unit_size: String(x.unit_size), min_quantity: String(x.min_quantity), max_quantity: String(x.max_quantity) });
    setEditing(x.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ ...empty, category_id: form.category_id || categories[0]?.id || "" });
  };

  const toggle = async (x: ServiceRow) => {
    const { error } = await supabase.from("services").update({ is_active: !x.is_active }).eq("id", x.id);
    if (error) toast.error(error.message); else { toast.success(x.is_active ? "تم إيقاف الخدمة" : "تم نشر الخدمة"); await load(); }
  };

  const activeCount = rows.filter((x) => x.is_active).length;
  const inactiveCount = rows.length - activeCount;

  return <PageShell>
    <PageHeader eyebrow="الإدارة" title="الخدمات والمنتجات" description="مركز التحكم بالمنتجات والأسعار والحدود وحالة النشر." />
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-card rounded-2xl p-4"><div className="text-xs text-muted-foreground">إجمالي الخدمات</div><div className="mt-1 text-2xl font-black">{rows.length}</div></div>
        <div className="surface-card rounded-2xl p-4"><div className="text-xs text-muted-foreground">منشورة</div><div className="mt-1 text-2xl font-black">{activeCount}</div></div>
        <div className="surface-card rounded-2xl p-4"><div className="text-xs text-muted-foreground">متوقفة</div><div className="mt-1 text-2xl font-black">{inactiveCount}</div></div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</h2>{editing && <Button variant="ghost" onClick={cancelEdit}><X />إلغاء</Button>}</div>
        {categories.length === 0 ? <p className="text-sm text-destructive">لا توجد أقسام خدمات. أضف قسمًا أولًا من قاعدة البيانات.</p> : <div className="grid gap-3 md:grid-cols-3">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name_ar} ({c.slug})</option>)}</select>
          <Input placeholder="اسم الخدمة بالعربي" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} />
          <Input placeholder="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          <Input type="number" min="0" step="0.0001" placeholder="السعر للوحدة" value={form.price_per_unit} onChange={e => setForm({ ...form, price_per_unit: e.target.value })} />
          <Input type="number" min="1" placeholder="حجم الوحدة" value={form.unit_size} onChange={e => setForm({ ...form, unit_size: e.target.value })} />
          <Input type="number" min="1" placeholder="الحد الأدنى" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} />
          <Input type="number" min="1" placeholder="الحد الأقصى" value={form.max_quantity} onChange={e => setForm({ ...form, max_quantity: e.target.value })} />
        </div>}
        <Button className="mt-4" variant="hero" onClick={() => void save()} disabled={saving || categories.length === 0}>{saving ? <Loader2 className="animate-spin" /> : editing ? <Save /> : <Plus />}{editing ? "حفظ التعديل" : "نشر الخدمة"}</Button>
      </div>

      <div className="surface-card mt-6 rounded-2xl p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" placeholder="ابحث باسم الخدمة أو slug أو القسم" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="flex gap-2">{(["all", "active", "inactive"] as const).map(x => <Button key={x} size="sm" variant={activeFilter === x ? "hero" : "outline"} onClick={() => setActiveFilter(x)}>{x === "all" ? "الكل" : x === "active" ? "منشورة" : "متوقفة"}</Button>)}<Button size="sm" variant="outline" onClick={() => void load()}><Power />تحديث</Button></div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? <Loader2 className="mx-auto animate-spin" /> : filteredRows.length === 0 ? <div className="surface-card rounded-2xl p-10 text-center text-muted-foreground">لا توجد خدمات مطابقة.</div> : filteredRows.map(x => <div key={x.id} className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
          <div className="min-w-0"><b>{x.name_ar}</b><p className="text-xs text-muted-foreground">{categories.find(c => c.id === x.category_id)?.name_ar ?? "قسم"} · {x.slug}</p><p className="mt-1 text-xs">السعر: {x.price_per_unit} / {x.unit_size} · {x.min_quantity}–{x.max_quantity}</p></div>
          <span className={x.is_active ? "text-sm font-bold text-primary" : "text-sm font-bold text-muted-foreground"}>{x.is_active ? "منشورة" : "متوقفة"}</span>
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(x)}><Pencil />تعديل</Button><Button size="sm" variant="outline" onClick={() => void toggle(x)}><Power />{x.is_active ? "إيقاف" : "نشر"}</Button></div>
        </div>)}
      </div>
    </div>
  </PageShell>;
}
