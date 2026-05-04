CREATE TABLE IF NOT EXISTS public.user_grid_column_prefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  page_key TEXT NOT NULL,
  column_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, page_key)
);

ALTER TABLE public.user_grid_column_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read user_grid_column_prefs"
  ON public.user_grid_column_prefs FOR SELECT USING (true);
CREATE POLICY "Public insert user_grid_column_prefs"
  ON public.user_grid_column_prefs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update user_grid_column_prefs"
  ON public.user_grid_column_prefs FOR UPDATE USING (true);
CREATE POLICY "Public delete user_grid_column_prefs"
  ON public.user_grid_column_prefs FOR DELETE USING (true);

CREATE TRIGGER update_user_grid_column_prefs_updated_at
  BEFORE UPDATE ON public.user_grid_column_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_grid_col_prefs_user_page ON public.user_grid_column_prefs(user_id, page_key);