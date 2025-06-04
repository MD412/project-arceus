import { supabase } from './supabase';

export async function uploadCardImage(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const filePath = `user-uploads/${crypto.randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('user-card-images')
    .upload(filePath, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('user-card-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
