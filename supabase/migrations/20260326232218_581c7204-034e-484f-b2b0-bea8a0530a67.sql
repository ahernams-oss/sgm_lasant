
ALTER TABLE public.medicoes_servicos
  ADD COLUMN fornecedor_id text DEFAULT '',
  ADD COLUMN fornecedor_nome text DEFAULT '';
