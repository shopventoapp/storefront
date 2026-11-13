"use client";
import { useEffect, useState } from "react";
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: boolean;
  }>({ data: null, loading: true, error: false });
  // The mounted service/location key controls the resource lifetime.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reload by parent key
  useEffect(() => {
    const c = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const data = await load(
          AbortSignal.any([c.signal, AbortSignal.timeout(10000)]),
        );
        if (!c.signal.aborted) setState({ data, loading: false, error: false });
      } catch {
        if (!c.signal.aborted)
          setState((previous) =>
            previous.data
              ? previous
              : { data: null, loading: false, error: true },
          );
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    return () => {
      c.abort();
      clearInterval(timer);
    };
  }, []);
  return state;
}
