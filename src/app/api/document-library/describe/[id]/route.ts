import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { describeText } from '@/lib/openai';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;
  
  if (!documentId) {
    return NextResponse.json(
      { error: 'Document ID is required' },
      { status: 400 }
    );
  }

  console.log(`Starting description generation for document: ${documentId}`);
  // Initialize Supabase client and await it before using
  const supabase = await createClient();

  try {
    // Update status to processing
    await supabase
      .from('documents')
      .update({ description_status: 'processing' })
      .eq('id', documentId);
      
    // Fetch document content from document_content table
    console.log(`Fetching content for document: ${documentId}`);
    const { data: contentData, error: contentError } = await supabase
      .from('document_content')
      .select('content')
      .eq('document_id', documentId)
      .single();

    if (contentError || !contentData || !contentData.content) {
      console.error(`Content fetch error for document ${documentId}:`, contentError);
      // Set a placeholder message in description
      await supabase
        .from('documents')
        .update({ 
          description: 'Unable to generate description: Document content not available.',
          description_status: 'failed' 
        })
        .eq('id', documentId);
      
      return NextResponse.json(
        { error: 'Document content not found or empty' },
        { status: 404 }
      );
    }

    // Log content statistics for debugging
    const contentLength = contentData.content.length;
    console.log(`Document ${documentId} content retrieved: ${contentLength} characters`);
    
    if (contentLength === 0) {
      console.warn(`Empty content for document ${documentId}`);
      await supabase
        .from('documents')
        .update({ 
          description: 'Unable to generate description: Document appears to be empty.',
          description_status: 'failed' 
        })
        .eq('id', documentId);
        
      return NextResponse.json(
        { error: 'Document content is empty' },
        { status: 400 }
      );
    }

    // Generate description using OpenAI
    console.log(`Generating description for document: ${documentId}`);
    const description = await describeText(contentData.content);

    // Validate description
    if (!description || description.trim().length === 0) {
      console.error(`Empty description returned for document ${documentId}`);
      await supabase
        .from('documents')
        .update({ 
          description: 'Unable to generate description: AI generated an empty response.',
          description_status: 'failed' 
        })
        .eq('id', documentId);
        
      return NextResponse.json(
        { error: 'Generated description is empty' },
        { status: 500 }
      );
    }

    console.log(`Saving description for document ${documentId} (${description.length} characters)`);
    
    // Update document with description and status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        description,
        description_status: 'complete'
      })
      .eq('id', documentId);

    if (updateError) {
      console.error(`Failed to save description for document ${documentId}:`, updateError);
      return NextResponse.json(
        { error: 'Failed to update document with description' },
        { status: 500 }
      );
    }

    console.log(`Description generation completed successfully for document: ${documentId}`);
    return NextResponse.json({
      success: true,
      message: 'Document description generated and saved successfully',
      documentId,
    });

  } catch (error) {
    console.error(`Error in document description generation for ${documentId}:`, error);
    
    // Create a user-friendly error message
    const errorMessage = error instanceof Error 
      ? `Description generation failed: ${error.message}`
      : 'Description generation failed: Unknown error occurred';
    
    // Update document status to indicate failure
    await supabase
      .from('documents')
      .update({ 
        description: errorMessage,
        description_status: 'failed' 
      })
      .eq('id', documentId)
      .then(() => {
        console.log(`Updated document ${documentId} status to failed`);
      })
      .catch((err) => {
        console.error(`Failed to update document ${documentId} status:`, err);
      });

    return NextResponse.json(
      { 
        error: 'Failed to generate document description',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 