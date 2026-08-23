import { Link } from "@tanstack/react-router";
import { Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/format";
import { platformMeta } from "@/lib/platform";
import type { PublicService } from "@/lib/public.functions";

export function ServiceCard({
  service,
  platform,
}: {
  service: PublicService;
  platform: string;
}) {
  const meta = platformMeta(platform);
  const Icon = meta.icon;

  return (
    <article className="surface-card group hover:shadow-elevated flex flex-col gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid size-11 place-items-center rounded-xl ${meta.ringClass}`}>
            <Icon className={`size-5 ${meta.accentClass}`} />
          </span>
          <div>
            <h3 className="text-sm leading-snug font-bold">{service.name_ar}</h3>
            <span className="text-muted-foreground text-xs">{meta.label}</span>
          </div>
        </div>
        <Badge variant="outline" className="text-success border-success/40 shrink-0 text-[10px]">
          متاحة
        </Badge>
      </div>

      <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
        {service.short_description_ar}
      </p>

      <div className="text-muted-foreground flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" />
          {service.delivery_time_ar}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="size-3.5" />
          {service.popularity} طلب
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t pt-4">
        <div>
          <span className="gradient-text text-xl font-extrabold">
            {money(service.price_per_unit)}
          </span>
          <span className="text-muted-foreground block text-[11px]">
            {service.unit_size > 1 ? `لكل ${service.unit_size.toLocaleString("en-US")}` : "للوحدة"}
          </span>
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link to="/services/$slug" params={{ slug: service.slug }}>
            اطلب الآن
          </Link>
        </Button>
      </div>
    </article>
  );
}
