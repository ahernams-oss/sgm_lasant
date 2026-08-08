CREATE OR REPLACE FUNCTION public.req_header(_name text)
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT nullif(current_setting('request.headers', true), '')::json ->> _name
$$;