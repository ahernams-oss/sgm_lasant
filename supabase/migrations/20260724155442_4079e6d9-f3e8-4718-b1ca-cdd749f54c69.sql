
CREATE POLICY "Auth pode ler selfies epi"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'epi-recebimentos-selfies');

CREATE POLICY "Service pode gravar selfies epi"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'epi-recebimentos-selfies');
