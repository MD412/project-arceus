import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const ScanSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long.' })
    .max(100, { message: 'Title must be less than 100 characters long.' }),
  file: z
    .any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
}); 