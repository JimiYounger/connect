declare namespace NodeJS {
  interface ProcessEnv {
    // Existing environment variables (extend as needed)
    NODE_ENV: 'development' | 'production' | 'test'
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    
    // Mux Live Streaming
    MUX_TOKEN_ID: string
    MUX_TOKEN_SECRET: string
    MUX_STREAM_ID: string
    MUX_PLAYBACK_ID: string
  }
} 