import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const DEFAULT_TIMEOUT_MS = 30_000;

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    timeout: DEFAULT_TIMEOUT_MS,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: string; message?: string }>) => {
      const message =
        error.response?.data?.error ??
        error.response?.data?.message ??
        error.message;

      return Promise.reject(new Error(message));
    }
  );

  return instance;
}

export const httpClient = createAxiosInstance();

export function withAbortSignal(
  config: InternalAxiosRequestConfig,
  signal?: AbortSignal
): InternalAxiosRequestConfig {
  if (!signal) return config;
  return { ...config, signal };
}
