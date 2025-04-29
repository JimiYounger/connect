-- Add description fields to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS description_status TEXT DEFAULT 'pending';

-- Update comment on the description field
COMMENT ON COLUMN documents.description IS 'AI-generated catchy description of the document content';

-- Update comment on the description_status field
COMMENT ON COLUMN documents.description_status IS 'Status of description generation: pending, processing, complete, or failed';

-- Update any existing documents to have a status
UPDATE documents
SET description_status = 'pending'
WHERE description_status IS NULL; 