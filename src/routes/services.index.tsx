import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LayoutGrid, Search, SearchX } from "lucide-react";
import { z } from "zod";
import { EmptyState, PageHeader, PageShell } from "@/components/page-shell";
import { ServiceCard } from "@/components/service-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getCatalog } from "@/lib/public.functions";
import { platformMeta } from "@/lib/platform";

const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 60_000,
});

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/services/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "متجر الخدمات | ViralHub" },
      {
        name: "description",
        content:
          "تصفّح جميع خدمات السوشيال ميديا: تيك توك، إنستغرام، يوتيوب، تيليجرام، X، ديسكورد، فيسبوك، تسويق رقمي وتصميم — بأسعار واضحة ومدة تنفيذ معلنة.",
      },
      { property: "og:title", content: "متجر الخدمات | ViralHub" },
      {
        property: "og:description",
        content: "كل خدمات الترويج والتسويق والتصميم في متجر واحد مع فلترة حسب المنصة والبحث الفوري.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: ServicesPage,
});

function ServicesPage() {
  const { data } = useSuspenseQuery(catalogQuery);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const activeCategory = search.category ?? "all";
  const catById = useMemo(
    () => new Map(data.categories.map((c) => [c.id, c])),
    [data.categories],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.services.filter((s) => {
      const cat = catById.get(s.category_id);
      if (activeCategory !== "all" && cat?.slug !== activeCategory) return false;
      if (!term) return true;
      return (
        s.name_ar.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        (s.short_description_ar ?? "").toLowerCase().includes(term)
      );
    });
  }, [data.services, catById, activeCategory, q]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="المتجر"
        title="متجر الخدمات"
        description="اختر المنصة، ابحث عن الخدمة، واطلبها فوراً برصيد محفظتك. كل الأسعار بالدولار الأمريكي."
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="surface-card sticky top-16 z-30 mb-8 space-y-4 rounded-2xl p-4">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                void navigate({
                  search: (prev) => ({ ...prev, q: e.target.value || undefined }),
                  replace: true,
                });
              }}
              placeholder="ابحث عن خدمة… (متابعين، مشاهدات، تصميم)"
              className="h-11 pr-10"
              maxLength={80}
            />
          </div>

          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <CategoryChip
              active={activeCategory === "all"}
              label="جميع الخدمات"
              onClick={() => navigate({ search: (p) => ({ ...p, category: undefined }) })}
            />
            {data.categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={activeCategory === c.slug}
                label={c.name_ar}
                onClick={() => navigate({ search: (p) => ({ ...p, category: c.slug }) })}
              />
            ))}
          </div>
        </div>

        <p className="text-muted-foreground mb-5 text-sm">
          {filtered.length} خدمة{" "}
          {activeCategory !== "all" && `في قسم ${platformMeta(activeCategory).label}`}
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="لا توجد نتائج مطابقة"
            description="جرّب كلمة بحث أخرى أو اختر قسماً مختلفاً."
            action={
              <Button
                variant="soft"
                onClick={() => {
                  setQ("");
                  void navigate({ search: {} });
                }}
              >
                إعادة تعيين الفلاتر
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                platform={catById.get(s.category_id)?.slug ?? "marketing"}
              />
            ))}
          </div>
        )}

        <div className="surface-card mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <span className="bg-primary/12 text-primary grid size-11 place-items-center rounded-xl">
              <LayoutGrid className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold">لم تجد ما تبحث عنه؟</h3>
              <p className="text-muted-foreground text-sm">اطلب خدمة مخصصة عبر مركز الدعم.</p>
            </div>
          </div>
          <Button variant="hero" asChild>
            <Link to="/support">تواصل معنا</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
        active
          ? "gradient-primary text-primary-foreground shadow-glow"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
      }`}
    >
      {label}
    </button>
  );
}
