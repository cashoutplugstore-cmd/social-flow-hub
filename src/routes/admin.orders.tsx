import { createFileRoute } from "@tanstack/react-router";
import { useEffect,useState } from "react";
import { Loader2 } from "lucide-react";
import { PageHeader,PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
export const Route=createFileRoute("/admin/orders")({component:AdminOrders});
function AdminOrders(){const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);useEffect(()=>{(async()=>{const {data}=await supabase.from("orders").select("id,user_id,status,quantity,total_price,created_at").order("created_at",{ascending:false});setRows(data??[]);setLoading(false)})()},[]);return <PageShell><PageHeader eyebrow="الإدارة" title="الطلبات" description="مراقبة الطلبات وتحديث حالتها."/><div className="mx-auto max-w-6xl px-4 py-8">{loading?<Loader2 className="mx-auto animate-spin"/>:<div className="space-y-3">{rows.map(r=><div key={r.id} className="surface-card flex flex-wrap justify-between gap-3 rounded-2xl p-5"><div><b>#{r.id.slice(0,8)}</b><p className="text-muted-foreground text-xs">{r.status} · {r.quantity} وحدة</p></div><strong>{money(r.total_price)}</strong></div>)}</div>}</div></PageShell>}
