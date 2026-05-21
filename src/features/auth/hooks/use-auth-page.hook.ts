"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { services } from "@services";
import { getAuthErrorMessage } from "@features/auth/utils/auth-error-messages";

interface UseAuthPageParams {
  onAuthError: (message: string) => void;
}

export function useAuthPage({ onAuthError }: UseAuthPageParams) {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const errorCode = searchParams?.get("error");
    const message = getAuthErrorMessage(errorCode);
    if (!message) return;

    setErrorMessage(message);
    onAuthError(message);
  }, [searchParams, onAuthError]);

  const handleTwitchLogin = useCallback(async () => {
    setIsRedirecting(true);
    try {
      const authorizeUrl = await services.auth.twitch.getAuthorizeUrl();
      window.location.href = authorizeUrl;
    } catch (loginError) {
      setIsRedirecting(false);
      const message =
        loginError instanceof Error
          ? loginError.message
          : "Não foi possível iniciar o login com Twitch";
      setErrorMessage(message);
      onAuthError(message);
    }
  }, [onAuthError]);

  return {
    errorMessage,
    isRedirecting,
    handleTwitchLogin,
  };
}
