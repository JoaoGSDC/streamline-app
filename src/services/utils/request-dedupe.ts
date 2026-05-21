const inFlightByKey = new Map<string, Promise<unknown>>();

/**
 * Evita requisições GET duplicadas em paralelo para a mesma chave.
 * Útil quando useEffect reexecuta antes da resposta anterior terminar.
 */
export async function dedupeRequest<T>(
  key: string,
  request: () => Promise<T>
): Promise<T> {
  const existing = inFlightByKey.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = request().finally(() => {
    if (inFlightByKey.get(key) === promise) {
      inFlightByKey.delete(key);
    }
  });

  inFlightByKey.set(key, promise);
  return promise;
}
