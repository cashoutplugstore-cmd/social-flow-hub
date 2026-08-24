import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, ShoppingCart, ShieldCheck, User2, X } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useSession } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/services", label: "الخدمات" },
  { to: "/support", label: "الدعم" },
  { to: "/faq", label: "الأسئلة الشائعة" },
] as const;

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { count } = useCart();
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (!session?.user) { setIsAdmin(false); return () => { active = false; }; }
    void supabase.from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => {
      if (active) setIsAdmin((data ?? []).some((r) => r.role === "admin"));
    });
    return () => { active = false; };
  }, [session?.user?.id]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="glass-panel sticky top-0 z-50 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg px-3 py-2 text-sm font-semibold transition-colors" activeProps={{ className: "text-foreground bg-secondary" }} activeOptions={{ exact: l.to === "/" }}>{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button variant="ghost" size="icon" asChild aria-label="السلة"><Link to="/checkout" className="relative"><ShoppingCart className="size-5" />{count > 0 && <Badge className="gradient-primary text-primary-foreground absolute -top-1 -left-1 size-5 justify-center rounded-full p-0 text-[10px]">{count}</Badge>}</Link></Button>
          {!loading && session ? <>
            {isAdmin && <Button variant="hero" size="sm" asChild className="hidden sm:inline-flex"><Link to="/admin"><ShieldCheck className="size-4" />الإدارة</Link></Button>}
            <Button variant="secondary" size="sm" asChild className="hidden sm:inline-flex"><Link to="/dashboard"><LayoutDashboard className="size-4" />لوحتي</Link></Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="تسجيل الخروج" className="hidden sm:inline-flex"><LogOut className="size-5" /></Button>
          </> : <><Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/login"><User2 className="size-4" />دخول</Link></Button><Button variant="hero" size="sm" asChild className="hidden sm:inline-flex"><Link to="/register">ابدأ الآن</Link></Button></>}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="القائمة">{open ? <X className="size-5" /> : <Menu className="size-5" />}</Button>
        </div>
      </div>
      {open && <div className="bg-surface border-t md:hidden"><nav className="mx-auto grid max-w-7xl gap-1 px-4 py-3">{links.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="hover:bg-secondary rounded-lg px-3 py-2.5 text-sm font-semibold">{l.label}</Link>)}{session && isAdmin && <Button variant="hero" asChild><Link to="/admin" onClick={() => setOpen(false)}><ShieldCheck className="size-4" />لوحة الإدارة</Link></Button>}<div className="mt-2 flex items-center gap-2">{session ? <><Button variant="secondary" className="flex-1" asChild><Link to="/dashboard" onClick={() => setOpen(false)}>لوحتي</Link></Button><Button variant="outline" onClick={handleSignOut}>خروج</Button></> : <><Button variant="outline" className="flex-1" asChild><Link to="/login" onClick={() => setOpen(false)}>دخول</Link></Button><Button variant="hero" className="flex-1" asChild><Link to="/register" onClick={() => setOpen(false)}>ابدأ الآن</Link></Button></>}<ThemeToggle /></div></nav></div>}
    </header>
  );
}
