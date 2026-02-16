import { createClient } from '@/lib/supabase/client';

const BUCKET = 'chat-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function uploadFile(
  file: File,
  channelId: string
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'bin';
  const safeName = `${channelId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(safeName, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(safeName);

  return {
    url: urlData.publicUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}
