-- 1) New protected table
CREATE TABLE IF NOT EXISTS public.empresa_dados_bancarios (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresa(id) ON DELETE CASCADE,
  banco text DEFAULT '',
  agencia text DEFAULT '',
  conta text DEFAULT '',
  tipo_conta text DEFAULT '',
  chave_pix text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa_dados_bancarios ENABLE ROW LEVEL SECURITY;
-- No policies => deny-all to anon/authenticated. Only service_role bypasses RLS.

-- 2) Copy existing data
INSERT INTO public.empresa_dados_bancarios (empresa_id, banco, agencia, conta, tipo_conta, chave_pix)
SELECT id, COALESCE(banco,''), COALESCE(agencia,''), COALESCE(conta,''), COALESCE(tipo_conta,''), COALESCE(chave_pix,'')
FROM public.empresa
ON CONFLICT (empresa_id) DO NOTHING;

-- 3) Drop exposed columns from public empresa table
ALTER TABLE public.empresa
  DROP COLUMN IF EXISTS banco,
  DROP COLUMN IF EXISTS agencia,
  DROP COLUMN IF EXISTS conta,
  DROP COLUMN IF EXISTS tipo_conta,
  DROP COLUMN IF EXISTS chave_pix;

-- 4) updated_at trigger
CREATE TRIGGER trg_empresa_dados_bancarios_updated_at
BEFORE UPDATE ON public.empresa_dados_bancarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();