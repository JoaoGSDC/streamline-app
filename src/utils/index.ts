import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants";

// Classe para tratamento de erros customizados
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = "GENERIC_ERROR",
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Utilitários para tratamento de erros
export const ErrorHandler = {
  handle: (error: unknown): string => {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return ERROR_MESSAGES.GENERIC_ERROR;
  },

  isNetworkError: (error: unknown): boolean => {
    return (
      error instanceof Error &&
      (error.message.includes("fetch") ||
        error.message.includes("network") ||
        error.message.includes("connection"))
    );
  },

  isValidationError: (error: unknown): boolean => {
    return error instanceof AppError && error.code === "VALIDATION_ERROR";
  },
};

// Utilitários para formatação
export const Formatters = {
  formatDate: (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  },

  formatTime: (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  },

  formatDateTime: (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  },

  formatFollowers: (count: string | number): string => {
    const num = typeof count === "string" ? parseFloat(count) : count;

    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }

    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }

    return num.toString();
  },

  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  },
};

// Utilitários para validação
export const Validators = {
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isTwitchUrl: (url: string): boolean => {
    return url.includes("twitch.tv/");
  },

  isValidUsername: (username: string): boolean => {
    return (
      /^[a-zA-Z0-9_]+$/.test(username) &&
      username.length >= 3 &&
      username.length <= 20
    );
  },

  isValidPassword: (password: string): boolean => {
    return password.length >= 6 && password.length <= 50;
  },
};

// Utilitários para debounce e throttle
export const TimingUtils = {
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },
};

// Utilitários para localStorage com tratamento de erros
export const SafeStorage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === "undefined") return defaultValue;

      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): boolean => {
    try {
      if (typeof window === "undefined") return false;

      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} to localStorage:`, error);
      return false;
    }
  },

  remove: (key: string): boolean => {
    try {
      if (typeof window === "undefined") return false;

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },
};

// Utilitários para classes CSS condicionais
export const ClassNames = {
  combine: (...classes: (string | undefined | null | false)[]): string => {
    return classes.filter(Boolean).join(" ");
  },

  conditional: (
    condition: boolean,
    trueClass: string,
    falseClass?: string
  ): string => {
    return condition ? trueClass : falseClass || "";
  },
};

// Utilitários para arrays
export const ArrayUtils = {
  unique: <T>(array: T[], key?: keyof T): T[] => {
    if (!key) {
      return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },

  groupBy: <T, K extends string | number>(
    array: T[],
    key: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = key(item);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  },

  sortBy: <T>(
    array: T[],
    key: keyof T,
    direction: "asc" | "desc" = "asc"
  ): T[] => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });
  },
};
