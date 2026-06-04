"use client";

import Link from "next/link";
import { ArrowRight, Coins, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StoreBuyCoinsPanelProps {
  pixieUrl: string;
  pixieUsername: string;
  streamerName: string;
  userCoins?: number;
  authenticated?: boolean;
}

export function StoreBuyCoinsPanel({
  pixieUrl,
  pixieUsername,
  streamerName,
  userCoins = 0,
  authenticated = false,
}: StoreBuyCoinsPanelProps) {
  const steps = [
    {
      title: "Apoie pelo Pixie",
      description: `Contribua na página oficial @${pixieUsername} com PIX — rápido e seguro.`,
    },
    {
      title: "Coins creditadas",
      description:
        "Após a confirmação do pagamento, suas Coins aparecem aqui na plataforma (pode levar alguns minutos).",
    },
    {
      title: "Resgate na loja",
      description: `Use Coins nos produtos premium da loja de ${streamerName}.`,
    },
  ];

  return (
    <Card className="overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card to-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-title-sm">
          <Coins className="h-5 w-5 text-amber-500" />
          Quer resgatar com Coins?
        </CardTitle>
        <p className="text-body-sm text-muted-foreground">
          {authenticated ? (
            <>
              Você tem{" "}
              <strong className="text-amber-600">
                {userCoins.toLocaleString("pt-BR")} coins
              </strong>
              . Coins são a moeda premium — ideal para recompensas exclusivas deste
              canal parceiro.
            </>
          ) : (
            <>
              Coins são a moeda premium desta loja parceira. Apoie pelo Pixie para
              receber Coins e resgatar recompensas exclusivas.
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-body-xs font-bold text-amber-700">
                {index + 1}
              </span>
              <div>
                <p className="text-body-sm font-medium">{step.title}</p>
                <p className="text-body-xs text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="bg-amber-600 text-white hover:bg-amber-600/90"
          >
            <a href={pixieUrl} target="_blank" rel="noopener noreferrer">
              Comprar / apoiar no Pixie
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href={pixieUrl} target="_blank" rel="noopener noreferrer">
              Ver página @{pixieUsername}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-outline-variant/20 bg-muted/20 p-3 text-body-xs text-muted-foreground">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          Pixie.gg é a plataforma de monetização via PIX usada por milhares de
          criadores. Ao apoiar, você ajuda {streamerName} e desbloqueia Coins
          para usar nesta loja.
        </p>
      </CardContent>
    </Card>
  );
}
