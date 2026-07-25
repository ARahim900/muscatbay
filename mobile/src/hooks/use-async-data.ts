/**
 * Generic async-read hook with explicit loading / error / refreshing states.
 *
 * Three rules it enforces for every screen in this app:
 *  • An error is an error. It is returned, not swallowed, so the UI can say
 *    what failed instead of rendering an empty screen that looks like "no data".
 *  • Stale results from a superseded fetch are discarded, so a slow first
 *    request cannot overwrite a fast refresh.
 *  • `refresh()` is separate from the initial load so pull-to-refresh does not
 *    blank the screen.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncData<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const requestId = useRef(0);
  const mounted = useRef(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (isRefresh: boolean) => {
    const id = ++requestId.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await loaderRef.current();
      if (!mounted.current || id !== requestId.current) return;
      setData(result);
      setError(null);
    } catch (caught) {
      if (!mounted.current || id !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      if (mounted.current && id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = useCallback(() => run(true), [run]);

  return { data, error, loading, refreshing, refresh };
}
