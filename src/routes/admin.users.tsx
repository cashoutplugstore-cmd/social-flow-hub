import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });
function AdminUsers(){const [rows,setRows]=useState<any[]>([]);const [loading,setLoading]=useState(true);useEffect(()=>{(async()=>{const {data}=await supabase.from("profiles").select("id,display_name,email,phone,is_active,created_at").order("created_at",{ascending:false});setRows(data??[]);setLoading(false)})()},[]);return <PageShell><PageHeader eyebrow="الإدارة" title="المستخدمون" description="إدارة حسابات العملاء وحالتها."/><div className="mx-auto max-w-6xl px-4 py-8">{loading?<Loader2 className="mx-auto animate-spin"/>:<div className="space-y-3">{rows.map(r=><div key={r.id} className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"><div><b>{r.display_name||"بدون اسم"}</b><p className="text-muted-foreground text-xs">{r.email}</p></div><span className="text-sm">{r.is_active?"نشط":"معطل"}</span><Button size="sm" variant="outline" onClick={()=>void supabase.rpc("admin_toggle_user",{p_user_id:r.id,p_is_active:!r.is_active}).then(()=>setRows(x=>x.map(u=>u.id===r.id?{...u,is_active:!u.is_active}:u)))}>{r.is_active?"تعطيل":"تفعيل"}</Button></div>)}</div>}</div></PageShell>}
