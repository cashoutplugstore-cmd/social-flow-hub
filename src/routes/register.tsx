import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | ViralHub" },
      { name: "description", content: "أنشئ حسابك في ViralHub وابدأ بإدارة طلباتك ومحفظتك." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void navigate({ to: "/" });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function register() {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail || !password) {
      toast.error("أكمل جميع الحقول المطلوبة");
      return;
    }
    if (password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { display_name: cleanName } },
    });

    if (error) {
      toast.error(error.message || "تعذّر إنشاء الحساب");
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      const { error: bootstrapError } = await supabase.rpc("bootstrap_current_user", { _display_name: cleanName });
      if (bootstrapError) toast.error("تم إنشاء الحساب، لكن تعذّر تجهيز الملف الشخصي تلقائيًا.");
      else toast.success("تم إنشاء حسابك بنجاح");
      await navigate({ to: "/" });
    } else {
      toast.success("تم إنشاء الحساب. افحص بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.");
      await navigate({ to: "/login" });
    }
    setLoading(false);
  }

  async function registerWithGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(error.message || "تعذّر بدء التسجيل عبر Google");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="hero-surface flex min-h-[calc(100vh-5rem)] items-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="surface-card rounded-3xl p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="gradient-primary mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-white shadow-glow">
              <UserRound className="size-6" />
            </div>
            <h1 className="text-2xl font-extrabold">إنشاء حساب</h1>
            <p className="text-muted-foreground mt-2 text-sm">أنشئ حسابًا جديدًا وابدأ باستخدام ViralHub.</p>
          </div>

          <div className="space-y-4">
            <Button type="button" variant="outline" className="h-11 w-full" onClick={registerWithGoogle} disabled={loading || googleLoading}>
              {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <span className="font-bold">G</span>}
              التسجيل باستخدام Google
            </Button>

            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="h-px flex-1 bg-border" />
              أو بالبريد الإلكتروني
              <span className="h-px flex-1 bg-border" />
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-bold">الاسم</span>
              <div className="relative">
                <UserRound className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" className="h-11 pr-10" autoComplete="name" maxLength={80} />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold">البريد الإلكتروني</span>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 pr-10" autoComplete="email" />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold">كلمة المرور</span>
              <Input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8 أحرف على الأقل" className="h-11" autoComplete="new-password" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold">تأكيد كلمة المرور</span>
              <Input dir="ltr" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="أعد كتابة كلمة المرور" className="h-11" autoComplete="new-password" onKeyDown={(e) => { if (e.key === "Enter") void register(); }} />
            </label>

            <div className="bg-muted/50 text-muted-foreground rounded-xl p-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
                <span>بإنشاء الحساب أنت توافق على شروط الاستخدام وسياسة الخصوصية.</span>
              </div>
            </div>

            <Button type="button" variant="hero" className="h-11 w-full" onClick={() => void register()} disabled={loading || googleLoading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              إنشاء الحساب
            </Button>
          </div>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
