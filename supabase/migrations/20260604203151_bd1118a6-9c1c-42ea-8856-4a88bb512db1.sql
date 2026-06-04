
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id
  ON public.usuarios(auth_user_id);

CREATE OR REPLACE FUNCTION public.current_usuario_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_acesso_total()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.cargos c ON c.id::text = u.cargo_id
    WHERE u.auth_user_id = auth.uid()
      AND c.nome IN ('Diretor', 'Gerente Executivo', 'Coordenador de Departamento')
  )
$$;

CREATE OR REPLACE FUNCTION public.has_module(_modulo text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_acesso_total()
    OR EXISTS (
      SELECT 1
      FROM public.usuarios u
      JOIN public.perfis_acesso p ON p.id::text = u.perfil_acesso_id
      WHERE u.auth_user_id = auth.uid()
        AND COALESCE((p.permissoes ->> _modulo)::boolean, false) = true
    )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.usuarios
  SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND auth_user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
