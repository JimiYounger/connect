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

  // Empty content check
  if (!truncatedText.trim()) {
    throw new Error('Cannot summarize empty content');
  }

  // Retry configuration
  const MAX_RETRIES = 3;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        temperature: 0.2,
        max_tokens: 250,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        messages: [
          {
            role: 'system',
            content: `You are a document-summarization assistant.
  Given the full text of an SOP, spec sheet, training doc, or similar, produce a concise, uniform summary that will display nicely in a library UI.
  Always follow this structure:
  • Title: (one‐line document title)
  • Purpose: (one sentence explaining why this doc exists)
  • Key Takeaways: (3–5 bullet points of the most important facts)
  • Action Items / Next Steps: (if applicable, 1–3 bullets)
  • Estimated Read Time: (e.g. "2 min")
  Keep each section brief. Use complete sentences in bullets.`
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
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a rate limit error
      const isRateLimitError = error instanceof Error && 
        (error.message.includes('rate_limit') || error.message.includes('429'));
        
      if (isRateLimitError || error instanceof Error && error.message.includes('timeout')) {
        // For rate limiting or timeouts, retry with exponential backoff
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.log(`OpenAI API error (attempt ${retries + 1}/${MAX_RETRIES}), retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }

  // If we get here, all retries failed
  console.error('Error generating document summary after retries:', lastError);
  throw new Error(`Failed to summarize document: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Creates a short, catchy description of document content using OpenAI
 * @param text - The document text to describe
 * @returns A promise that resolves to the description string
 */
export async function describeText(text: string): Promise<string> {
  // Truncate text if it's too long (for token safety)
  const MAX_CHARS = 10000;
  const truncatedText = text.length > MAX_CHARS 
    ? `${text.substring(0, MAX_CHARS)}...` 
    : text;

  // Empty content check
  if (!truncatedText.trim()) {
    throw new Error('Cannot describe empty content');
  }

  // Retry configuration
  const MAX_RETRIES = 3;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        temperature: 0.2,
        max_tokens: 250,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        messages: [
          {
            role: 'system',
            content: `You are a document description specialist.
Create a short, engaging description (1-2 sentences) that gives users a quick sense of what the document contains.
Focus on making the description appealing and user-friendly, like a brief marketing blurb that captures the essence of the document.
The description should make someone want to read the document if it's relevant to their needs.
Be concise but informative.`
          },
          {
            role: 'user',
            content: truncatedText
          }
        ]
      });

      // Extract and return the description text
      const description = response.choices[0]?.message?.content?.trim();
      
      if (!description) {
        throw new Error('Failed to generate description: No content returned from OpenAI');
      }

      return description;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a rate limit error
      const isRateLimitError = error instanceof Error && 
        (error.message.includes('rate_limit') || error.message.includes('429'));
        
      if (isRateLimitError || error instanceof Error && error.message.includes('timeout')) {
        // For rate limiting or timeouts, retry with exponential backoff
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.log(`OpenAI API error (attempt ${retries + 1}/${MAX_RETRIES}), retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      } else {
        // For other errors, don't retry
        break;
      }
    }
  }

  // If we get here, all retries failed
  console.error('Error generating document description after retries:', lastError);
  throw new Error(`Failed to describe document: ${lastError?.message || 'Unknown error'}`);
} 