import { useCallback } from "react";

export const useFormValidation = () => {
  const validateUsername = useCallback((username: string): string | null => {
    if (!username) return "Nome de usuário é obrigatório";
    if (username.length < 3)
      return "Nome de usuário deve ter pelo menos 3 caracteres";
    if (username.length > 20)
      return "Nome de usuário deve ter no máximo 20 caracteres";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Nome de usuário deve conter apenas letras, números e underscore";
    return null;
  }, []);

  const validatePassword = useCallback((password: string): string | null => {
    if (!password) return "Senha é obrigatória";
    if (password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
    if (password.length > 50) return "Senha deve ter no máximo 50 caracteres";
    return null;
  }, []);

  const validateEmail = useCallback((email: string): string | null => {
    if (!email) return "Email é obrigatório";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Email inválido";
    return null;
  }, []);

  return {
    validateUsername,
    validatePassword,
    validateEmail,
  };
};
