import Mux from '@mux/mux-node';

// Validate required environment variables
function validateMuxEnvironment(): void {
  const requiredVars = ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET', 'MUX_STREAM_ID', 'MUX_PLAYBACK_ID'] as const;
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(
        `Missing required environment variable: ${varName}. ` +
        'Please ensure all Mux environment variables are configured.'
      );
    }
  }
}

// Validate environment on module load
validateMuxEnvironment();

// Create singleton Mux client instance
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export { muxClient }; 