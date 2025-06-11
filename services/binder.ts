import { supabase } from '@/lib/supabase/browser';

export async function uploadBinder(file: File) {
  if (!file) {
    throw new Error('You must select a file to upload.');
  }

  const fileName = `public/${Date.now()}_${file.name}`;

  const { data, error } = await supabase
    .storage
    .from('binders')
    .upload(fileName, file);

  if (error) {
    throw new Error(error.message);
  }

  return data;
} 