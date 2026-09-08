CREATE OR REPLACE FUNCTION public.mig_export_tmp(_t text, _limit int DEFAULT 200, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE r jsonb;
BEGIN
  IF _t !~ '^[a-z0-9_]+$' THEN RAISE EXCEPTION 'invalido'; END IF;
  EXECUTE format('SELECT COALESCE(jsonb_agg(t),''[]''::jsonb) FROM (SELECT * FROM public.%I LIMIT %s OFFSET %s) t', _t, _limit, _offset) INTO r;
  RETURN r;
END;$$;
GRANT EXECUTE ON FUNCTION public.mig_export_tmp(text,int,int) TO anon;