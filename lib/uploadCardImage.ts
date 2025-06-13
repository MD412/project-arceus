import { getSupabaseClient } from '@/lib/supabase/browser';

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * Bucket: binder-photo-uploads
 * Path:  user-uploads/{uuid}.{ext}
 */
export async function uploadCardImage(file: File) {
  const supabase = getSupabaseClient();
  console.log('📁 File info:', { name: file.name, size: file.size, type: file.type });
  
  const ext      = file.name.split('.').pop();
  const filePath = `user-uploads/${crypto.randomUUID()}.${ext}`;
  console.log('📍 Upload path:', filePath);

  const { error } = await supabase
    .storage
    .from('binder-photo-uploads')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('❌ Storage upload error:', error);
    throw error;
  }
  console.log('✅ File uploaded to storage successfully');

  const { data } = supabase
    .storage
    .from('binder-photo-uploads')
    .getPublicUrl(filePath);

  console.log('🔗 Public URL generated:', data.publicUrl);
  return data.publicUrl;
}
