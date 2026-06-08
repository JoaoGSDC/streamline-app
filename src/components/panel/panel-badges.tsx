import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/config/panel-features";

interface PlanBadgeProps {
  plan: PlanTier;
  size?: "xs" | "sm";
}

export function PlanBadge({ plan, size = "sm" }: PlanBadgeProps) {
  if (plan === "free") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 font-medium text-amber-400",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      <Crown
        className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"}
        aria-hidden
      />
      {plan === "pro" ? "Pro" : "Enterprise"}
    </span>
  );
}

interface ComingSoonBadgeProps {
  size?: "xs" | "sm";
}

export function ComingSoonBadge({ size = "sm" }: ComingSoonBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 font-medium text-blue-400",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
    >
      Em breve
    </span>
  );
}
