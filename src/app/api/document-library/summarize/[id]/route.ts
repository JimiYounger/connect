import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { summarizeText } from '@/lib/openai';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;
  
  if (!documentId) {
    return NextResponse.json(
      { error: 'Document ID is required' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    // Fetch document content from document_content table
    const { data: contentData, error: contentError } = await supabase
      .from('document_content')
      .select('content')
      .eq('document_id', documentId)
      .single();

    if (contentError || !contentData || !contentData.content) {
      // Update document status to indicate failure
      await supabase
        .from('documents')
        .update({ summary_status: 'failed' })
        .eq('id', documentId);
      
      return NextResponse.json(
        { error: 'Document content not found or empty' },
        { status: 404 }
      );
    }

    // Generate summary using OpenAI
    const summary = await summarizeText(contentData.content);

    // Update document with summary and status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        summary,
        summary_status: 'complete'
      })
      .eq('id', documentId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update document with summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document summary generated and saved successfully',
      documentId,
    });

  } catch (error) {
    console.error('Error in document summarization:', error);
    
    // Update document status to indicate failure
    await supabase
      .from('documents')
      .update({ summary_status: 'failed' })
      .eq('id', documentId)
      .then(() => {
        console.log('Updated document status to failed');
      })
      .catch((err) => {
        console.error('Failed to update document status:', err);
      });

    return NextResponse.json(
      { 
        error: 'Failed to generate document summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 