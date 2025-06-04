import { supabase } from './supabase';

/**
 * Uploads a File to Supabase Storage and returns its public URL.
 * Bucket: user-card-images
 * Path:  user-uploads/{uuid}.{ext}
 */
export async function uploadCardImage(file: File) {
  console.log('📁 File info:', { name: file.name, size: file.size, type: file.type });
  
  const ext      = file.name.split('.').pop();
  const filePath = `user-uploads/${crypto.randomUUID()}.${ext}`;
  console.log('📍 Upload path:', filePath);

  const { error } = await supabase
    .storage
    .from('user-card-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('❌ Storage upload error:', error);
    throw error;
  }
  console.log('✅ File uploaded to storage successfully');

  const { data } = supabase
    .storage
    .from('user-card-images')
    .getPublicUrl(filePath);

  console.log('🔗 Public URL generated:', data.publicUrl);
  return data.publicUrl;
}
