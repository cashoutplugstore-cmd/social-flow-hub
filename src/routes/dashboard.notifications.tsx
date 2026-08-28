import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, PageShell, EmptyState } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | ViralHub" },
      { name: "description", content: "تابع تحديثات طلباتك ومحفظتك وتذاكر الدعم في ViralHub." },
      { property: "og:title", content: "الإشعارات | ViralHub" },
      { property: "og:description", content: "تابع تحديثات طلباتك ومحفظتك وتذاكر الدعم في ViralHub." },
    ],
  }),
  component: NotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
};

function NotificationsPage() {
  const [rows, setRows] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.href = "/login";
      return;
    }
    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,body,kind,is_read,link,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const markAll = async () => {
    setBusy(true);
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("تم تعليم كل الإشعارات كمقروءة");
    await load();
  };

  const markOne = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
  };

  const unread = rows.filter((r) => !r.is_read).length;

  return (
    <PageShell>
      <PageHeader
        eyebrow="حسابي"
        title="الإشعارات"
        description="تحديثات الطلبات، عمليات المحفظة، وردود الدعم الفني."
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {unread > 0 ? `لديك ${unread} إشعار غير مقروء` : "لا توجد إشعارات جديدة"}
          </p>
          <Button size="sm" variant="outline" disabled={busy || unread === 0} onClick={() => void markAll()}>
            <CheckCheck className="size-4" />
            تعليم الكل كمقروء
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="لا توجد إشعارات بعد"
            description="ستظهر هنا تحديثات طلباتك ومحفظتك بمجرد حدوثها."
            action={
              <Button variant="hero" asChild>
                <Link to="/services">تصفّح الخدمات</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((n) => (
              <li
                key={n.id}
                className={`surface-card rounded-2xl p-5 ${n.is_read ? "opacity-70" : "border-primary/40"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <BellRing className="text-primary mt-0.5 size-5 shrink-0" />
                    <div>
                      <h2 className="font-bold">{n.title}</h2>
                      {n.body && <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{n.body}</p>}
                      <p className="text-muted-foreground mt-2 text-xs">
                        {new Date(n.created_at).toLocaleString("ar")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {n.link && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={n.link}>عرض</a>
                      </Button>
                    )}
                    {!n.is_read && (
                      <Button size="sm" variant="ghost" onClick={() => void markOne(n.id)}>
                        تم القراءة
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
