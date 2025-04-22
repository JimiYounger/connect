// Type definitions for Supabase Edge Functions
// This helps TypeScript understand imports during Next.js build

declare module "https://esm.sh/*" {
  // Just make TypeScript happy, actual imports are handled by Deno
  const content: any;
  export default content;
}

declare module "jsr:*" {
  // Just make TypeScript happy, actual imports are handled by Deno
  const content: any;
  export default content;
}

// Define the Deno global namespace for Next.js build
declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
  export function cwd(): string;
  
  // Add the serve method that's missing
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
} 