import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, Info, ShieldCheck, ShoppingCart, TrendingUp, Zap } from "lucide-react";
import { EmptyState, PageShell } from "@/components/page-shell";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { getServiceBySlug } from "@/lib/public.functions";
import { platformMeta } from "@/lib/platform";
import { money, num, orderTotal } from "@/lib/format";
import { useCart } from "@/hooks/useCart";

const serviceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["service", slug],
    queryFn: () => getServiceBySlug({ data: { slug } }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(serviceQuery(params.slug));
    if (!data.service) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.service?.name_ar ?? "خدمة";
    const desc =
      loaderData?.service?.short_description_ar ??
      "اطلب الخدمة الآن من ViralHub بأسعار تنافسية وتنفيذ سريع.";
    return {
      meta: [
        { title: `${name} | ViralHub` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: `${name} | ViralHub` },
        { property: "og:description", content: desc.slice(0, 155) },
      ],
    };
  },
  component: ServiceDetail,
  errorComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState title="تعذّر تحميل الخدمة" description="حاول تحديث الصفحة." />
      </div>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="الخدمة غير متوفرة"
          description="ربما تم إيقافها. تصفّح باقي الخدمات."
          action={
            <Button variant="hero" asChild>
              <Link to="/services">كل الخدمات</Link>
            </Button>
          }
        />
      </div>
    </PageShell>
  ),
});

function ServiceDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(serviceQuery(slug));
  const service = data.service!;
  const meta = platformMeta(data.category?.slug);
  const Icon = meta.icon;
  const navigate = useNavigate();
  const { add } = useCart();

  const [quantity, setQuantity] = useState(service.min_quantity);
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");

  const total = orderTotal(Number(service.price_per_unit), service.unit_size, quantity);

  function validate() {
    if (quantity < service.min_quantity || quantity > service.max_quantity) {
      toast.error(
        `الكمية يجب أن تكون بين ${num(service.min_quantity)} و ${num(service.max_quantity)}`,
      );
      return false;
    }
    if (target.trim().length < 3) {
      toast.error("أدخل الرابط أو المعرّف المطلوب");
      return false;
    }
    return true;
  }

  function handleAdd(goCheckout: boolean) {
    if (!validate()) return;
    add({
      serviceId: service.id,
      slug: service.slug,
      name: service.name_ar,
      platform: data.category?.slug ?? "marketing",
      quantity,
      unitPrice: Number(service.price_per_unit),
      unitSize: service.unit_size,
      total,
      target: target.trim(),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    toast.success("تمت الإضافة إلى السلة");
    if (goCheckout) void navigate({ to: "/checkout" });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-muted-foreground mb-6 flex items-center gap-2 text-xs font-semibold">
          <Link to="/" className="hover:text-foreground">
            الرئيسية
          </Link>
          <span>/</span>
          <Link to="/services" className="hover:text-foreground">
            الخدمات
          </Link>
          <span>/</span>
          <span className="text-foreground">{service.name_ar}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div className="surface-card rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className={`grid size-14 shrink-0 place-items-center rounded-2xl ${meta.ringClass}`}>
                  <Icon className={`size-7 ${meta.accentClass}`} />
                </span>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-[10px]">
                    {meta.label}
                  </Badge>
                  <h1 className="text-2xl font-extrabold sm:text-3xl">{service.name_ar}</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.short_description_ar}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Fact icon={<Clock className="size-4" />} label="مدة التنفيذ" value={service.delivery_time_ar} />
                <Fact
                  icon={<TrendingUp className="size-4" />}
                  label="الطلبات"
                  value={`${num(service.popularity)} طلب`}
                />
                <Fact
                  icon={<Zap className="size-4" />}
                  label="الحد الأدنى"
                  value={num(service.min_quantity)}
                />
              </div>
            </div>

            {service.description_ar && (
              <Section title="تفاصيل الخدمة">
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {service.description_ar}
                </p>
              </Section>
            )}

            {service.instructions_ar && (
              <Section title="طريقة الطلب">
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {service.instructions_ar}
                </p>
              </Section>
            )}

            {service.notes_ar && (
              <Section title="ملاحظات مهمة">
                <div className="bg-warning/10 text-warning flex gap-2 rounded-xl p-4 text-sm">
                  <Info className="mt-0.5 size-4 shrink-0" />
                  <span className="whitespace-pre-line">{service.notes_ar}</span>
                </div>
              </Section>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 lg:h-fit">
            <div className="surface-card space-y-5 rounded-2xl p-6">
              <div>
                <span className="gradient-text text-3xl font-extrabold">{money(total)}</span>
                <p className="text-muted-foreground mt-1 text-xs">
                  {money(service.price_per_unit)} لكل {num(service.unit_size)} وحدة
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qty">الكمية</Label>
                <Input
                  id="qty"
                  type="number"
                  min={service.min_quantity}
                  max={service.max_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value || 0))}
                  className="h-11"
                />
                <Slider
                  value={[quantity]}
                  min={service.min_quantity}
                  max={service.max_quantity}
                  step={Math.max(Math.round(service.min_quantity / 2), 1)}
                  onValueChange={(v) => setQuantity(v[0] ?? service.min_quantity)}
                />
                <p className="text-muted-foreground text-[11px]">
                  من {num(service.min_quantity)} إلى {num(service.max_quantity)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">{service.input_label_ar ?? "الرابط أو المعرّف"}</Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder={service.input_type === "username" ? "@username" : "https://…"}
                  className="h-11"
                  maxLength={400}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">ملاحظة (اختياري)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="أي تفاصيل إضافية تريد إخبارنا بها"
                />
              </div>

              <div className="grid gap-2">
                <Button variant="hero" size="lg" onClick={() => handleAdd(true)}>
                  اطلب الآن
                  <ArrowLeft className="size-4" />
                </Button>
                <Button variant="soft" onClick={() => handleAdd(false)}>
                  <ShoppingCart className="size-4" />
                  أضف إلى السلة
                </Button>
              </div>

              <p className="text-muted-foreground flex items-center gap-2 text-[11px]">
                <ShieldCheck className="text-success size-4" />
                الدفع من رصيد المحفظة مع ضمان الاسترداد عند تعذّر التنفيذ.
              </p>
            </div>
          </aside>
        </div>

        {data.related.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-extrabold">خدمات مشابهة</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((s) => (
                <ServiceCard key={s.id} service={s} platform={data.category?.slug ?? "marketing"} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-secondary/60 rounded-xl p-3">
      <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold">
        {icon}
        {label}
      </span>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card rounded-2xl p-6">
      <h2 className="mb-3 text-base font-extrabold">{title}</h2>
      {children}
    </section>
  );
}
