-- Tabela de assinaturas eletrônicas oficiais do RDO
CREATE TABLE public.rdo_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rdo_id UUID NOT NULL,
  rdo_numero INTEGER NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('responsavel','fiscalizacao')),
  signatario_user_id TEXT NOT NULL,
  signatario_nome TEXT NOT NULL,
  signatario_email TEXT,
  signatario_cargo TEXT,
  signatario_matricula TEXT,
  hash_documento TEXT NOT NULL,
  codigo_verificador TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  ip_origem TEXT,
  user_agent TEXT,
  base_legal TEXT NOT NULL DEFAULT 'Art. 6º, § 1º do Decreto nº 8.539/2015',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rdo_assinaturas_rdo_id ON public.rdo_assinaturas(rdo_id);
CREATE INDEX idx_rdo_assinaturas_codigo ON public.rdo_assinaturas(codigo_verificador);

ALTER TABLE public.rdo_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all rdo_assinaturas"
ON public.rdo_assinaturas FOR ALL
TO public
USING (true)
WITH CHECK (true);
