
-- Restringe leitura pública da tabela de auditoria de login (PII de tentativas, IPs, e-mails).
DROP POLICY IF EXISTS "Leitura pública auditoria login" ON public.login_auditoria;
-- Mantemos políticas de INSERT existentes para que o registro continue funcionando.
-- service_role bypassa RLS automaticamente, então a edge function admin segue lendo normalmente.
