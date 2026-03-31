ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS matricula text DEFAULT ''::text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ramal text DEFAULT ''::text;