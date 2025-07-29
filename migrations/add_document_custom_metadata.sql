-- Create document_custom_metadata table for custom metadata fields
CREATE TABLE IF NOT EXISTS document_custom_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    metadata_type TEXT NOT NULL,
    presented_by TEXT,
    meeting_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES user_profiles(id)
);

-- Add unique constraint to prevent duplicate metadata entries for same document and type
ALTER TABLE document_custom_metadata 
ADD CONSTRAINT unique_document_metadata_type 
UNIQUE (document_id, metadata_type);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_document_custom_metadata_document_id 
ON document_custom_metadata(document_id);

CREATE INDEX IF NOT EXISTS idx_document_custom_metadata_type 
ON document_custom_metadata(metadata_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE document_custom_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read metadata
CREATE POLICY "Allow authenticated users to read custom metadata" 
ON document_custom_metadata FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Allow admin users to insert/update/delete metadata
CREATE POLICY "Allow admin users to manage custom metadata" 
ON document_custom_metadata FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND LOWER(user_profiles.role_type) = 'admin'
    )
);

-- Add comments for documentation
COMMENT ON TABLE document_custom_metadata IS 'Stores custom metadata for documents like Leadership Training Decks';
COMMENT ON COLUMN document_custom_metadata.metadata_type IS 'Type of custom metadata (e.g., leadership_training_deck)';
COMMENT ON COLUMN document_custom_metadata.presented_by IS 'Name of person who presented the content';
COMMENT ON COLUMN document_custom_metadata.meeting_date IS 'Date when the content was presented or discussed';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_document_custom_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_custom_metadata_updated_at
    BEFORE UPDATE ON document_custom_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_document_custom_metadata_updated_at();