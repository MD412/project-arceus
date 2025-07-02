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

// The mutation function accepts the transformed data
async function createScan(data: any) {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not logged in');

  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('file', data.file);
  formData.append('user_id', userId);

  const response = await fetch('/api/scans', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to process scan');
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
    mutationFn: createScan,
    onSuccess: (responseData) => {
      toast.success('Scan created successfully! Processing will begin shortly.');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      reset();
      close?.();
      
      // Redirect to review page
      if (responseData?.scan_id) {
        router.push(`/scans/${responseData.scan_id}/review`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to process scan: ${error.message}`);
    },
  });

  // After validation, handleSubmit provides the transformed output data
  const onSubmit = (data: any) => {
    // We need to get the file from the form data, not directly from the data object
    const fileInput = (document.getElementById('file') as HTMLInputElement).files?.[0];
    if (fileInput) {
      const submissionData = { ...data, file: fileInput };
      mutation.mutate(submissionData);
    } else {
      // This case should be handled by the Zod schema, but as a fallback
      toast.error('Please select a file to upload.');
    }
  };

  return (
    <div className="circuit-form-container">
      <h2 className="circuit-form-title">Upload New Scan</h2>
      <p className="circuit-form-description">Upload a photo of your cards to start processing.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="circuit-form">
        <Input
          id="title"
          label="Scan Title"
          type="text"
          {...register('title')}
          error={errors.title?.message as string}
          placeholder="e.g., 'My First Edition Holos'"
        />

        <Input
          id="file"
          label="Card Photo"
          type="file"
          {...register('file')}
          error={errors.file?.message as string}
        />

        <div className="circuit-form-actions">
           <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Uploading...' : 'Upload Scan'}
          </Button>
        </div>
      </form>
    </div>
  );
} 