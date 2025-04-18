// my-app/supabase/functions/generate-embeddings/index.ts

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Maximum number of chunks to process in a single batch
const BATCH_SIZE = 10;
// Maximum retries for API call failures
const MAX_RETRIES = 3;
// Delay between retries (in ms)
const RETRY_DELAY = 1000;

// DEBUGGING: Print environment info at load time - this should show in the logs immediately
console.log("🔍 Function loading - Debug Info:");
console.log("📂 Current working directory:", Deno.cwd());
console.log("🔑 Environment variables present:", {
  PROJECT_URL: !!Deno.env.get("PROJECT_URL"),
  SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
  SERVICE_ROLE_KEY: !!Deno.env.get("SERVICE_ROLE_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  SUPABASE_ANON_KEY: !!Deno.env.get("SUPABASE_ANON_KEY"),
  OPENAI_API_KEY: !!Deno.env.get("OPENAI_API_KEY"),
});

// Try to get environment variables with multiple possible keys
function getEnvVar(possibleKeys) {
  for (const key of possibleKeys) {
    const value = Deno.env.get(key);
    if (value) {
      console.log(`✅ Found environment variable for key: ${key}`);
      return value;
    }
  }
  console.error(`❌ Could not find any environment variable with keys: ${possibleKeys.join(", ")}`);
  return null;
}

Deno.serve(async (req) => {
  try {
    console.log("🔄 Request received", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries([...req.headers.entries()].map(([k, v]) => 
        [k, k.toLowerCase().includes("key") || k.toLowerCase().includes("auth") ? "***" : v]
      )),
    });

    // Try to parse request body
    let requestData;
    try {
      const text = await req.text();
      console.log("📄 Request body text:", text);
      
      try {
        requestData = JSON.parse(text);
        console.log("📦 Parsed JSON data:", requestData);
      } catch (jsonError) {
        console.error("❌ JSON parsing error:", jsonError);
        return new Response(JSON.stringify({ 
          error: "Invalid JSON", 
          message: jsonError.message,
          receivedText: text
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (bodyError) {
      console.error("❌ Error reading request body:", bodyError);
      return new Response(JSON.stringify({ 
        error: "Error reading request body", 
        message: bodyError.message 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const documentId = requestData?.documentId;
    console.log("📝 Document ID:", documentId);

    if (!documentId) {
      return new Response(JSON.stringify({ error: "Missing documentId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with correct environment variables
    const supabaseUrl = getEnvVar(["PROJECT_URL", "SUPABASE_URL"]);
    const supabaseKey = getEnvVar(["SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"]);
    
    console.log("🔗 Supabase URL found:", !!supabaseUrl);
    console.log("🔑 Supabase Key found:", !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return new Response(JSON.stringify({ 
        error: "Server configuration error: Missing Supabase credentials",
        envVars: {
          PROJECT_URL: !!Deno.env.get("PROJECT_URL"),
          SUPABASE_URL: !!Deno.env.get("SUPABASE_URL"),
          SERVICE_ROLE_KEY: !!Deno.env.get("SERVICE_ROLE_KEY"),
          SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        }
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🔌 Creating Supabase client...");
    const client = createClient(supabaseUrl, supabaseKey);
    console.log("✅ Supabase client created");

    console.log("🔍 Querying document chunks...");
    const { data: chunks, error } = await client
      .from("document_chunks")
      .select("id, content")
      .eq("document_id", documentId)
      .is("embedding", null);

    if (error) {
      console.error("❌ Error fetching chunks:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch chunks",
        details: error,
        supabaseUrl: supabaseUrl.substring(0, 8) + "..."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📊 Found ${chunks?.length || 0} chunks to process`);
    
    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No chunks found to embed",
        documentId
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process chunks in batches
    const results = {
      success: 0,
      failed: 0,
      total: chunks.length,
    };

    // Process in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      console.log(`🔄 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(chunks.length/BATCH_SIZE)}, size: ${batchChunks.length}`);
      
      try {
        const batchResults = await processChunkBatch(batchChunks, client);
        results.success += batchResults.success;
        results.failed += batchResults.failed;
        console.log(`✅ Batch processed: ${batchResults.success} succeeded, ${batchResults.failed} failed`);
      } catch (batchError) {
        console.error("❌ Error processing batch:", batchError);
        results.failed += batchChunks.length;
      }
      
      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < chunks.length) {
        console.log("⏱️ Pausing between batches");
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log("✅ Processing complete", results);
    
    // Update document status based on results
    if (results.success > 0) {
      // Mark as complete if at least some chunks were successfully processed
      await client
        .from('documents')
        .update({ embedding_status: 'complete' })
        .eq('id', documentId);
      console.log(`📝 Updated document ${documentId} status to 'complete'`);
    } else if (results.failed === results.total) {
      // Mark as failed if all chunks failed
      await client
        .from('documents')
        .update({ embedding_status: 'failed' })
        .eq('id', documentId);
      console.log(`⚠️ Updated document ${documentId} status to 'failed'`);
    }
    
    return new Response(JSON.stringify({ 
      message: "Embedding generation complete",
      results 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Unhandled error in edge function:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error", 
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Process a batch of chunks to generate embeddings
 */
async function processChunkBatch(chunks, client) {
  const results = {
    success: 0,
    failed: 0,
  };

  console.log(`⚙️ Generating embeddings for ${chunks.length} chunks`);
  
  // Generate embeddings for all chunks in this batch
  const embeddings = await generateEmbeddings(
    chunks.map(chunk => chunk.content)
  );

  if (!embeddings || embeddings.length !== chunks.length) {
    console.error("❌ Embedding generation failed or returned wrong count", {
      expected: chunks.length,
      received: embeddings?.length || 0
    });
    throw new Error("Failed to generate embeddings for batch");
  }

  // Update each chunk with its embedding
  for (let i = 0; i < chunks.length; i++) {
    try {
      console.log(`📝 Updating chunk ${i+1}/${chunks.length} (ID: ${chunks[i].id})`);
      
      const { error } = await client
        .from("document_chunks")
        .update({ embedding: embeddings[i] })
        .eq("id", chunks[i].id);

      if (error) {
        console.error(`❌ Error updating chunk ${chunks[i].id}:`, error);
        results.failed++;
      } else {
        console.log(`✅ Successfully updated chunk ${chunks[i].id}`);
        results.success++;
      }
    } catch (updateError) {
      console.error(`❌ Error updating chunk ${chunks[i].id}:`, updateError);
      results.failed++;
    }
  }

  return results;
}

/**
 * Generate embeddings for a batch of texts using OpenAI API
 */
async function generateEmbeddings(texts) {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiApiKey) {
    console.error("❌ OPENAI_API_KEY is not set");
    throw new Error("OPENAI_API_KEY is not set");
  }
  
  console.log(`🧠 Generating embeddings for ${texts.length} texts with OpenAI API`);

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      console.log(`🔄 OpenAI API request attempt ${retries + 1}/${MAX_RETRIES}`);
      
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: texts,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { raw: errorText };
        }
        console.error(`❌ OpenAI API returned error status: ${response.status}`, errorData);
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully received ${result.data?.length || 0} embeddings`);
      return result.data.map(item => item.embedding);
    } catch (error) {
      retries++;
      console.error(`❌ OpenAI API error (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries < MAX_RETRIES) {
        console.log(`⏱️ Waiting ${RETRY_DELAY}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        throw new Error(`Failed to generate embeddings after ${MAX_RETRIES} attempts: ${error.message}`);
      }
    }
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-embeddings' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"documentId":"your-document-id"}'

*/
