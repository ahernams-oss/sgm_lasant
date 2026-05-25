-- Restrict certificados-digitais bucket policies to service_role only
DROP POLICY IF EXISTS "Certificados - leitura pública do app" ON storage.objects;
DROP POLICY IF EXISTS "Certificados - upload pelo app" ON storage.objects;
DROP POLICY IF EXISTS "Certificados - update pelo app" ON storage.objects;
DROP POLICY IF EXISTS "Certificados - delete pelo app" ON storage.objects;

CREATE POLICY "Certificados - service_role select"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificados-digitais' AND auth.role() = 'service_role');

CREATE POLICY "Certificados - service_role insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificados-digitais' AND auth.role() = 'service_role');

CREATE POLICY "Certificados - service_role update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificados-digitais' AND auth.role() = 'service_role');

CREATE POLICY "Certificados - service_role delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificados-digitais' AND auth.role() = 'service_role');