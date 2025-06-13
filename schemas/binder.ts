import { z } from 'zod';

export const BinderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  file: z
    .any()
    .refine((val) => val && val.length > 0, 'Please select a file')
    .transform((val) => val[0])
    .refine((f) => f instanceof File, 'Input must be a file')
    .refine((f) => f.size < 25 * 1024 * 1024, 'Max file size is 25MB'),
}); 