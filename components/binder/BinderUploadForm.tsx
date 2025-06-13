'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSupabaseClient } from '@/lib/supabase/browser';

import { BinderSchema } from '@/schemas/binder';

type BinderFormValues = z.infer<typeof BinderSchema>;

// The mutation function accepts the transformed data
async function createBinder(data: any) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not logged in');

  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('file', data.file);
  formData.append('user_id', userId);

  const response = await fetch('/api/binders', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create binder');
  }

  return response.json();
}

export default function BinderUploadForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(BinderSchema),
  });

  const mutation = useMutation({
    mutationFn: createBinder,
    onSuccess: () => {
      toast.success('Binder created successfully! Processing will begin shortly.');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      reset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create binder: ${error.message}`);
    },
  });

  // After validation, handleSubmit provides the transformed output data
  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <h2>Upload New Binder</h2>

      <div className="form-group">
        <label htmlFor="title">Binder Title</label>
        <input id="title" type="text" {...register('title')} />
        {errors.title && <p className="form-error">{errors.title.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="file">Binder Photo</label>
        <input id="file" type="file" {...register('file')} />
        {errors.file && (
          <p className="form-error">{errors.file.message as string}</p>
        )}
      </div>

      <button type="submit" className="button-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Uploading...' : 'Upload Binder'}
      </button>

    </form>
  );
} 