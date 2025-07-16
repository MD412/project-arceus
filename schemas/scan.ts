import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp',
  'image/heic',
  'image/heif'
];
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

export const ScanSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long.' })
    .max(100, { message: 'Title must be less than 100 characters long.' })
    .optional(),
  file: z
    .any()
    .refine((files) => files?.length > 0, 'At least one image is required.')
    .refine((files) => Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `Max file size is 5MB per file.`)
    .refine(
      (files) => Array.from(files).every((file: any) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ACCEPTED_IMAGE_TYPES.includes(file.type) || (ext && ACCEPTED_EXTENSIONS.includes(ext));
      }),
      'Only .jpg, .jpeg, .png, .webp, .heic and .heif files are accepted.'
    ),
}); 