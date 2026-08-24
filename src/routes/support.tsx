import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headphones, Loader2, MessageCircle, Send, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "مركز الدعم | ViralHub" },
      { name: "description", content: "تواصل مع فريق دعم ViralHub وافتح تذكرة جديدة." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("support");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function submitTicket() {
    if (!userId) {
      await navigate({ to: "/login", search: { redirect: "/support" } });
      return;
    }
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (cleanSubject.length < 3) return toast.error("اكتب عنواناً واضحاً للتذكرة");
    if (cleanMessage.length < 5) return toast.error("اكتب تفاصيل المشكلة أو طلبك");

    setSubmitting(true);
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({ user_id: userId, subject: cleanSubject, department })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      setSubmitting(false);
      toast.error(ticketError?.message ?? "تعذر إنشاء التذكرة");
      return;
    }

    const { error: messageError } = await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: userId,
      body: cleanMessage,
      is_staff: false,
    });

    setSubmitting(false);
    if (messageError) {
      toast.error(messageError.message);
      return;
    }
    toast.success("تم إنشاء تذكرتك بنجاح");
    setSubject("");
    setMessage("");
  }

  return (
    <PageShell>
      <PageHeader eyebrow="الدعم" title="مركز الدعم" description="إذا واجهتك مشكلة أو عندك استفسار، افتح تذكرة وسيتابعها فريقنا." />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_360px]">
        <section className="surface-card rounded-2xl p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="bg-primary/12 text-primary grid size-11 place-items-center rounded-xl"><Ticket className="size-5" /></span>
            <div><h2 className="font-bold">فتح تذكرة جديدة</h2><p className="text-muted-foreground text-sm">اشرح لنا المشكلة بالتفصيل.</p></div>
          </div>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div> : !userId ? (
            <div className="rounded-xl border p-6 text-center">
              <Headphones className="text-primary mx-auto mb-3 size-8" />
              <h3 className="font-bold">سجّل دخولك أولاً</h3>
              <p className="text-muted-foreground mt-1 text-sm">تحتاج إلى حساب حتى نتمكن من ربط التذكرة بك.</p>
              <Button className="mt-5" asChild><Link to="/login" search={{ redirect: "/support" }}>تسجيل الدخول</Link></Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div><label className="mb-2 block text-sm font-semibold">عنوان التذكرة</label><Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="مثلاً: مشكلة في طلبي" /></div>
              <div><label className="mb-2 block text-sm font-semibold">القسم</label><Select value={department} onValueChange={setDepartment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="support">الدعم العام</SelectItem><SelectItem value="orders">الطلبات</SelectItem><SelectItem value="payments">المدفوعات والمحفظة</SelectItem><SelectItem value="services">الخدمات</SelectItem></SelectContent></Select></div>
              <div><label className="mb-2 block text-sm font-semibold">التفاصيل</label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} rows={7} placeholder="اكتب تفاصيل المشكلة أو استفسارك هنا…" /></div>
              <Button variant="hero" className="w-full sm:w-auto" onClick={submitTicket} disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : <Send />} إرسال التذكرة</Button>
            </div>
          )}
        </section>
        <aside className="space-y-4">
          <div className="surface-card rounded-2xl p-6"><MessageCircle className="text-primary mb-3 size-7" /><h3 className="font-bold">كيف نساعدك؟</h3><p className="text-muted-foreground mt-2 text-sm leading-6">اذكر رقم الطلب إن كانت المشكلة مرتبطة بطلب سابق، وأرفق التفاصيل المهمة.</p></div>
          <div className="surface-card rounded-2xl p-6"><h3 className="font-bold">قبل فتح التذكرة</h3><p className="text-muted-foreground mt-2 text-sm leading-6">يمكنك مراجعة الأسئلة الشائعة أولاً.</p><Button variant="soft" className="mt-4" asChild><Link to="/faq">الأسئلة الشائعة</Link></Button></div>
        </aside>
      </div>
    </PageShell>
  );
}
