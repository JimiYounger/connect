import type { 
  ParsedQA, 
  TypeformPayload, 
  TypeformResponse, 
  TypeformField, 
  TypeformAnswer
} from './types';

export function safeString(input: unknown, maxLength = 500): string {
  if (input === null || input === undefined) return '';
  if (typeof input === 'string') return input.slice(0, maxLength);
  if (typeof input === 'number' || typeof input === 'boolean') return String(input);
  try {
    return JSON.stringify(input).slice(0, maxLength);
  } catch {
    return '[Invalid data]';
  }
}

export function safeJsonParse<T = unknown>(input: string): T | null {
  if (!input || typeof input !== 'string') return null;
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function normalizeValue(answer: TypeformAnswer): string | number | boolean | null {
  switch (answer.type) {
    case 'number':
      return typeof answer.number === 'number' ? answer.number : null;
    
    case 'boolean':
      return typeof answer.boolean === 'boolean' ? answer.boolean : null;
    
    case 'text':
      return answer.text ? safeString(answer.text) : null;
    
    case 'email':
      return answer.email ? safeString(answer.email) : null;
    
    case 'url':
      return answer.url ? safeString(answer.url) : null;
    
    case 'choice':
      return answer.choice?.label ? safeString(answer.choice.label) : null;
    
    case 'choices':
      return answer.choices?.labels?.length 
        ? safeString(answer.choices.labels.join(', ')) 
        : null;
    
    default:
      // Handle unknown types defensively
      if (answer.text !== undefined) return safeString(answer.text);
      if (answer.number !== undefined) return answer.number;
      if (answer.boolean !== undefined) return answer.boolean;
      
      // Last resort: stringify the raw value
      const rawValue = (answer as any).value;
      if (rawValue !== undefined) {
        return safeString(rawValue);
      }
      
      return null;
  }
}

export function parseTypeformJson(raw: unknown): ParsedQA[] {
  if (!raw || typeof raw !== 'object') return [];
  
  let formResponse: TypeformResponse;
  
  // Handle both direct TypeformResponse and wrapped TypeformPayload
  if ('form_response' in raw) {
    const payload = raw as TypeformPayload;
    formResponse = payload.form_response;
  } else if ('definition' in raw && 'answers' in raw) {
    formResponse = raw as TypeformResponse;
  } else {
    return [];
  }
  
  const { definition, answers } = formResponse;
  
  if (!definition?.fields || !Array.isArray(definition.fields) || 
      !answers || !Array.isArray(answers)) {
    return [];
  }
  
  // Build question title map: ref/id -> title
  const questionMap = new Map<string, string>();
  
  definition.fields.forEach((field: TypeformField) => {
    const title = safeString(field.title, 200);
    if (field.ref) questionMap.set(field.ref, title);
    if (field.id) questionMap.set(field.id, title);
  });
  
  // Process answers
  const results: ParsedQA[] = [];
  
  answers.forEach((answer: TypeformAnswer) => {
    if (!answer.field) return;
    
    const fieldRef = answer.field.ref;
    const fieldId = answer.field.id;
    
    // Find question title
    let questionTitle = questionMap.get(fieldRef) || questionMap.get(fieldId);
    
    if (!questionTitle) {
      // Fallback: use field type or generic label
      questionTitle = answer.field.type ? `${answer.field.type} question` : 'Untitled question';
    }
    
    const value = normalizeValue(answer);
    
    results.push({
      key: questionTitle,
      value,
      raw: answer
    });
  });
  
  return results;
}

export function selectHighlights(all: ParsedQA[]): ParsedQA[] {
  const highlights: ParsedQA[] = [];
  const used = new Set<number>();
  
  // First pass: look for specific highlight keywords (case-insensitive partial match)
  const highlightPatterns = [
    /overall.*experience/i,
    /overall.*training/i,
    /tools.*resources/i,
    /resources.*tools/i,
    /supported/i,
    /culture.*fit/i,
    /fit.*culture/i,
    /biggest.*challenge/i,
    /one.*word/i,
    /one.*phrase/i,
  ];
  
  highlightPatterns.forEach(pattern => {
    const match = all.find((qa, index) => 
      !used.has(index) && 
      qa.key.match(pattern) &&
      qa.value !== null &&
      qa.value !== '' &&
      qa.value !== 'N/A'
    );
    
    if (match) {
      const index = all.indexOf(match);
      highlights.push(match);
      used.add(index);
    }
  });
  
  // Second pass: fill remaining slots with first meaningful Q&As
  const remaining = 6 - highlights.length;
  if (remaining > 0) {
    all.forEach((qa, index) => {
      if (highlights.length >= 6) return;
      if (used.has(index)) return;
      if (qa.value === null || qa.value === '' || qa.value === 'N/A') return;
      
      highlights.push(qa);
      used.add(index);
    });
  }
  
  return highlights.slice(0, 6);
}

// Utility for testing with the provided sample
export function createTestFixture(): string {
  return JSON.stringify({
    "event_id": "01K2MWBQSMPCKRW6Z0B8X0TZCA",
    "event_type": "form_response",
    "form_response": {
      "form_id": "uhcNgwYC",
      "token": "iyxerzykxdz6jngiypg2bk1demu0fh5z",
      "landed_at": "2025-08-14T18:06:16Z",
      "submitted_at": "2025-08-14T18:09:33Z",
      "hidden": {
        "email": "wrharrisenterprises@gmail.com",
        "first_name": "William",
        "last_name": "Harris",
        "phone_number": "5416066644",
        "user_id": "recAHaNeAoyFseTfe"
      },
      "definition": {
        "id": "uhcNgwYC",
        "title": "My new form",
        "fields": [
          {
            "id": "SyfVxelu7tFN",
            "ref": "930d738e-451a-46fa-a2fe-df4fea5ba644",
            "type": "opinion_scale",
            "title": "1 - 10 scale, how was your overall experience with the training process within your first week at PLP?",
            "properties": {}
          },
          {
            "id": "6OTir6QO6FbU",
            "ref": "b2d1d2c0-5d4a-4b3e-92e0-a7e59d2359b3",
            "type": "short_text",
            "title": "Which parts of training were most helpful?",
            "properties": {}
          },
          {
            "id": "jDvgMNs7EaKe",
            "ref": "77a0dbf4-450d-4b90-9228-46c5cf384103",
            "type": "short_text",
            "title": "Which parts of training were least helpful or could be improved?",
            "properties": {}
          },
          {
            "id": "EAWtOVaMwDDA",
            "ref": "fcac5fa2-678a-4236-a358-da6da8a953f4",
            "type": "opinion_scale",
            "title": "I know who to go to for questions and support.",
            "properties": {}
          },
          {
            "id": "UJNGHa6eA6z6",
            "ref": "d3956b8c-19c1-474f-8ee4-8d7b430a7fad",
            "type": "yes_no",
            "title": "My manager/leader checks in with me enough.",
            "properties": {}
          },
          {
            "id": "e8bjE2cSEL71",
            "ref": "6c6c455b-19ea-4324-8a18-b12b528dbf8a",
            "type": "yes_no",
            "title": "Have you felt supported by your teammates and leaders so far?",
            "properties": {}
          },
          {
            "id": "5AQrXP6iOA8l",
            "ref": "11603c6d-8cf4-4d60-a766-771556ff9147",
            "type": "opinion_scale",
            "title": "I have the tools and resources I need to do my job effectively.",
            "properties": {}
          },
          {
            "id": "DSRqALOtSVFN",
            "ref": "86cd2870-a9dc-48ad-a224-4d45484f0654",
            "type": "short_text",
            "title": "If not, what's missing?",
            "properties": {}
          },
          {
            "id": "iU7ekfSgpObv",
            "ref": "f3191a06-634d-49fe-94dc-473bde39c7f1",
            "type": "short_text",
            "title": "What's your proudest accomplishment so far?",
            "properties": {}
          },
          {
            "id": "7TQurX5deBqd",
            "ref": "63559df6-b0be-49d7-b2e4-bdefc52bda43",
            "type": "short_text",
            "title": "What's been your biggest challenge so far?",
            "properties": {}
          },
          {
            "id": "Sf4TI5WCfkhj",
            "ref": "75730e4f-54d8-4e35-ad33-80684365c83c",
            "type": "opinion_scale",
            "title": "I feel like I'm a good fit for this company's culture.",
            "properties": {}
          },
          {
            "id": "4yoorv0D8age",
            "ref": "e44ccd95-dc6a-44d0-b8ce-1a3db4af1b58",
            "type": "short_text",
            "title": "One word or phrase that best describes your experience here so far:",
            "properties": {}
          },
          {
            "id": "e572zWrbBlZY",
            "ref": "571d176e-e54c-4e3a-868d-688aca6f1393",
            "type": "short_text",
            "title": "If you could change one thing about your first 30 days, what would it be?",
            "properties": {}
          },
          {
            "id": "wqx4hDtzz3QP",
            "ref": "0e212c22-6e3c-4c7d-8b15-8b3e4e2980dd",
            "type": "short_text",
            "title": "What can you do better in the next 30 days to assure the success you're looking for?",
            "properties": {}
          }
        ]
      },
      "answers": [
        {
          "type": "number",
          "number": 1,
          "field": {
            "id": "SyfVxelu7tFN",
            "type": "opinion_scale",
            "ref": "930d738e-451a-46fa-a2fe-df4fea5ba644"
          }
        },
        {
          "type": "text",
          "text": "N/A",
          "field": {
            "id": "6OTir6QO6FbU",
            "type": "short_text",
            "ref": "b2d1d2c0-5d4a-4b3e-92e0-a7e59d2359b3"
          }
        },
        {
          "type": "text",
          "text": "N/A",
          "field": {
            "id": "jDvgMNs7EaKe",
            "type": "short_text",
            "ref": "77a0dbf4-450d-4b90-9228-46c5cf384103"
          }
        },
        {
          "type": "number",
          "number": 1,
          "field": {
            "id": "EAWtOVaMwDDA",
            "type": "opinion_scale",
            "ref": "fcac5fa2-678a-4236-a358-da6da8a953f4"
          }
        },
        {
          "type": "boolean",
          "boolean": false,
          "field": {
            "id": "UJNGHa6eA6z6",
            "type": "yes_no",
            "ref": "d3956b8c-19c1-474f-8ee4-8d7b430a7fad"
          }
        },
        {
          "type": "boolean",
          "boolean": false,
          "field": {
            "id": "e8bjE2cSEL71",
            "type": "yes_no",
            "ref": "6c6c455b-19ea-4324-8a18-b12b528dbf8a"
          }
        },
        {
          "type": "number",
          "number": 0,
          "field": {
            "id": "5AQrXP6iOA8l",
            "type": "opinion_scale",
            "ref": "11603c6d-8cf4-4d60-a766-771556ff9147"
          }
        },
        {
          "type": "text",
          "text": "I can not log in and keep getting error messages when I try to reset my password",
          "field": {
            "id": "DSRqALOtSVFN",
            "type": "short_text",
            "ref": "86cd2870-a9dc-48ad-a224-4d45484f0654"
          }
        },
        {
          "type": "text",
          "text": "N/A",
          "field": {
            "id": "iU7ekfSgpObv",
            "type": "short_text",
            "ref": "f3191a06-634d-49fe-94dc-473bde39c7f1"
          }
        },
        {
          "type": "text",
          "text": "Completing the on boarding process, being able to login and get naterials/training",
          "field": {
            "id": "7TQurX5deBqd",
            "type": "short_text",
            "ref": "63559df6-b0be-49d7-b2e4-bdefc52bda43"
          }
        },
        {
          "type": "number",
          "number": 9,
          "field": {
            "id": "Sf4TI5WCfkhj",
            "type": "opinion_scale",
            "ref": "75730e4f-54d8-4e35-ad33-80684365c83c"
          }
        },
        {
          "type": "text",
          "text": "Frustrating",
          "field": {
            "id": "4yoorv0D8age",
            "type": "short_text",
            "ref": "e44ccd95-dc6a-44d0-b8ce-1a3db4af1b58"
          }
        },
        {
          "type": "text",
          "text": "Having the ability to complete the onboarding process so I can start working",
          "field": {
            "id": "e572zWrbBlZY",
            "type": "short_text",
            "ref": "571d176e-e54c-4e3a-868d-688aca6f1393"
          }
        },
        {
          "type": "text",
          "text": "Get help completing the onboarding so I can begin work",
          "field": {
            "id": "wqx4hDtzz3QP",
            "type": "short_text",
            "ref": "0e212c22-6e3c-4c7d-8b15-8b3e4e2980dd"
          }
        }
      ]
    }
  });
}