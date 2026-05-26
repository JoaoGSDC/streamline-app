"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useBotActivationContext } from "@features/bot/context/BotActivationContext";
import { Skeleton } from "@/components/ui/skeleton";

const BOT_ROOT_PATH = "/admin/bot";

export function BotModuleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { active, loading } = useBotActivationContext();

  const isRoot = pathname === BOT_ROOT_PATH;

  useEffect(() => {
    if (loading || active || isRoot) return;
    router.replace(BOT_ROOT_PATH);
  }, [active, isRoot, loading, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!active && !isRoot) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-outline-variant/40 bg-surface-container-low/30 px-6 py-16 text-center">
        <Lock className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="max-w-md text-body-sm text-muted-foreground">
          Ative o bot StreaminHub acima para acessar esta seção.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
