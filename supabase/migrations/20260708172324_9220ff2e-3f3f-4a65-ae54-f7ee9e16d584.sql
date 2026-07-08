
CREATE TABLE public.equipamentos_laudos_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  laudo_id UUID NOT NULL REFERENCES public.equipamentos_laudos_condenacao(id) ON DELETE CASCADE,
  laudo_numero INTEGER NOT NULL,
  papel TEXT NOT NULL DEFAULT 'responsavel_tecnico',
  signatario_user_id TEXT NOT NULL,
  signatario_nome TEXT NOT NULL,
  signatario_email TEXT,
  signatario_cargo TEXT,
  signatario_matricula TEXT,
  responsavel_tecnico_nome TEXT,
  responsavel_tecnico_registro TEXT,
  hash_documento TEXT NOT NULL,
  codigo_verificador TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ip_origem TEXT,
  user_agent TEXT,
  base_legal TEXT NOT NULL DEFAULT 'Lei nº 14.063/2020 e Art. 6º, § 1º do Decreto nº 8.539/2015',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_laudos_assinaturas_laudo ON public.equipamentos_laudos_assinaturas(laudo_id);
CREATE INDEX idx_laudos_assinaturas_codigo ON public.equipamentos_laudos_assinaturas(codigo_verificador);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos_laudos_assinaturas TO anon, authenticated;
GRANT ALL ON public.equipamentos_laudos_assinaturas TO service_role;

ALTER TABLE public.equipamentos_laudos_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on laudos assinaturas"
  ON public.equipamentos_laudos_assinaturas
  FOR ALL
  USING (true) WITH CHECK (true);
