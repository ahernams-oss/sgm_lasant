
-- Create storage bucket for cargo attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('cargo-anexos', 'cargo-anexos', true);

-- Allow anyone to upload to cargo-anexos bucket
CREATE POLICY "Allow public uploads to cargo-anexos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'cargo-anexos');

-- Allow anyone to read from cargo-anexos bucket
CREATE POLICY "Allow public reads from cargo-anexos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cargo-anexos');

-- Allow anyone to delete from cargo-anexos bucket
CREATE POLICY "Allow public deletes from cargo-anexos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'cargo-anexos');
