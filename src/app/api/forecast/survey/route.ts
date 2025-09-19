import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

function getNextMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Get next Monday (add 7 days to current Monday calculation)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const selectedArea = searchParams.get('area');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active questions directly
    const { data: questions, error: questionsError } = await supabase
      .from('forecast_questions')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    // Get user profile first to get the profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, team, area, region')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get next week response if exists, filtering by area if specified
    const weekOf = getNextMonday();
    const areaToQuery = selectedArea || profile.area;

    let query = supabase
      .from('forecast_responses')
      .select(`
        *,
        forecast_answers (*)
      `)
      .eq('user_id', profile.id)
      .eq('week_of', weekOf);

    // Add area filter if we have an area to query for
    if (areaToQuery) {
      query = query.eq('area', areaToQuery);
    }

    const { data: response, error: responseError } = await query.single();

    // Don't throw error if no response found (PGRST116 = no rows returned)
    let currentResponse = null;
    if (responseError && responseError.code !== 'PGRST116') {
      console.error('Error fetching response:', responseError);
      throw responseError;
    } else if (!responseError) {
      currentResponse = response;
    }

    return NextResponse.json({
      questions: questions || [],
      currentResponse
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for team/area/region and profile ID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, team, area, region')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const submission = await request.json();

    // Determine if user is submitting for a different area
    const isDifferentArea = submission.selectedArea && submission.selectedArea !== profile.area;

    // Use selected area/region if provided, otherwise use profile
    const submissionArea = submission.selectedArea || profile.area;
    const submissionRegion = submission.selectedRegion || profile.region;
    const submissionTeam = isDifferentArea ? null : (profile.team || null);

    // Create or update response (now with area-specific conflicts)
    const { data: response, error: responseError } = await supabase
      .from('forecast_responses')
      .upsert({
        user_id: profile.id,
        week_of: submission.week_of,
        team: submissionTeam,
        area: submissionArea,
        region: submissionRegion,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_of,area'
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // Delete existing answers for this response (in case of re-submission)
    const { error: deleteError } = await supabase
      .from('forecast_answers')
      .delete()
      .eq('response_id', response.id);

    if (deleteError) throw deleteError;

    // Insert new answers
    const answersToInsert = submission.answers.map((answer: any) => ({
      response_id: response.id,
      question_id: answer.question_id,
      answer_text: answer.answer_text || null,
      answer_number: answer.answer_number || null
    }));

    const { error: answersError } = await supabase
      .from('forecast_answers')
      .insert(answersToInsert);

    if (answersError) throw answersError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting forecast:', error);
    return NextResponse.json(
      { error: 'Failed to submit forecast' },
      { status: 500 }
    );
  }
}