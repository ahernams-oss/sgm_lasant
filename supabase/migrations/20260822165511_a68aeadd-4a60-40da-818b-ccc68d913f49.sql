ALTER TABLE public.mfa_otps
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS canal TEXT NOT NULL DEFAULT 'whatsapp';

ALTER TABLE public.os_assinaturas
  ADD COLUMN IF NOT EXISTS metodo_autenticacao TEXT NOT NULL DEFAULT 'senha',
  ADD COLUMN IF NOT EXISTS nivel_assinatura TEXT NOT NULL DEFAULT 'simples';

ALTER TABLE public.rdo_assinaturas
  ADD COLUMN IF NOT EXISTS metodo_autenticacao TEXT NOT NULL DEFAULT 'senha',
  ADD COLUMN IF NOT EXISTS nivel_assinatura TEXT NOT NULL DEFAULT 'simples';

CREATE TABLE IF NOT EXISTS public.boletim_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boletim_id UUID NOT NULL,
  boletim_numero INTEGER NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('responsavel','fiscalizacao','gestor')),
  signatario_user_id TEXT NOT NULL,
  signatario_nome TEXT NOT NULL,
  signatario_email TEXT,
  signatario_cargo TEXT,
  signatario_matricula TEXT,
  hash_documento TEXT NOT NULL,
  codigo_verificador TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  ip_origem TEXT,
  user_agent TEXT,
  metodo_autenticacao TEXT NOT NULL DEFAULT 'senha',
  nivel_assinatura TEXT NOT NULL DEFAULT 'simples',
  base_legal TEXT NOT NULL DEFAULT 'Art. 4º, II da Lei nº 14.063/2020 (assinatura eletrônica avançada) c/c Art. 6º, § 1º do Decreto nº 8.539/2015',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.boletim_assinaturas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boletim_assinaturas TO authenticated;
GRANT ALL ON public.boletim_assinaturas TO service_role;

CREATE INDEX IF NOT EXISTS idx_boletim_assinaturas_boletim_id ON public.boletim_assinaturas(boletim_id);
CREATE INDEX IF NOT EXISTS idx_boletim_assinaturas_codigo ON public.boletim_assinaturas(codigo_verificador);
CREATE UNIQUE INDEX IF NOT EXISTS uq_boletim_assinaturas_papel ON public.boletim_assinaturas(boletim_id, papel);

ALTER TABLE public.boletim_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all boletim_assinaturas"
ON public.boletim_assinaturas FOR ALL
TO public
USING (true)
WITH CHECK (true);