import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Reusable hook that persists per-user column ordering for a grid.
 * Persists in `user_grid_column_prefs` table (one row per user/page).
 */
export function useColumnOrder(pageKey: string, defaultKeys: string[]) {
  const { usuarioLogado } = useAuth();
  const userId = usuarioLogado?.id || null;
  const [order, setOrder] = useState<string[]>(defaultKeys);
  const loadedRef = useRef(false);

  // Reconcile with defaults: keep saved order, drop removed columns and place
  // newly added ones next to their default neighbour instead of at the end.
  const reconcile = useCallback(
    (saved: string[]) => {
      const result = saved.filter((k) => defaultKeys.includes(k));
      const missing = defaultKeys.filter((k) => !result.includes(k));
      for (const key of missing) {
        const defIdx = defaultKeys.indexOf(key);
        let insertAt = -1;
        for (let i = defIdx - 1; i >= 0; i--) {
          const found = result.indexOf(defaultKeys[i]);
          if (found !== -1) { insertAt = found + 1; break; }
        }
        if (insertAt === -1) {
          for (let i = defIdx + 1; i < defaultKeys.length; i++) {
            const found = result.indexOf(defaultKeys[i]);
            if (found !== -1) { insertAt = found; break; }
          }
        }
        result.splice(insertAt === -1 ? result.length : insertAt, 0, key);
      }
      return result;
    },
    [defaultKeys]
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_grid_column_prefs")
        .select("column_order")
        .eq("user_id", userId)
        .eq("page_key", pageKey)
        .maybeSingle();
      if (cancelled) return;
      if (data?.column_order && Array.isArray(data.column_order)) {
        setOrder(reconcile(data.column_order as string[]));
      } else {
        setOrder(defaultKeys);
      }
      loadedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, pageKey]);

  const saveOrder = useCallback(
    async (newOrder: string[]) => {
      setOrder(newOrder);
      if (!userId) return;
      await supabase
        .from("user_grid_column_prefs")
        .upsert(
          { user_id: userId, page_key: pageKey, column_order: newOrder },
          { onConflict: "user_id,page_key" }
        );
    },
    [userId, pageKey]
  );

  const resetOrder = useCallback(() => saveOrder(defaultKeys), [defaultKeys, saveOrder]);

  return { order, setOrder: saveOrder, resetOrder };
}
