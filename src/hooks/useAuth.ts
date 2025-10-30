import { useState, useEffect, useCallback } from "react";
import { Streamer, AuthState } from "@/types";
import { StreamerService } from "@/services";

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const currentUser = StreamerService.getCurrent();

    // Atualizar o estado de autenticação
    setAuthState({
      user: currentUser,
      isAuthenticated: !!currentUser,
      isLoading: false,
    });
  }, []);

  const login = useCallback((user: Streamer) => {
    // Salvar o usuário no localStorage
    StreamerService.setCurrent(user);

    // Atualizar o estado de autenticação
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    // Remover o usuário do localStorage
    StreamerService.removeCurrent();

    // Atualizar o estado de autenticação
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback(
    (userData: Partial<Streamer>) => {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };
      StreamerService.setCurrent(updatedUser);
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    },
    [authState.user]
  );

  return {
    ...authState,
    login,
    logout,
    updateUser,
  };
};
