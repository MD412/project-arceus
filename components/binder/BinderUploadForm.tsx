'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { BinderSchema } from '@/schemas/binder';

type BinderFormValues = z.infer<typeof BinderSchema>;

// The new mutation function that calls our single API endpoint
async function createBinder(data: BinderFormValues) {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('file', data.file);

  const response = await fetch('/api/binders', {
    method: 'POST',
    body: formData,
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
  } = useForm<BinderFormValues>({
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

  // Wrapper function to match the expected signature for handleSubmit
  const onSubmit = (data: BinderFormValues) => {
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
        <input
          id="file"
          type="file"
          {...register('file', {
            // zod schema handles the validation, but this helps with typing
            setValueAs: (v) => v[0],
          })}
        />
        {errors.file && <p className="form-error">{errors.file.message}</p>}
      </div>

      <button type="submit" className="button-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Uploading...' : 'Upload Binder'}
      </button>

    </form>
  );
} 