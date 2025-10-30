// Configurações da aplicação
export const APP_CONFIG = {
  name: "Streamline",
  description: "Agenda de Jogos para Streamers",
  version: "1.0.0",
} as const;

// Configurações de localStorage
export const STORAGE_KEYS = {
  STREAMERS: "streamers",
  CURRENT_STREAMER: "currentStreamer",
  GAMES: "games",
  SCHEDULED_STREAMS: "scheduledStreams",
} as const;

// Configurações de API
export const API_ENDPOINTS = {
  TWITCH_AUTH: "https://id.twitch.tv/oauth2/authorize",
  TWITCH_TOKEN: "https://id.twitch.tv/oauth2/token",
  TWITCH_USERS: "https://api.twitch.tv/helix/users",
  GAMES: "/api/games",
  SCHEDULED_STREAMS: "/api/scheduled-streams",
} as const;

// Configurações de rotas
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  ADMIN: "/admin",
  STREAMER_PROFILE: (username: string) => `/${username}`,
} as const;

// Configurações de view types
export const VIEW_TYPES = {
  DAILY: { type: "daily" as const, label: "Agenda de Hoje" },
  WEEKLY: { type: "weekly" as const, label: "Agenda da Semana" },
  MONTHLY: { type: "monthly" as const, label: "Agenda do Mês" },
} as const;

// Configurações de validação
export const VALIDATION_RULES = {
  USERNAME: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    minLength: 6,
    maxLength: 50,
  },
  BIO: {
    maxLength: 200,
  },
  GAME_TITLE: {
    minLength: 1,
    maxLength: 100,
  },
} as const;

// Mensagens de erro
export const ERROR_MESSAGES = {
  LOGIN_FAILED: "Usuário ou senha incorretos.",
  USERNAME_EXISTS: "Este nome de usuário da Twitch já está em uso.",
  NETWORK_ERROR: "Erro de conexão. Tente novamente.",
  VALIDATION_ERROR: "Por favor, verifique os dados informados.",
  GENERIC_ERROR: "Ocorreu um erro inesperado.",
} as const;

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login realizado!",
  SIGNUP_SUCCESS: "Cadastro realizado!",
  GAME_ADDED: "Jogo adicionado!",
  GAME_REMOVED: "Jogo removido!",
  LOGOUT_SUCCESS: "Logout realizado",
} as const;
