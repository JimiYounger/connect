/**
 * Type declarations for pdf-parse
 */

declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: Record<string, any>;
    version: string;
  }

  function PDFParse(
    dataBuffer: Buffer | Uint8Array,
    options?: {
      pagerender?: (pageData: any) => string;
      max?: number;
      version?: string;
    }
  ): Promise<PDFParseResult>;

  export default PDFParse;
}