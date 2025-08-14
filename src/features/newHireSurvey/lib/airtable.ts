import type { AirtableNewHireRecord } from './types';

interface AirtableResponse {
  records: Array<{
    id: string;
    fields: Record<string, unknown>;
    createdTime: string;
  }>;
  offset?: string;
}

export async function fetchNewHireRecords(): Promise<AirtableNewHireRecord[]> {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;
  const viewId = process.env.AIRTABLE_VIEW_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !tableId || !viewId || !apiKey) {
    throw new Error('Missing required Airtable environment variables');
  }

  const url = `https://api.airtable.com/v0/${baseId}/${tableId}?view=${viewId}`;
  
  try {
    console.log('Fetching new hire records from Airtable view:', viewId);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data: AirtableResponse = await response.json();
    
    console.log(`Found ${data.records.length} records in Airtable view`);

    // Transform to our expected format
    return data.records.map(record => ({
      id: record.id,
      fields: {
        'Full Name': record.fields['Full Name'] as string,
        'Name': record.fields['Name'] as string,
        'Area': record.fields['Area'] as string,
        'New Hire Survey Answers': record.fields['New Hire Survey Answers'] as string,
        ...record.fields,
      }
    }));

  } catch (error) {
    console.error('Error fetching new hire records:', error);
    throw error;
  }
}

export function normalizePersonName(record: AirtableNewHireRecord): string {
  return record.fields['Full Name'] || 
         record.fields['Name'] || 
         'Unknown Person';
}

export function normalizeArea(record: AirtableNewHireRecord): string {
  return record.fields['Area'] || 'Unknown Area';
}

export function getSurveyAnswers(record: AirtableNewHireRecord): string | null {
  const answers = record.fields['New Hire Survey Answers'];
  return typeof answers === 'string' ? answers : null;
}