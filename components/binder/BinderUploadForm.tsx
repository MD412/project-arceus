'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { BinderSchema } from '@/schemas/binder';
import { uploadBinder } from '@/services/binder';
import { createJob } from '@/services/jobs';

type BinderFormValues = z.infer<typeof BinderSchema>;

export default function BinderUploadForm() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    control,
  } = useForm<BinderFormValues>({
    resolver: zodResolver(BinderSchema),
  });

  const createJobMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success('Job created! Processing will begin shortly.');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      reset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create job: ${error.message}`);
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: uploadBinder,
    onSuccess: (uploadResult) => {
      toast.success('File uploaded! Creating job...');
      const title = getValues('title');
      createJobMutation.mutate({
        binder_title: title,
        input_image_path: uploadResult.path,
      });
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const onSubmit = (data: BinderFormValues) => {
    uploadFileMutation.mutate(data.file);
  };

  const isLoading = uploadFileMutation.isPending || createJobMutation.isPending;

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
        <Controller
          name="file"
          control={control}
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <input
              id="file"
              type="file"
              onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
              onBlur={onBlur}
              name={name}
              ref={ref}
            />
          )}
        />
        {errors.file && <p className="form-error">{errors.file.message}</p>}
      </div>

      <button type="submit" className="button-primary" disabled={isLoading}>
        {uploadFileMutation.isPending ? 'Uploading...' : 
         createJobMutation.isPending ? 'Creating Job...' : 'Upload Binder'}
      </button>

    </form>
  );
} 