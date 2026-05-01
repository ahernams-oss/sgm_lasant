-- Tabela de assinaturas eletrônicas oficiais das Ordens de Serviço
CREATE TABLE public.os_assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_id UUID NOT NULL,
  os_numero INTEGER NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('fiscal','solicitante')),
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

CREATE INDEX idx_os_assinaturas_os_id ON public.os_assinaturas(os_id);
CREATE INDEX idx_os_assinaturas_codigo ON public.os_assinaturas(codigo_verificador);
-- Garante no máximo 1 assinatura por papel em cada OS (limite total = 2)
CREATE UNIQUE INDEX uq_os_assinaturas_os_papel ON public.os_assinaturas(os_id, papel);

ALTER TABLE public.os_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all os_assinaturas"
ON public.os_assinaturas FOR ALL
TO public
USING (true)
WITH CHECK (true);