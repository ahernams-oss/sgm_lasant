
-- Lock down auditoria: only service_role can read/write (edge functions audit-read / audit-write)
DROP POLICY IF EXISTS "Leitura auditoria" ON public.auditoria;
DROP POLICY IF EXISTS "Insercao auditoria" ON public.auditoria;
REVOKE ALL ON public.auditoria FROM anon, authenticated;
GRANT ALL ON public.auditoria TO service_role;

-- Lock down sealed bids: only service_role can read/write directly.
-- Reveal/visibility logic must be enforced via edge functions.
DROP POLICY IF EXISTS "pregao_prop_fech_all" ON public.pregao_propostas_fechadas;
REVOKE ALL ON public.pregao_propostas_fechadas FROM anon, authenticated;
GRANT ALL ON public.pregao_propostas_fechadas TO service_role;
