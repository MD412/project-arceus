import { z } from 'zod';

export const BinderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  file: z.instanceof(File).refine((f: File) => f.size < 10e6, 'Max 10MB'),
}); 