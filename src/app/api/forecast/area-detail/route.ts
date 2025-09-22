import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type { AreaDetailView, PersonWithAvatar, PeopleTextAnswer } from '@/features/forecasting/types';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const area = searchParams.get('area');
    const region = searchParams.get('region');
    const weekOf = searchParams.get('week_of');

    if (!area || !region || !weekOf) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the response for this area/region/week
    const { data: response, error: responseError } = await supabase
      .from('forecast_responses')
      .select(`
        *,
        forecast_answers (*)
      `)
      .eq('area', area)
      .eq('region', region)
      .eq('week_of', weekOf)
      .single();

    if (responseError && responseError.code !== 'PGRST116') {
      throw responseError;
    }

    if (!response) {
      return NextResponse.json({
        area,
        region,
        week_of: weekOf,
        forecast_numbers: {
          sales_forecast: 0,
          lead_forecast: 0,
          stretch_goal: 0
        }
      } as AreaDetailView);
    }

    // Get all questions to map answers
    const { data: questions, error: questionsError } = await supabase
      .from('forecast_questions')
      .select('*')
      .order('section, order_index');

    if (questionsError) throw questionsError;


    // Get user info for the submitter
    let userProfile = null;
    if (response.user_id) {
      const { data } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email, user_key')
        .eq('id', response.user_id)
        .single();
      userProfile = data;
    }

    // Parse answers into structured format
    const answerMap = new Map(
      response.forecast_answers?.map((a: any) => [a.question_id, a]) || []
    );

    // Helper to get answer value
    const getAnswer = (questionText: string): any => {
      const question = questions?.find(q => q.question_text.includes(questionText));
      if (!question) return null;
      const answer = answerMap.get(question.id);
      return answer?.answer_text || answer?.answer_number || null;
    };


    // Helper to parse people selection with additional text
    const getPeopleWithText = async (questionText: string): Promise<PersonWithAvatar[] | PeopleTextAnswer> => {
      const answerText = getAnswer(questionText);
      if (!answerText) return [] as PersonWithAvatar[];

      // Handle format: ["id1","id2"]||text
      const peopleMatch = answerText.match(/^\[(.*?)\]/);
      if (peopleMatch) {
        try {
          const ids = JSON.parse(`[${peopleMatch[1]}]`);
          let people: PersonWithAvatar[] = [];

          // Fetch user names and keys from their IDs
          if (ids.length > 0) {
            const { data: users } = await supabase
              .from('user_profiles')
              .select('first_name, last_name, user_key')
              .in('id', ids);

            if (users) {
              people = users.map(u => ({
                name: `${u.first_name} ${u.last_name}`,
                user_key: u.user_key || null
              }));
            }
          }

          // Check for additional text
          const textMatch = answerText.match(/\|\|(.*)/);
          if (textMatch && textMatch[1].trim()) {
            return {
              people,
              text: textMatch[1].trim()
            };
          }

          return people;
        } catch {
          return [] as PersonWithAvatar[];
        }
      }
      return [] as PersonWithAvatar[];
    };

    // Organize all answers by section
    const sections = new Map<string, any[]>();

    for (const question of questions || []) {
      const answer = answerMap.get(question.id);
      if (!answer) continue;

      if (!sections.has(question.section)) {
        sections.set(question.section, []);
      }

      let answerValue = answer.answer_text || answer.answer_number;

      // Handle people multi-select questions
      if (question.question_type === 'people_multi_select' && answer.answer_text) {
        const peopleMatch = answer.answer_text.match(/^\[(.*?)\]/);
        if (peopleMatch) {
          try {
            const ids = JSON.parse(`[${peopleMatch[1]}]`);
            if (ids.length > 0) {
              const { data: users } = await supabase
                .from('user_profiles')
                .select('first_name, last_name, user_key')
                .in('id', ids);

              if (users) {
                answerValue = users.map(u => ({
                  name: `${u.first_name} ${u.last_name}`,
                  user_key: u.user_key || null
                }));
              }
            }
          } catch {
            answerValue = [];
          }
        }

        // Extract additional text if present
        const textMatch = answer.answer_text.match(/\|\|(.*)/);
        if (textMatch && textMatch[1].trim()) {
          answerValue = {
            people: Array.isArray(answerValue) ? answerValue : [],
            text: textMatch[1].trim()
          };
        }
      }

      sections.get(question.section)!.push({
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        order_index: question.order_index,
        answer: answerValue,
        options: question.options
      });
    }

    // Sort questions within each section by order_index
    for (const [_section, questionList] of sections) {
      questionList.sort((a, b) => a.order_index - b.order_index);
    }

    // Build the detail view
    const areaDetail: AreaDetailView = {
      area,
      region,
      week_of: weekOf,
      submitted_at: response.submitted_at || undefined,
      manager_info: userProfile ? {
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        email: userProfile.email,
        user_key: userProfile.user_key || ''
      } : undefined,
      sections: Object.fromEntries(sections),
      // Keep backward compatibility
      past_performance: {
        last_week_sales: getAnswer('total sales last week'),
        performance_factors: getAnswer('anything unique')
      },
      leadership_intuition: {
        team_state_of_mind: getAnswer('overall state of mind'),
        personal_challenges: await getPeopleWithText('personal challenges that could impact'),
        struggling_reps: await getPeopleWithText('struggling with confidence'),
        weather_impact: getAnswer('weather forecast look like')
      },
      team_status: {
        unavailable_people: await getPeopleWithText('unavailable this week'),
        coaching_needed: await getPeopleWithText('in a slump')
      },
      opportunities: {
        scheduled_leads: getAnswer('leads and two-touches are currently scheduled')
      },
      incentives: {
        current_incentives: getAnswer('incentives are currently active'),
        planned_incentives: getAnswer('new incentives you plan')
      },
      forecast_numbers: {
        sales_forecast: getAnswer('sales forecast for this week') || 0,
        lead_forecast: getAnswer('lead forecast for this week') || 0,
        stretch_goal: getAnswer('stretch goal for sales') || 0
      }
    };

    return NextResponse.json(areaDetail);

  } catch (error) {
    console.error('Error fetching area detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch area detail' },
      { status: 500 }
    );
  }
}