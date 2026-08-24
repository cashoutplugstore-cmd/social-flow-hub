import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | ViralHub" },
      { name: "description", content: "سجّل الدخول إلى حسابك في ViralHub." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  async function signIn() {
    if (!email.trim() || !password) {
      toast.error("أدخل البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      toast.error(error.message || "تعذّر تسجيل الدخول");
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.rpc("bootstrap_current_user", { _display_name: data.user.user_metadata?.display_name ?? null });
    }
    toast.success("تم تسجيل الدخول بنجاح");
    await navigate({ to: "/" });
    setLoading(false);
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(error.message || "تعذّر بدء تسجيل الدخول عبر Google");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="hero-surface flex min-h-[calc(100vh-5rem)] items-center px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="surface-card rounded-3xl p-6 shadow-xl sm:p-8">
          <div className="mb-8 text-center">
            <div className="gradient-primary mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-white shadow-glow">
              <LockKeyhole className="size-6" />
            </div>
            <h1 className="text-2xl font-extrabold">تسجيل الدخول</h1>
            <p className="text-muted-foreground mt-2 text-sm">ادخل إلى حسابك لإدارة طلباتك ومحفظتك.</p>
          </div>

          <div className="space-y-4">
            <Button type="button" variant="outline" className="h-11 w-full" onClick={signInWithGoogle} disabled={loading || googleLoading}>
              {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <span className="font-bold">G</span>}
              المتابعة باستخدام Google
            </Button>

            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span className="h-px flex-1 bg-border" />
              أو بالبريد الإلكتروني
              <span className="h-px flex-1 bg-border" />
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-bold">البريد الإلكتروني</span>
              <div className="relative">
                <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 pr-10" autoComplete="email" />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-bold">كلمة المرور</span>
              <Input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11" autoComplete="current-password" onKeyDown={(e) => { if (e.key === "Enter") void signIn(); }} />
            </label>

            <Button type="button" variant="hero" className="h-11 w-full" onClick={() => void signIn()} disabled={loading || googleLoading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              تسجيل الدخول
            </Button>
          </div>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            ليس لديك حساب؟{" "}
            <Link to="/register" className="text-primary font-bold hover:underline">إنشاء حساب جديد</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
