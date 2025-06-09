import { z } from 'zod'

// Create a custom File schema that can be null
const FileSchema = z.custom<File | null>(
  (val) => val === null || val instanceof File,
  { message: 'Expected a File object or null' }
);

// Define the file validation schema
const validFileSchema = FileSchema
  .refine(
    (file): file is File => file !== null,
    { message: 'File is required' }
  )
  .refine(
    (file): file is File => file !== null && file.size > 0,
    { message: 'File cannot be empty' }
  )
  .refine(
    (file): file is File => {
      // Check if it's a valid audio file including AAC
      return file !== null && (
        file.type.startsWith('audio/') || 
        file.type === 'audio/aac'  // Explicitly allow AAC files
      );
    },
    { message: 'File must be an audio file (MP3, WAV, AAC, etc.)' }
  )
  .refine(
    (file): file is File => file !== null && file.size <= 25 * 1024 * 1024, 
    { 
      message: 'File size must be less than 25MB. For larger files, please split them into smaller segments using tools like Audacity before uploading.' 
    }
  );

/**
 * Zod schema for validating audio upload form data
 */
export const audioUploadSchema = z.object({
  // Title is required and must be at least 3 characters
  title: z
    .string()
    .min(3, { message: 'Title must be at least 3 characters long' })
    .trim(),
  
  // Description is optional
  description: z
    .string()
    .trim()
    .optional(),
  
  // Audio series ID is optional and can be null
  audio_series_id: z
    .string()
    .uuid()
    .optional()
    .nullable(),
  
  // File is required and must be an audio file
  file: validFileSchema,
});

/**
 * TypeScript type inferred from the Zod schema
 */
export type AudioUploadFormData = z.infer<typeof audioUploadSchema>;

/**
 * TypeScript type for form input with nullable file
 */
export type AudioUploadFormInput = Omit<AudioUploadFormData, 'file'> & {
  file: File | null;
};