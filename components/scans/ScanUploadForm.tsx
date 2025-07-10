'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/browser';

import { ScanSchema } from '@/schemas/scan';
import { Input } from '../forms';
import { Button } from '../ui/Button';

type ScanFormValues = z.infer<typeof ScanSchema>;

async function createBulkScans(data: any) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not logged in');

  const formData = new FormData();
  // Use a generic title or derive one if not provided
  const title = data.title || `Bulk Upload - ${new Date().toLocaleDateString()}`;
  formData.append('title', title);
  formData.append('user_id', userId);
  
  // Append all files
  Array.from(data.files).forEach((file: any) => {
    formData.append('files', file);
  });

  const response = await fetch('/api/scans/bulk', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to process scans');
  }

  return response.json();
}

interface ScanUploadFormProps {
  close?: () => void;
}

export default function ScanUploadForm({ close }: ScanUploadFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ScanSchema),
  });

  const mutation = useMutation({
    mutationFn: createBulkScans,
    onSuccess: (responseData) => {
      toast.success(`${responseData.count} scans created successfully! Processing will begin shortly.`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      reset();
      close?.();
      
      // Optional: redirect to the main scans page after bulk upload
      router.push(`/scans`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process scans: ${error.message}`);
    },
  });

  // After validation, handleSubmit provides the transformed output data
  const onSubmit = (data: any) => {
    const fileInput = (document.getElementById('file') as HTMLInputElement).files;
    if (fileInput && fileInput.length > 0) {
      const submissionData = { ...data, files: fileInput };
      mutation.mutate(submissionData);
    } else {
      toast.error('Please select at least one file to upload.');
    }
  };

  return (
    <div className="circuit-form-container">
      <h2 className="circuit-form-title">Upload New Scans</h2>
      <p className="circuit-form-description">Upload one or more photos of your cards to start processing.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="circuit-form">
        <Input
          id="title"
          label="Batch Title (Optional)"
          type="text"
          {...register('title')}
          error={errors.title?.message as string}
          placeholder="e.g., 'Modern Horizons 3 Binder'"
        />

        <Input
          id="file"
          label="Card Photos"
          type="file"
          {...register('file')}
          error={errors.file?.message as string}
          multiple // Allow multiple file selection
        />

        <div className="circuit-form-actions">
           <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Uploading...' : 'Upload Scans'}
          </Button>
        </div>
      </form>
    </div>
  );
} 