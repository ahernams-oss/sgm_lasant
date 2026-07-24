CREATE POLICY "Anon pode inserir recebimentos" ON public.epis_recebimentos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon pode atualizar recebimentos" ON public.epis_recebimentos FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.epis_recebimentos TO anon;