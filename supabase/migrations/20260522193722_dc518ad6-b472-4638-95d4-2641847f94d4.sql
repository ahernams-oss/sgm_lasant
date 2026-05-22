
-- ============================================================
-- 1. usuarios_credenciais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios_credenciais (
  usuario_id uuid PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
  senha text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.usuarios_credenciais ENABLE ROW LEVEL SECURITY;
-- Sem policies = nenhum role público/anon pode ler/escrever. Service role bypass-a RLS.

-- Migra dados existentes
INSERT INTO public.usuarios_credenciais (usuario_id, senha)
SELECT id, senha FROM public.usuarios WHERE senha IS NOT NULL AND senha <> ''
ON CONFLICT (usuario_id) DO NOTHING;

-- Adiciona senha_status para auditoria (sem expor a senha)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS senha_status text NOT NULL DEFAULT 'sem_senha';

-- Função para calcular status
CREATE OR REPLACE FUNCTION public.refresh_usuario_senha_status(_usuario_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_senha text;
BEGIN
  SELECT senha INTO v_senha FROM public.usuarios_credenciais WHERE usuario_id = _usuario_id;
  UPDATE public.usuarios
  SET senha_status = CASE
    WHEN v_senha IS NULL OR v_senha = '' THEN 'sem_senha'
    WHEN v_senha ~ '^\$2[aby]\$\d{2}\$' THEN 'seguro'
    ELSE 'legado'
  END
  WHERE id = _usuario_id;
END;
$$;

-- Trigger para manter status sincronizado
CREATE OR REPLACE FUNCTION public.tg_usuarios_credenciais_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_usuario_senha_status(OLD.usuario_id);
  ELSE
    PERFORM public.refresh_usuario_senha_status(NEW.usuario_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_credenciais_status ON public.usuarios_credenciais;
CREATE TRIGGER trg_usuarios_credenciais_status
AFTER INSERT OR UPDATE OR DELETE ON public.usuarios_credenciais
FOR EACH ROW EXECUTE FUNCTION public.tg_usuarios_credenciais_status();

-- Atualiza status inicial para todos os usuários migrados
UPDATE public.usuarios u SET senha_status = CASE
  WHEN c.senha IS NULL OR c.senha = '' THEN 'sem_senha'
  WHEN c.senha ~ '^\$2[aby]\$\d{2}\$' THEN 'seguro'
  ELSE 'legado'
END
FROM public.usuarios_credenciais c WHERE c.usuario_id = u.id;

-- Remove coluna senha do usuarios
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS senha;

-- ============================================================
-- 2. clientes_credenciais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clientes_credenciais (
  cliente_id uuid PRIMARY KEY REFERENCES public.clientes(id) ON DELETE CASCADE,
  senha_portal text,
  senha_portal_trocada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clientes_credenciais ENABLE ROW LEVEL SECURITY;
-- Sem policies = sem acesso público.

INSERT INTO public.clientes_credenciais (cliente_id, senha_portal, senha_portal_trocada)
SELECT id, senha_portal, COALESCE(senha_portal_trocada, false) FROM public.clientes
WHERE senha_portal IS NOT NULL AND senha_portal <> ''
ON CONFLICT (cliente_id) DO NOTHING;

ALTER TABLE public.clientes DROP COLUMN IF EXISTS senha_portal;
ALTER TABLE public.clientes DROP COLUMN IF EXISTS senha_portal_trocada;

-- ============================================================
-- 3. empresa_credenciais
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empresa_credenciais (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresa(id) ON DELETE CASCADE,
  certificado_a1_senha text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.empresa_credenciais ENABLE ROW LEVEL SECURITY;
-- Sem policies = sem acesso público.

INSERT INTO public.empresa_credenciais (empresa_id, certificado_a1_senha)
SELECT id, certificado_a1_senha FROM public.empresa
WHERE certificado_a1_senha IS NOT NULL AND certificado_a1_senha <> ''
ON CONFLICT (empresa_id) DO NOTHING;

ALTER TABLE public.empresa DROP COLUMN IF EXISTS certificado_a1_senha;

-- ============================================================
-- 4. Trigger updated_at nas novas tabelas
-- ============================================================
DROP TRIGGER IF EXISTS trg_usuarios_credenciais_updated ON public.usuarios_credenciais;
CREATE TRIGGER trg_usuarios_credenciais_updated
BEFORE UPDATE ON public.usuarios_credenciais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_clientes_credenciais_updated ON public.clientes_credenciais;
CREATE TRIGGER trg_clientes_credenciais_updated
BEFORE UPDATE ON public.clientes_credenciais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_empresa_credenciais_updated ON public.empresa_credenciais;
CREATE TRIGGER trg_empresa_credenciais_updated
BEFORE UPDATE ON public.empresa_credenciais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. Restringir buckets privados (certificados-digitais, nfes-xml)
-- Drop policies públicas; service_role já bypass-a RLS.
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (
        policyname ILIKE '%certificados-digitais%' OR
        policyname ILIKE '%certificados_digitais%' OR
        policyname ILIKE '%nfes-xml%' OR
        policyname ILIKE '%nfes_xml%' OR
        policyname = 'certificados-digitais all' OR
        policyname = 'nfes_xml_all'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;
