import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Convert HEIC/HEIF files to JPEG format
 * @param file - The HEIC/HEIF file to convert
 * @returns Promise<File> - The converted JPEG file
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Check both MIME type and file extension (case-insensitive)
  const fileName = file.name.toLowerCase();
  const isHeic = file.type.includes('heic') || 
                 file.type.includes('heif') || 
                 fileName.endsWith('.heic') || 
                 fileName.endsWith('.heif');
  
  if (!isHeic) {
    return file;
  }

  try {
    // Dynamic import to avoid SSR issues
    const heic2any = (await import('heic2any')).default;
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85
    }) as Blob;

    // Create a new File object with the converted data
    const convertedFile = new File(
      [convertedBlob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return convertedFile;
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    // Return original file if conversion fails
    // The server-side will handle it
    return file;
  }
} 