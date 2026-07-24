
CREATE TABLE public.epis_recebimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  epis_ids TEXT[] NOT NULL DEFAULT '{}',
  epis_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente',
  cpf_verificado BOOLEAN NOT NULL DEFAULT false,
  verificado_em TIMESTAMPTZ,
  confirmado_em TIMESTAMPTZ,
  selfie_path TEXT,
  selfie_hash TEXT,
  ip TEXT,
  user_agent TEXT,
  enviado_por TEXT,
  telefone_envio TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.epis_recebimentos TO authenticated;
GRANT SELECT ON public.epis_recebimentos TO anon;
GRANT ALL ON public.epis_recebimentos TO service_role;

ALTER TABLE public.epis_recebimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth pode ler recebimentos" ON public.epis_recebimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth pode inserir recebimentos" ON public.epis_recebimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth pode atualizar recebimentos" ON public.epis_recebimentos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon pode ler token" ON public.epis_recebimentos FOR SELECT TO anon USING (true);

CREATE INDEX idx_epis_recebimentos_funcionario ON public.epis_recebimentos(funcionario_id);
CREATE INDEX idx_epis_recebimentos_status ON public.epis_recebimentos(status);
CREATE INDEX idx_epis_recebimentos_confirmado_em ON public.epis_recebimentos(confirmado_em);

CREATE TRIGGER trg_epis_recebimentos_updated
BEFORE UPDATE ON public.epis_recebimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
