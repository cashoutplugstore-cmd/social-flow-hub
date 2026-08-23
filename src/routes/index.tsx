import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  Headphones,
  Rocket,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getCatalog, getPublicStats } from "@/lib/public.functions";
import { PLATFORM_META, platformMeta } from "@/lib/platform";
import { num } from "@/lib/format";

const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

const statsQuery = queryOptions({
  queryKey: ["public-stats"],
  queryFn: () => getPublicStats(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ViralHub | كل خدمات السوشيال ميديا في مكان واحد" },
      {
        name: "description",
        content:
          "منصة ViralHub لشراء خدمات السوشيال ميديا الرسمية: ترويج تيك توك ويوتيوب وإنستغرام وتيليجرام وX وديسكورد، تسويق رقمي وتصميم محتوى بأسعار واضحة وتنفيذ سريع.",
      },
      { property: "og:title", content: "ViralHub | كل خدمات السوشيال ميديا في مكان واحد" },
      {
        property: "og:description",
        content: "اطلب خدمات الترويج والتسويق والتصميم لحساباتك من مكان واحد، بمحفظة رصيد آمنة ومتابعة لحظية للطلبات.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catalogQuery),
      context.queryClient.ensureQueryData(statsQuery),
    ]);
  },
  component: Home,
});

const FAQ_ITEMS = [
  {
    q: "هل الخدمات رسمية ومشروعة؟",
    a: "نعم. نعتمد على أدوات الترويج الرسمية للمنصات وخدمات التسويق والتصميم البشرية فقط، ولا نقدم أي تفاعل وهمي أو مخالف لسياسات المنصات.",
  },
  {
    q: "هل تطلبون كلمة مرور حسابي؟",
    a: "أبداً. نطلب فقط رابطاً عاماً أو اسم مستخدم عند الحاجة. أي جهة تطلب كلمة مرورك فهي غير موثوقة.",
  },
  {
    q: "كيف أدفع؟",
    a: "تشحن محفظتك عبر البطاقة أو Stripe أو PayPal أو العملات الرقمية، ثم تشتري أي خدمة برصيدك مباشرة. لا نخزّن بيانات بطاقتك في قاعدة البيانات.",
  },
  {
    q: "ما مدة التنفيذ؟",
    a: "تختلف حسب الخدمة وتظهر بوضوح في صفحة كل خدمة، وتتراوح بين بضع ساعات وعدة أيام لخدمات التصميم والاستراتيجية.",
  },
  {
    q: "هل يمكنني استرداد المبلغ؟",
    a: "نعم، إذا لم تُنفَّذ الخدمة يُعاد المبلغ كاملاً إلى محفظتك ويظهر في سجل المعاملات.",
  },
];

function Home() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const { data: stats } = useSuspenseQuery(statsQuery);

  const catById = new Map(catalog.categories.map((c) => [c.id, c]));
  const top = catalog.services.slice(0, 6);

  return (
    <PageShell>
      {/* HERO */}
      <section className="hero-surface relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <span className="glass-panel text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold">
              <Sparkles className="size-3.5" />
              منصة عربية · تنفيذ رسمي ومشروع
            </span>
            <h1 className="text-4xl leading-[1.15] font-extrabold sm:text-5xl lg:text-6xl">
              كل خدمات السوشيال ميديا
              <br />
              <span className="gradient-text">في مكان واحد</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
              ترويج محتوى، حملات إعلانية، تسويق رقمي وتصميم — اشترِ من متجر واحد بمحفظة رصيد آمنة،
              وتابع كل طلب لحظة بلحظة من لوحتك.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="xl" asChild>
                <Link to="/services">
                  <Rocket className="size-5" />
                  ابدأ الآن
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/services">
                  تصفّح الخدمات
                  <ArrowLeft className="size-5" />
                </Link>
              </Button>
            </div>
            <dl className="grid max-w-lg grid-cols-3 gap-3 pt-4">
              {[
                { k: "خدمة متاحة", v: num(stats.total_services) },
                { k: "طلب منفّذ", v: num(stats.completed_orders) },
                { k: "مستخدم", v: num(stats.total_users) },
              ].map((s) => (
                <div key={s.k} className="glass-panel rounded-xl px-3 py-3 text-center">
                  <dt className="text-muted-foreground text-[11px]">{s.k}</dt>
                  <dd className="text-lg font-extrabold">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="glass-panel shadow-elevated rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">المنصات المدعومة</h2>
              <span className="text-muted-foreground text-xs">9 أقسام</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(PLATFORM_META).map(([slug, meta]) => {
                const Icon = meta.icon;
                return (
                  <Link
                    key={slug}
                    to="/services"
                    search={{ category: slug }}
                    className="surface-card hover:shadow-glow grid place-items-center gap-2 rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5"
                  >
                    <span className={`grid size-10 place-items-center rounded-xl ${meta.ringClass}`}>
                      <Icon className={`size-5 ${meta.accentClass}`} />
                    </span>
                    <span className="text-[11px] font-semibold">{meta.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* TOP SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">الخدمات الأكثر طلباً</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              أسعار واضحة، مدة تنفيذ معلنة، وبيانات مطلوبة عند الحاجة فقط.
            </p>
          </div>
          <Button variant="soft" asChild>
            <Link to="/services">
              كل الخدمات
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              platform={catById.get(s.category_id)?.slug ?? "marketing"}
            />
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-surface border-y">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-2xl font-extrabold sm:text-3xl">لماذا تختارنا؟</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                t: "أمان أولاً",
                d: "لا نطلب كلمات المرور، ولا نخزّن بيانات البطاقات، وكل عملية مسجّلة ومحمية.",
              },
              {
                icon: Timer,
                t: "تنفيذ سريع",
                d: "معظم الخدمات تبدأ خلال ساعات، ومدة التنفيذ معلنة قبل الشراء.",
              },
              {
                icon: Wallet,
                t: "محفظة مرنة",
                d: "اشحن رصيدك مرة واحدة واشترِ أي خدمة بضغطة واحدة مع سجل معاملات كامل.",
              },
              {
                icon: Headphones,
                t: "دعم حقيقي",
                d: "نظام تذاكر متابع من فريقنا مع ردود موثقة داخل لوحتك.",
              },
            ].map((f) => (
              <div key={f.t} className="surface-card rounded-2xl p-6">
                <span className="bg-primary/12 text-primary mb-4 grid size-11 place-items-center rounded-xl">
                  <f.icon className="size-5" />
                </span>
                <h3 className="text-base font-bold">{f.t}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">طريقة العمل في 3 خطوات</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", icon: BadgeCheck, t: "اختر خدمتك", d: "تصفّح المتجر واختر الخدمة والكمية المناسبة." },
            { n: "2", icon: CreditCard, t: "اشحن وادفع", d: "اشحن محفظتك بالطريقة التي تناسبك وأكمل الطلب." },
            { n: "3", icon: Rocket, t: "تابع التنفيذ", d: "راقب حالة الطلب من لوحتك حتى الاكتمال." },
          ].map((s) => (
            <div key={s.n} className="surface-card relative overflow-hidden rounded-2xl p-6">
              <span className="text-primary/15 absolute -top-4 left-4 text-7xl font-extrabold">
                {s.n}
              </span>
              <span className="gradient-primary text-primary-foreground relative mb-4 grid size-11 place-items-center rounded-xl">
                <s.icon className="size-5" />
              </span>
              <h3 className="relative text-base font-bold">{s.t}</h3>
              <p className="text-muted-foreground relative mt-2 text-sm">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="bg-surface border-y">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { k: "إجمالي الطلبات", v: num(stats.total_orders) },
            { k: "طلبات مكتملة", v: num(stats.completed_orders) },
            { k: "خدمات نشطة", v: num(stats.total_services) },
            { k: "أقسام المنصات", v: num(catalog.categories.length) },
          ].map((s) => (
            <div key={s.k} className="surface-card rounded-2xl p-6 text-center">
              <span className="gradient-text block text-3xl font-extrabold">{s.v}</span>
              <span className="text-muted-foreground mt-1 block text-xs">{s.k}</span>
            </div>
          ))}
          <p className="text-muted-foreground col-span-full text-center text-xs">
            إحصائيات عامة فقط — لا نكشف أي بيانات خاصة بالعملاء.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">الأسئلة الشائعة</h2>
        <Accordion type="single" collapsible className="surface-card rounded-2xl px-4">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-right text-sm font-bold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="gradient-primary shadow-glow rounded-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="text-primary-foreground text-2xl font-extrabold sm:text-3xl">
            جاهز لتنمية حضورك الرقمي؟
          </h2>
          <p className="text-primary-foreground/80 mx-auto mt-3 max-w-xl text-sm sm:text-base">
            أنشئ حسابك مجاناً وابدأ أول طلب في أقل من دقيقتين.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="xl" variant="glass" asChild>
              <Link to="/register">إنشاء حساب</Link>
            </Button>
            <Button size="xl" variant="secondary" asChild>
              <Link to="/services">تصفّح المتجر</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="sr-only">
        {catalog.categories.map((c) => (
          <span key={c.id}>
            {c.name_ar} {c.name_en} {platformMeta(c.slug).label}
          </span>
        ))}
      </div>
    </PageShell>
  );
}
