-- User Assets Storage Bucket
-- Stores user avatars and banners with owner-scoped RLS policies.
-- Images are processed server-side (EXIF stripped, resized, converted to WebP)
-- before upload, so stored files contain no location or device metadata.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-assets',
  'user-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Users can only upload to their own folder: {user_id}/avatar.webp, {user_id}/banner.webp
CREATE POLICY "Users upload own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Public read — avatars/banners visible to everyone
CREATE POLICY "Public read user assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-assets');

-- Users can update their own assets (upsert)
CREATE POLICY "Users manage own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own assets
CREATE POLICY "Users delete own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
