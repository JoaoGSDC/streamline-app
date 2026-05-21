import type { TwitchAuthErrorCode } from "@/types/auth";

const AUTH_ERROR_MESSAGES: Record<TwitchAuthErrorCode, string> = {
  access_denied: "Você cancelou a autorização",
  no_code: "Nenhum código de autorização recebido",
  no_user: "Não foi possível obter informações do usuário",
  callback_error: "Erro ao processar autorização",
  invalid_state: "Sessão de autenticação inválida. Tente novamente.",
  unknown: "Erro desconhecido",
};

export function getAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode) return null;
  const knownCode = errorCode as TwitchAuthErrorCode;
  return AUTH_ERROR_MESSAGES[knownCode] ?? AUTH_ERROR_MESSAGES.unknown;
}
