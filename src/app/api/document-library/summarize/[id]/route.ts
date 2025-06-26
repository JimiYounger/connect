// my-app/src/app/api/document-library/summarize/[id]/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { summarizeText } from '@/lib/openai';

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

  console.log(`Starting summarization for document: ${documentId}`);
  // Initialize Supabase client and await it before using
  const supabase = await createClient();

  try {
    // Update status to processing
    await supabase
      .from('documents')
      .update({ summary_status: 'processing' })
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
      // Set a placeholder message in summary
      await supabase
        .from('documents')
        .update({ 
          summary: 'Unable to generate summary: Document content not available.',
          summary_status: 'failed' 
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
          summary: 'Unable to generate summary: Document appears to be empty.',
          summary_status: 'failed' 
        })
        .eq('id', documentId);
        
      return NextResponse.json(
        { error: 'Document content is empty' },
        { status: 400 }
      );
    }

    // Generate summary using OpenAI
    console.log(`Generating summary for document: ${documentId}`);
    const summary = await summarizeText(contentData.content);

    // Validate summary
    if (!summary || summary.trim().length === 0) {
      console.error(`Empty summary returned for document ${documentId}`);
      await supabase
        .from('documents')
        .update({ 
          summary: 'Unable to generate summary: AI generated an empty response.',
          summary_status: 'failed' 
        })
        .eq('id', documentId);
        
      return NextResponse.json(
        { error: 'Generated summary is empty' },
        { status: 500 }
      );
    }

    console.log(`Saving summary for document ${documentId} (${summary.length} characters)`);
    
    // Update document with summary and status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        summary,
        summary_status: 'complete'
      })
      .eq('id', documentId);

    if (updateError) {
      console.error(`Failed to save summary for document ${documentId}:`, updateError);
      return NextResponse.json(
        { error: 'Failed to update document with summary' },
        { status: 500 }
      );
    }

    console.log(`Summarization completed successfully for document: ${documentId}`);
    return NextResponse.json({
      success: true,
      message: 'Document summary generated and saved successfully',
      documentId,
    });

  } catch (error) {
    console.error(`Error in document summarization for ${documentId}:`, error);
    
    // Create a user-friendly error message
    const errorMessage = error instanceof Error 
      ? `Summarization failed: ${error.message}`
      : 'Summarization failed: Unknown error occurred';
    
    // Update document status to indicate failure
    try {
      await supabase
        .from('documents')
        .update({ 
          summary: errorMessage,
          summary_status: 'failed' 
        })
        .eq('id', documentId);
      
      console.log(`Updated document ${documentId} status to failed`);
    } catch (updateError) {
      console.error(`Failed to update document ${documentId} status:`, updateError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate document summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 