import { NextResponse } from 'next/server';
import { fetchNewHireRecords, normalizePersonName, normalizeArea, getSurveyAnswers } from '@/features/newHireSurvey/lib/airtable';
import { parseTypeformJson, selectHighlights, safeJsonParse } from '@/features/newHireSurvey/lib/parseTypeform';
import type { Person, NewHireSurveyResponse } from '@/features/newHireSurvey/lib/types';

export async function GET() {
  try {
    console.log('API: Fetching new hire survey data');
    
    // Fetch records from Airtable
    const records = await fetchNewHireRecords();
    
    if (!records.length) {
      console.log('API: No records found in Airtable view');
      return NextResponse.json({ 
        people: [], 
        areas: [] 
      } as NewHireSurveyResponse);
    }

    console.log(`API: Processing ${records.length} records`);

    // Transform records to Person objects
    const people: Person[] = [];
    const areaSet = new Set<string>();

    for (const record of records) {
      const name = normalizePersonName(record);
      const area = normalizeArea(record);
      const surveyAnswersRaw = getSurveyAnswers(record);

      areaSet.add(area);

      // Parse survey answers
      let qa: Person['qa'] = [];
      let highlights: Person['highlights'] = [];

      if (surveyAnswersRaw) {
        const parsed = safeJsonParse(surveyAnswersRaw);
        if (parsed) {
          qa = parseTypeformJson(parsed);
          highlights = selectHighlights(qa);
          
          console.log(`API: Parsed ${qa.length} Q&A pairs for ${name}, selected ${highlights.length} highlights`);
        } else {
          console.warn(`API: Could not parse survey answers for ${name}`);
        }
      } else {
        console.log(`API: No survey answers found for ${name}`);
      }

      people.push({
        id: record.id,
        name,
        area,
        qa,
        highlights,
      });
    }

    // Sort areas alphabetically
    const areas = Array.from(areaSet).sort();
    
    // Sort people by area then by name
    people.sort((a, b) => {
      if (a.area !== b.area) {
        return a.area.localeCompare(b.area);
      }
      return a.name.localeCompare(b.name);
    });

    console.log(`API: Returning ${people.length} people across ${areas.length} areas`);

    return NextResponse.json({
      people,
      areas,
    } as NewHireSurveyResponse);

  } catch (error) {
    console.error('API: Error in new hire survey endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch new hire survey data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}