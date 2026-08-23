import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="ViralHub">
      <span className="gradient-primary shadow-glow grid size-9 place-items-center rounded-xl">
        <Zap className="text-primary-foreground size-5" strokeWidth={2.6} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-lg font-extrabold tracking-tight">
            Viral<span className="gradient-text">Hub</span>
          </span>
          <span className="text-muted-foreground block text-[10px] font-medium">
            مركز خدمات السوشيال ميديا
          </span>
        </span>
      )}
    </Link>
  );
}
