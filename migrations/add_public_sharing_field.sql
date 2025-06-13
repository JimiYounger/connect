-- Add public sharing field to video_files table
ALTER TABLE video_files 
ADD COLUMN public_sharing_enabled BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN video_files.public_sharing_enabled IS 'Whether this video can be shared publicly via shareable links';