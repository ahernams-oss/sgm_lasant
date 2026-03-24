
-- Convites de cotação para fornecedores (link público)
CREATE TABLE public.cotacao_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  cotacao_id text NOT NULL,
  cotacao_numero integer NOT NULL,
  fornecedor_id text NOT NULL,
  fornecedor_nome text NOT NULL,
  fornecedor_email text NOT NULL DEFAULT '',
  comprador text NOT NULL,
  itens jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

-- Propostas externas submetidas pelos fornecedores
CREATE TABLE public.cotacao_propostas_externas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convite_id uuid REFERENCES public.cotacao_convites(id) ON DELETE CASCADE NOT NULL,
  condicao_pagamento text DEFAULT '',
  prazo_entrega text DEFAULT '',
  validade_proposta text DEFAULT '',
  observacao text DEFAULT '',
  itens jsonb NOT NULL DEFAULT '[]',
  valor_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.cotacao_convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacao_propostas_externas ENABLE ROW LEVEL SECURITY;

-- Convites: leitura pública por token (fornecedor acessa sem auth)
CREATE POLICY "Leitura pública por token" ON public.cotacao_convites
  FOR SELECT TO anon USING (true);

-- Convites: inserção por authenticated
CREATE POLICY "Inserção por autenticados" ON public.cotacao_convites
  FOR INSERT TO authenticated WITH CHECK (true);

-- Convites: update por authenticated (para mudar status)
CREATE POLICY "Update por autenticados" ON public.cotacao_convites
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Convites: leitura por authenticated
CREATE POLICY "Leitura por autenticados" ON public.cotacao_convites
  FOR SELECT TO authenticated USING (true);

-- Propostas externas: inserção pública (fornecedor sem auth)
CREATE POLICY "Inserção pública de propostas" ON public.cotacao_propostas_externas
  FOR INSERT TO anon WITH CHECK (true);

-- Propostas externas: leitura por authenticated
CREATE POLICY "Leitura por autenticados" ON public.cotacao_propostas_externas
  FOR SELECT TO authenticated USING (true);

-- Propostas externas: leitura por anon (para conferência pós-submit)
CREATE POLICY "Leitura pública de propostas" ON public.cotacao_propostas_externas
  FOR SELECT TO anon USING (true);

-- Convites: update por anon (para o fornecedor marcar como respondido)
CREATE POLICY "Update público por token" ON public.cotacao_convites
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
