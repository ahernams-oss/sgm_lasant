import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_INTERVAL = 60_000;

/**
 * Controla atualização (manual + automática) dos dashboards.
 * `onRefresh` deve recarregar os dados da tela.
 */
export function useDashboardRefresh(onRefresh?: () => void | Promise<void>, intervalMs = DEFAULT_INTERVAL) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await cbRef.current?.();
    } finally {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => { void refresh(); }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoRefresh, intervalMs, refresh]);

  return { lastUpdated, isRefreshing, refresh, autoRefresh, setAutoRefresh };
}
