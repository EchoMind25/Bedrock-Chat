-- Create server-assets bucket for server icons and banners
-- Public bucket: 5MB limit, images only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'server-assets',
  'server-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Public read: anyone can view server icons and banners
CREATE POLICY "Public read access for server images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'server-assets');

-- Upload: only server owners may upload to their own server's path
-- Path format: {server_id}/{logo|banner}.{ext}
CREATE POLICY "Server owners can upload server images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'server-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM servers
      WHERE id::text = (string_to_array(name, '/'))[1]
        AND owner_id = auth.uid()
    )
  );

-- Update (overwrite on re-upload)
CREATE POLICY "Server owners can update server images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'server-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM servers
      WHERE id::text = (string_to_array(name, '/'))[1]
        AND owner_id = auth.uid()
    )
  );

-- Delete
CREATE POLICY "Server owners can delete server images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'server-assets'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM servers
      WHERE id::text = (string_to_array(name, '/'))[1]
        AND owner_id = auth.uid()
    )
  );
