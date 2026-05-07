CREATE TABLE public.avaliacoes_desempenho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data_avaliacao date NOT NULL DEFAULT CURRENT_DATE,
  periodo_referencia text,
  avaliador_id uuid,
  avaliador_nome text,
  notas jsonb NOT NULL DEFAULT '{}'::jsonb,
  pontuacao_total numeric(6,2) NOT NULL DEFAULT 0,
  media_ponderada numeric(5,2) NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_aval_desemp_func ON public.avaliacoes_desempenho(funcionario_id);
CREATE INDEX idx_aval_desemp_data ON public.avaliacoes_desempenho(data_avaliacao DESC);

ALTER TABLE public.avaliacoes_desempenho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read avaliacoes_desempenho" ON public.avaliacoes_desempenho FOR SELECT USING (true);
CREATE POLICY "Public insert avaliacoes_desempenho" ON public.avaliacoes_desempenho FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update avaliacoes_desempenho" ON public.avaliacoes_desempenho FOR UPDATE USING (true);
CREATE POLICY "Public delete avaliacoes_desempenho" ON public.avaliacoes_desempenho FOR DELETE USING (true);

CREATE TRIGGER trg_aval_desemp_updated
BEFORE UPDATE ON public.avaliacoes_desempenho
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();