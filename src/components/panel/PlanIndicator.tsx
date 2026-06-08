"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crown } from "lucide-react";
import { usePanelConfig } from "@/contexts/PanelConfigContext";
import type { PlanTier } from "@/config/panel-features";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<Exclude<PlanTier, "free">, string> = {
  pro: "Pro",
  enterprise: "Enterprise",
};

interface PlanIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function PlanIndicator({ className, compact = false }: PlanIndicatorProps) {
  const { plan, planExpiresAt } = usePanelConfig();

  if (plan === "free") {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border border-amber-500/15 bg-amber-500/10",
          compact ? "mx-0 mb-0 px-3 py-1.5" : "mx-3 mb-3 px-3 py-2",
          className
        )}
      >
        <span className="text-xs text-amber-400/80">Plano Gratuito</span>
        <Link
          href="/pricing"
          className="text-xs font-medium text-amber-400 underline hover:text-amber-300"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  const expiringLabel = planExpiresAt
    ? `até ${format(planExpiresAt, "dd MMM yyyy", { locale: ptBR })}`
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-purple-500/15 bg-purple-500/10",
        compact ? "mx-0 mb-0 px-3 py-1.5" : "mx-3 mb-3 px-3 py-2",
        className
      )}
    >
      <Crown className="h-3 w-3 shrink-0 text-purple-400" aria-hidden />
      <span className="text-xs text-purple-300">
        {PLAN_LABELS[plan]}
        {expiringLabel ? ` · ${expiringLabel}` : ""}
      </span>
    </div>
  );
}
