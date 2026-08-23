import type { ReactNode } from "react";
import { SiteNavbar } from "@/components/site-navbar";
import { SiteFooter } from "@/components/site-footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="hero-surface border-b">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        {eyebrow && (
          <span className="bg-primary/12 text-primary mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card grid place-items-center gap-3 rounded-2xl px-6 py-14 text-center">
      {icon && <div className="bg-primary/12 text-primary grid size-12 place-items-center rounded-2xl">{icon}</div>}
      <h3 className="text-base font-bold">{title}</h3>
      {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
      {action}
    </div>
  );
}
