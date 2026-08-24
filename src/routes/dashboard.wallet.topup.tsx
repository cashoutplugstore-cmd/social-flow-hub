import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/wallet/topup")({ head: () => ({ meta: [{ title: "شحن المحفظة | ViralHub" }] }), component: TopupPage });
function TopupPage() {
  const [amount,setAmount]=useState(""),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[balance,setBalance]=useState(0),[uid,setUid]=useState<string|null>(null);
  useEffect(()=>{(async()=>{const {data}=await supabase.auth.getUser();if(!data.user){window.location.href="/login";return;}setUid(data.user.id);const {data:w}=await supabase.from("wallets").select("balance").eq("user_id",data.user.id).maybeSingle();setBalance(w?.balance??0);setLoading(false)})()},[]);
  async function submit(){const n=Number(amount);if(!uid)return;if(!Number.isFinite(n)||n<5||n>5000)return toast.error("المبلغ يجب أن يكون بين 5 و5000 USD");setSending(true);const {error}=await supabase.rpc("request_topup",{_amount:n,_method:"manual"});setSending(false);if(error)return toast.error(error.message);toast.success("تم إرسال طلب شحن المحفظة للمراجعة");setAmount("");}
  if(loading)return <PageShell><div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin"/></div></PageShell>;
  return <PageShell><PageHeader eyebrow="المحفظة" title="شحن المحفظة" description="أرسل طلب شحن وسيتم مراجعته من الإدارة."/><div className="mx-auto max-w-lg px-4 py-10"><div className="surface-card rounded-2xl p-7"><div className="mb-6 flex items-center gap-3"><WalletCards className="text-primary size-7"/><div><p className="text-muted-foreground text-sm">الرصيد الحالي</p><p className="text-2xl font-black">${Number(balance).toFixed(2)}</p></div></div><label className="text-sm font-medium">مبلغ الشحن</label><Input className="mt-2" type="number" min="5" max="5000" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="مثال: 10"/><p className="text-muted-foreground mt-2 text-xs">الحد الأدنى $5 والحد الأقصى $5000.</p><Button className="mt-5 w-full" size="lg" variant="hero" onClick={()=>void submit()} disabled={sending}>{sending?<Loader2 className="animate-spin"/>:"إرسال طلب الشحن"}</Button><Button className="mt-3 w-full" variant="ghost" asChild><Link to="/dashboard/wallet"><ArrowRight/>العودة إلى المحفظة</Link></Button></div></div></PageShell>;
}
