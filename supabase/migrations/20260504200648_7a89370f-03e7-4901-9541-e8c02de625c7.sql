CREATE POLICY "Inserção anon promocoes" ON public.promocoes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Atualização anon promocoes" ON public.promocoes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Atualização autenticados promocoes" ON public.promocoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deleção anon promocoes" ON public.promocoes FOR DELETE TO anon USING (true);