-- Add storage policies for audio-library bucket
BEGIN;

-- Get the ID of the audio-library bucket
DO $$
DECLARE
  bucket_id uuid;
BEGIN
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = 'audio-library';

  -- Create policy to allow authenticated users to read audio files
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES (
    'Allow authenticated users to read from audio-library', 
    bucket_id,
    'auth.role() = ''authenticated'''
  );

  -- Create policy to allow authenticated users to upload audio files
  INSERT INTO storage.policies (name, bucket_id, definition)
  VALUES (
    'Allow authenticated users to upload to audio-library', 
    bucket_id,
    'auth.role() = ''authenticated'''
  );
END $$;

COMMIT;