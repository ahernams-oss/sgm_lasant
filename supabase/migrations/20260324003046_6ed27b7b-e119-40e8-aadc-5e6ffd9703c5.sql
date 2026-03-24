CREATE POLICY "Inserção pública de convites"
ON public.cotacao_convites
FOR INSERT
TO anon
WITH CHECK (true);