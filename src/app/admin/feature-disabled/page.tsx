import Link from "next/link";
import { Crown, EyeOff } from "lucide-react";
import { getFeature } from "@/config/panel-features";
import { Button } from "@/components/ui/button";

interface FeatureDisabledPageProps {
  searchParams: Promise<{ feature?: string; reason?: string }>;
}

export default async function FeatureDisabledPage({
  searchParams,
}: FeatureDisabledPageProps) {
  const params = await searchParams;
  const feature = getFeature(params.feature ?? "");
  const reason = params.reason;

  const isPlanBlocked = reason === "plan";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        {isPlanBlocked ? (
          <Crown className="h-6 w-6 text-amber-400" aria-hidden />
        ) : (
          <EyeOff className="h-6 w-6 text-muted-foreground" aria-hidden />
        )}
      </div>

      <h1 className="mb-2 text-lg font-semibold text-foreground">
        {isPlanBlocked
          ? `${feature?.label ?? "Esta funcionalidade"} requer o plano Pro`
          : `${feature?.label ?? "Esta página"} está desabilitada`}
      </h1>

      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {isPlanBlocked
          ? `Faça upgrade para o plano Pro para desbloquear ${feature?.label?.toLowerCase() ?? "esta funcionalidade"}.`
          : "Você desabilitou esta seção nas suas preferências de painel."}
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {isPlanBlocked ? (
          <Button asChild>
            <Link href="/pricing">Ver planos</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/admin/personalizacao">Reabilitar em Personalizar painel</Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href="/admin">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
