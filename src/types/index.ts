// Tipos para Streamers
export interface Streamer {
  id: string;
  twitchId?: string;
  name: string;
  twitchUsername: string;
  avatar?: string;
  bio?: string;
  twitchUrl?: string;
  followers?: string;
  createdAt: Date;
}

// Tipos para Jogos
export interface Game {
  id: string;
  igdbId?: number;
  title: string;
  image?: string;
  synopsis?: string;
  genre?: string[];
  platform?: string;
  website?: string;
  storeLinks?: StoreLink[];
  isCustomGame?: boolean;
  streamerId?: string; // Adicionar streamerId ao tipo Game
  createdAt: Date;
}

// Tipos para Streams Agendadas
export interface ScheduledStream {
  id: string;
  streamerId: string;
  gameId: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: string;
  links?: StreamLink[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos auxiliares
export interface StoreLink {
  name: string;
  url: string;
}

export interface StreamLink {
  name: string;
  url: string;
}

// Tipos para formulários
export interface LoginFormData {
  twitchUsername: string;
  password: string;
}

export interface SignupFormData {
  name: string;
  twitchUsername: string;
  password: string;
  bio: string;
}

export interface GameFormData {
  title: string;
  image: string;
  scheduledTime: string;
  duration: string;
  platform: string;
  synopsis: string;
  genre: string;
}

// Tipos para API responses
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Tipos para componentes
export interface ViewType {
  type: "daily" | "weekly" | "monthly";
  label: string;
}

// Tipos para autenticação
export interface AuthState {
  user: Streamer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tipos para contexto
export interface AppContextType {
  auth: AuthState;
  login: (user: Streamer) => void;
  logout: () => void;
  updateUser: (user: Partial<Streamer>) => void;
}
