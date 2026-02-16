-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4',
    'application/pdf',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to read (server membership checked at app level)
CREATE POLICY "Authenticated read access" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments' AND auth.role() = 'authenticated'
  );
