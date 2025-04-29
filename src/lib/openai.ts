import OpenAI from 'openai';

// Initialize the OpenAI client with API key from environment variables
const apiKey = process.env.OPENAI_API_KEY;
const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey,
});

/**
 * Summarizes text content into a concise 2-3 sentence summary using OpenAI
 * @param text - The document text to summarize
 * @returns A promise that resolves to the summary string
 */
export async function summarizeText(text: string): Promise<string> {
  // Truncate text if it's too long (for token safety)
  const MAX_CHARS = 10000;
  const truncatedText = text.length > MAX_CHARS 
    ? `${text.substring(0, MAX_CHARS)}...` 
    : text;

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      temperature: 0.3,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content: 'You are a document summarization assistant. Create concise, informative summaries that capture the main points of documents. Summaries should be 2–3 sentences long, highlighting key information.'
        },
        {
          role: 'user',
          content: truncatedText
        }
      ]
    });

    // Extract and return the summary text
    const summary = response.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      throw new Error('Failed to generate summary: No content returned from OpenAI');
    }

    return summary;
  } catch (error) {
    console.error('Error generating document summary:', error);
    throw new Error(`Failed to summarize document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 