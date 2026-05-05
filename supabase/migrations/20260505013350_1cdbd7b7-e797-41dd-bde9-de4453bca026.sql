-- Tabela de assinaturas eletrônicas para Ordem de Compra (Pedido de Compra)
CREATE TABLE IF NOT EXISTS public.pc_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL,
  pedido_numero integer NOT NULL,
  papel text NOT NULL DEFAULT 'aprovador',
  signatario_user_id text NOT NULL,
  signatario_nome text NOT NULL,
  signatario_email text,
  signatario_cargo text,
  signatario_matricula text,
  hash_documento text NOT NULL,
  codigo_verificador text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ip_origem text,
  user_agent text,
  base_legal text NOT NULL DEFAULT 'LEI Nº 14.063, DE 23 DE SETEMBRO DE 2020',
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, papel)
);

CREATE INDEX IF NOT EXISTS idx_pc_assinaturas_pedido ON public.pc_assinaturas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pc_assinaturas_codigo ON public.pc_assinaturas(codigo_verificador);

ALTER TABLE public.pc_assinaturas ENABLE ROW LEVEL SECURITY;

-- Acesso público (auth custom public/anon, padrão do projeto)
CREATE POLICY "pc_assinaturas_select" ON public.pc_assinaturas FOR SELECT USING (true);
CREATE POLICY "pc_assinaturas_insert" ON public.pc_assinaturas FOR INSERT WITH CHECK (true);
CREATE POLICY "pc_assinaturas_update" ON public.pc_assinaturas FOR UPDATE USING (true);
CREATE POLICY "pc_assinaturas_delete" ON public.pc_assinaturas FOR DELETE USING (true);
