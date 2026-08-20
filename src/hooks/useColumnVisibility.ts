import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

/**
 * Reusable hook that persists per-user column visibility for a grid.
 * Persists in `user_grid_column_prefs` table (one row per user/page),
 * field `column_visibility`.
 */
export function useColumnVisibility(pageKey: string, columns: ColumnDef[]) {
  const { usuarioLogado } = useAuth();
  const userId = usuarioLogado?.id || null;

  const defaultVisibility = useCallback(() => {
    const map: Record<string, boolean> = {};
    columns.forEach(c => {
      map[c.key] = c.defaultVisible !== false;
    });
    return map;
  }, [columns]);

  const [visibility, setVisibilityState] = useState<Record<string, boolean>>(defaultVisibility);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_grid_column_prefs")
        .select("column_visibility")
        .eq("user_id", userId)
        .eq("page_key", pageKey)
        .maybeSingle();
      if (cancelled) return;
      const base = defaultVisibility();
      if (data?.column_visibility && typeof data.column_visibility === "object") {
        const saved = data.column_visibility as Record<string, boolean>;
        Object.keys(saved).forEach(k => {
          if (k in base) base[k] = !!saved[k];
        });
      }
      setVisibilityState(base);
      loadedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, pageKey]);

  const setVisibility = useCallback(
    async (newVisibility: Record<string, boolean>) => {
      setVisibilityState(newVisibility);
      if (!userId) return;
      await supabase
        .from("user_grid_column_prefs")
        .upsert(
          { user_id: userId, page_key: pageKey, column_visibility: newVisibility },
          { onConflict: "user_id,page_key" }
        );
    },
    [userId, pageKey]
  );

  const toggle = useCallback(
    async (key: string) => {
      const next = { ...visibility, [key]: !visibility[key] };
      await setVisibility(next);
    },
    [visibility, setVisibility]
  );

  const reset = useCallback(async () => {
    await setVisibility(defaultVisibility());
  }, [defaultVisibility, setVisibility]);

  return { visibility, setVisibility, toggle, reset };
}
