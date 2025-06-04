import { supabase } from './supabase';

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * Bucket: user-card-images
 * Path:  user-uploads/{uuid}.{ext}
 */
export async function uploadCardImage(file: File) {
  const ext      = file.name.split('.').pop();
  const filePath = `user-uploads/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase
    .storage
    .from('user-card-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase
    .storage
    .from('user-card-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
