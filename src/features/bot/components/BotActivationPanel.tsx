"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Bot, Link2, Loader2 } from "lucide-react";
import { useBotActivationContext } from "@features/bot/context/BotActivationContext";
import { services } from "@services";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  denied: "Autorização negada na Twitch.",
  no_code: "Código OAuth ausente. Tente conectar novamente.",
  invalid_state: "Sessão OAuth expirada. Tente conectar novamente.",
  no_refresh_token: "A Twitch não retornou refresh token. Reconecte a conta.",
  no_user: "Não foi possível obter o perfil da Twitch.",
  account_mismatch:
    "A conta autorizada não é a do canal. Faça login com a conta do streamer.",
  callback_error: "Erro ao concluir a conexão. Tente novamente.",
  streamer_not_found: "Canal não encontrado. Recarregue a página.",
};

export function BotActivationPanel() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const {
    activation,
    active,
    loading,
    submitting,
    activate,
    deactivate,
    refresh,
  } = useBotActivationContext();

  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);

  const botUsername = activation?.botUsername ?? "streaminhubbot";
  const channelUsername = activation?.twitchUsername ?? "seu canal";
  const twitchOAuth = activation?.twitchOAuth;
  const needsBroadcastReconnect =
    !twitchOAuth?.connected || !twitchOAuth?.hasBroadcastScope;

  useEffect(() => {
    const oauthResult = searchParams.get("oauth");
    if (!oauthResult) return;

    if (oauthResult === "connected") {
      toast({
        title: "Conta Twitch conectada",
        description:
          "Comandos como !setjogo e !settitulo estão habilitados para o bot.",
      });
      void refresh();
    } else {
      toast({
        title: "Falha na conexão Twitch",
        description:
          OAUTH_ERROR_MESSAGES[oauthResult] ??
          "Não foi possível conectar a conta Twitch.",
        variant: "destructive",
      });
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("oauth");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [refresh, searchParams, toast]);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      setConfirmActivateOpen(true);
      return;
    }
    setConfirmDeactivateOpen(true);
  };

  const handleConnectTwitch = async () => {
    setConnectingOAuth(true);
    try {
      const { url } = await services.botOAuth.getAuthorizeUrl();
      window.location.href = url;
    } catch {
      toast({
        title: "Não foi possível iniciar a conexão",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      setConnectingOAuth(false);
    }
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
      description:
        "As configurações foram preservadas, mas o bot não atuará no seu chat.",
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
                active ? "Desativar bot no chat" : "Ativar bot no chat"
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

        <div className="mt-4 space-y-3 border-t border-outline-variant/20 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-sm font-medium">Conta Twitch do canal</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {twitchOAuth?.connected && twitchOAuth.hasBroadcastScope
                  ? "Conectada — !setjogo, !settitulo, polls e raid disponíveis."
                  : "Conecte sua conta Twitch para habilitar comandos de broadcast."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={connectingOAuth || submitting}
              onClick={() => void handleConnectTwitch()}
            >
              {connectingOAuth ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecionando…
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  {twitchOAuth?.connected ? "Reconectar Twitch" : "Conectar Twitch"}
                </>
              )}
            </Button>
          </div>

          {needsBroadcastReconnect ? (
            <div
              className="flex gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200/90"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Reconecte sua conta Twitch para habilitar{" "}
                <strong>!setjogo</strong> e <strong>!settitulo</strong> (e
                outros comandos de broadcast). A autorização exige os escopos{" "}
                <code className="text-amber-100">channel:bot</code> e{" "}
                <code className="text-amber-100">channel:manage:broadcast</code>.
              </p>
            </div>
          ) : null}
        </div>
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
                  Para comandos como <strong>!setjogo</strong> e{" "}
                  <strong>!settitulo</strong>, conecte sua conta Twitch logo
                  após ativar.
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
              Suas configurações serão mantidas, mas a autorização Twitch do canal
              será removida.
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
