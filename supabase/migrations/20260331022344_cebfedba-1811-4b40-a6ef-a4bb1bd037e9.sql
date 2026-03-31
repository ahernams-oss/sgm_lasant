ALTER TABLE public.solicitacoes_servicos 
ADD COLUMN data_hora_solicitacao timestamp with time zone DEFAULT now(),
ADD COLUMN solicitante_id text DEFAULT '',
ADD COLUMN solicitante_nome text DEFAULT '';