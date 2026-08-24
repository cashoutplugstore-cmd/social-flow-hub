import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { dateAr, money } from "@/lib/format";

export const Route = createFileRoute("/dashboard/wallet")({ head: () => ({ meta: [{ title: "المحفظة | ViralHub" }] }), component: WalletPage });

function WalletPage() {
  const [uid,setUid]=useState<string|null>(null),[balance,setBalance]=useState(0),[tx,setTx]=useState<any[]>([]),[amount,setAmount]=useState(""),[loading,setLoading]=useState(true),[sending,setSending]=useState(false);
  async function load(userId:string){const [w,t]=await Promise.all([supabase.from("wallets").select("balance").eq("user_id",userId).maybeSingle(),supabase.from("wallet_transactions").select("id,type,amount,balance_after,description_ar,created_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(30)]);setBalance(w.data?.balance??0);setTx(t.data??[]);}
  useEffect(()=>{let a=true;(async()=>{const {data}=await supabase.auth.getUser();if(!data.user){window.location.href="/login";return;}setUid(data.user.id);await load(data.user.id);if(a)setLoading(false)})();return()=>{a=false}},[]);
  async function topup(){const n=Number(amount);if(!uid||!Number.isFinite(n)||n<5||n>5000)return toast.error("المبلغ يجب أن يكون بين 5 و5000 USD");setSending(true);const {error}=await supabase.rpc("request_topup",{_amount:n,_method:"manual"});setSending(false);if(error)return toast.error(error.message);toast.success("تم إرسال طلب الشحن للمراجعة");setAmount("");await load(uid)}
  if(loading)return <PageShell><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin"/></div></PageShell>;
  return <PageShell><PageHeader eyebrow="حسابي" title="المحفظة" description="تابع رصيدك وحركات المحفظة واطلب شحنًا."/><div className="mx-auto max-w-5xl px-4 py-10"><div className="grid gap-6 md:grid-cols-[1fr_360px]"><div><div className="surface-card rounded-2xl p-6"><WalletCards className="text-primary mb-3 size-7"/><p className="text-muted-foreground text-sm">الرصيد الحالي</p><p className="mt-1 text-4xl font-black">{money(balance)}</p></div><div className="mt-5 space-y-2">{tx.map(x=><div key={x.id} className="surface-card flex justify-between gap-4 rounded-xl p-4"><div><p className="font-medium">{x.description_ar||x.type}</p><p className="text-muted-foreground text-xs">{dateAr(x.created_at)}</p></div><strong>{money(x.amount)}</strong></div>)}</div></div><div className="surface-card h-fit rounded-2xl p-6"><h2 className="font-bold">طلب شحن</h2><p className="text-muted-foreground mt-1 text-xs">سيُراجع الطلب قبل إضافة الرصيد.</p><Input className="mt-4" type="number" min="5" max="5000" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="المبلغ"/><Button className="mt-4 w-full" variant="hero" onClick={()=>void topup()} disabled={sending}>{sending?<Loader2 className="animate-spin"/>:"إرسال طلب الشحن"}</Button></div></div></div></PageShell>
}
