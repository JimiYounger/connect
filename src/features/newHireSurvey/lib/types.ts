// Types for Typeform JSON structure
export interface TypeformField {
  id: string;
  ref: string;
  type: string;
  title: string;
  properties?: Record<string, unknown>;
}

export interface TypeformDefinition {
  id: string;
  title: string;
  fields: TypeformField[];
  endings?: Array<{
    id: string;
    ref: string;
    title: string;
    type: string;
    properties?: Record<string, unknown>;
  }>;
  settings?: Record<string, unknown>;
}

export interface TypeformAnswer {
  type: 'text' | 'number' | 'boolean' | 'date' | 'email' | 'url' | 'file_url' | 'choice' | 'choices' | string;
  text?: string;
  number?: number;
  boolean?: boolean;
  date?: string;
  email?: string;
  url?: string;
  file_url?: string;
  choice?: { label: string; other?: string };
  choices?: { labels: string[] };
  field: {
    id: string;
    type: string;
    ref: string;
  };
}

export interface TypeformResponse {
  form_id: string;
  token: string;
  landed_at: string;
  submitted_at: string;
  hidden?: Record<string, string>;
  definition: TypeformDefinition;
  answers: TypeformAnswer[];
  ending?: {
    id: string;
    ref: string;
  };
}

export interface TypeformPayload {
  event_id: string;
  event_type: string;
  form_response: TypeformResponse;
}

// Parsed Q&A structure
export interface ParsedQA {
  key: string;
  value: string | number | boolean | null;
  raw?: unknown;
}

// API response types
export interface Person {
  id: string;
  name: string;
  area: string;
  qa: ParsedQA[];
  highlights: ParsedQA[];
}

export interface NewHireSurveyResponse {
  people: Person[];
  areas: string[];
}

// Airtable record type
export interface AirtableNewHireRecord {
  id: string;
  fields: {
    'Full Name'?: string;
    'Name'?: string;
    'Area'?: string;
    'New Hire Survey Answers'?: string;
    [key: string]: unknown;
  };
}

// Highlight keys to look for (case-insensitive partial matches)
export const HIGHLIGHT_KEYS = [
  'overall experience',
  'overall training', 
  'tools',
  'resources',
  'supported',
  'culture',
  'biggest challenge',
  'one word',
  'one phrase',
] as const;

export type HighlightKey = typeof HIGHLIGHT_KEYS[number];