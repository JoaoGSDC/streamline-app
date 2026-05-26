"use client";

import { useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useBotActivationContext } from "@features/bot/context/BotActivationContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function BotActivationPanel() {
  const { toast } = useToast();
  const {
    activation,
    active,
    loading,
    submitting,
    activate,
    deactivate,
  } = useBotActivationContext();

  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const botUsername = activation?.botUsername ?? "streaminhubbot";
  const channelUsername = activation?.twitchUsername ?? "seu canal";

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setConfirmActivateOpen(true);
      return;
    }
    setConfirmDeactivateOpen(true);
  };

  const handleConfirmActivate = async () => {
    const result = await activate();
    setConfirmActivateOpen(false);

    if (!result.ok) {
      toast({
        title: "Não foi possível ativar o bot",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bot ativado",
      description: `O bot @${botUsername} foi registrado para o chat de ${channelUsername}.`,
    });
  };

  const handleConfirmDeactivate = async () => {
    const result = await deactivate();
    setConfirmDeactivateOpen(false);

    if (!result.ok) {
      toast({
        title: "Não foi possível desativar o bot",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bot desativado",
      description: "As configurações foram preservadas, mas o bot não atuará no seu chat.",
    });
  };

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-lg" />;
  }

  return (
    <>
      <section
        className="rounded-lg border border-outline-variant/30 bg-surface-container-low/40 p-4"
        aria-labelledby="bot-activation-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/30">
              <Bot className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <div>
              <h2
                id="bot-activation-heading"
                className="font-headline text-headline-sm font-semibold"
              >
                Bot StreaminHub no chat
              </h2>
              <p className="mt-1 text-body-sm text-muted-foreground">
                {active
                  ? `Ativo em twitch.tv/${channelUsername}. Configure comandos, timers e moderação abaixo.`
                  : "Ative para adicionar o bot da StreaminHub ao chat da sua live na Twitch."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:shrink-0">
            <Label
              htmlFor="bot-activation-switch"
              className="text-body-sm font-medium"
            >
              {active ? "Ativado" : "Desativado"}
            </Label>
            <Switch
              id="bot-activation-switch"
              checked={active}
              disabled={submitting}
              onCheckedChange={handleToggle}
              aria-label={
                active
                  ? "Desativar bot no chat"
                  : "Ativar bot no chat"
              }
            />
          </div>
        </div>

        {!active && (
          <p className="mt-3 text-body-sm text-muted-foreground">
            Enquanto o bot estiver desativado, as seções de comandos, timers,
            moderação e variáveis ficam bloqueadas.
          </p>
        )}
      </section>

      <AlertDialog open={confirmActivateOpen} onOpenChange={setConfirmActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar bot no seu chat?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  Ao confirmar, o bot{" "}
                  <strong className="font-semibold text-foreground">
                    @{botUsername}
                  </strong>{" "}
                  da StreaminHub será adicionado ao chat da Twitch do canal{" "}
                  <strong className="font-semibold text-foreground">
                    {channelUsername}
                  </strong>
                  .
                </p>
                <p>
                  Você poderá configurar comandos, timers e moderação somente
                  após a ativação.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmActivate();
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ativando…
                </>
              ) : (
                "Confirmar ativação"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeactivateOpen}
        onOpenChange={setConfirmDeactivateOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar bot no chat?</AlertDialogTitle>
            <AlertDialogDescription>
              O bot @{botUsername} deixará de atuar no chat de {channelUsername}.
              Suas configurações serão mantidas para quando você reativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDeactivate();
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando…
                </>
              ) : (
                "Desativar bot"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
