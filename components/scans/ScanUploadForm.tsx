'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/browser';
import { convertHeicToJpeg } from '@/lib/utils';

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

  // The form state under "file" is a FileList
  const files = Array.from(data.file) as File[];
  let convertedCount = 0;
  
  for (const file of files) {
    let processedFile = file;
    
    // Check if it's a HEIC file
    if (file.type.includes('heic') || file.type.includes('heif') || 
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
      try {
        processedFile = await convertHeicToJpeg(file);
        if (processedFile !== file) {
          convertedCount++;
        }
      } catch (error) {
        console.warn(`Failed to convert HEIC file ${file.name}, will try server-side conversion`, error);
      }
    }
    
    formData.append('files', processedFile);
  }
  
  if (convertedCount > 0) {
    toast.success(`Converted ${convertedCount} HEIC file(s) to JPEG`);
  }

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
      router.push(`/scans/review`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to process scans: ${error.message}`);
    },
  });

  // After validation, handleSubmit provides the transformed output data
  const onSubmit = (data: ScanFormValues) => {
    // data.file is a FileList, no need to get it from the DOM
    if (data.file && data.file.length > 0) {
      // Debug logging
      console.group('File Upload Debug');
      Array.from(data.file as FileList).forEach((file: File, index: number) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        console.log(`File ${index + 1}:`);
        console.log(`- Name: ${file.name}`);
        console.log(`- Type: ${file.type || 'empty'}`);
        console.log(`- Extension: ${ext}`);
        console.log(`- Size: ${(file.size / 1024).toFixed(2)} KB`);
      });
      console.groupEnd();
      
      // The data object from react-hook-form already contains the FileList
      mutation.mutate(data);
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
          id="file"
          label="Card Photos"
          type="file"
          {...register('file')}
          error={errors.file?.message as string}
          multiple // Allow multiple file selection
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif,.HEIC,.HEIF"
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