import { createClient } from '@/lib/supabase';
import type {
  ForecastQuestion,
  ForecastSubmission,
  ForecastResponseWithAnswers,
  ForecastSummary
} from '../types';

// Note: This service can be used both client-side and server-side
// When used server-side (API routes), pass a server supabase client
// When used client-side, it will use the default client

// Get Monday of current week
function getMonday(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export const forecastService = {
  // Questions
  async getActiveQuestions(supabaseClient?: any): Promise<ForecastQuestion[]> {
    const client = supabaseClient || createClient();
    const { data, error } = await client
      .from('forecast_questions')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getAllQuestions(): Promise<ForecastQuestion[]> {
    const client = createClient();
    const { data, error } = await client
      .from('forecast_questions')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async updateQuestion(id: string, updates: Partial<ForecastQuestion>): Promise<void> {
    const client = createClient();
    // Convert null values to undefined for database compatibility
    const dbUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key] = value === null ? undefined : value;
      return acc;
    }, {} as any);

    const { error } = await client
      .from('forecast_questions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  },

  // Responses
  async getCurrentWeekResponse(userId: string): Promise<ForecastResponseWithAnswers | null> {
    const weekOf = getMonday();

    const client = createClient();
    const { data: response, error: responseError } = await client
      .from('forecast_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('week_of', weekOf)
      .single();

    if (responseError && responseError.code !== 'PGRST116') throw responseError;
    if (!response) return null;

    const { data: answers, error: answersError } = await client
      .from('forecast_answers')
      .select('*')
      .eq('response_id', response.id);

    if (answersError) throw answersError;

    return {
      ...response,
      answers: answers || []
    };
  },

  async submitForecast(
    userId: string,
    userProfile: { team?: string; area?: string; region?: string },
    submission: ForecastSubmission
  ): Promise<void> {
    // Start transaction by creating or updating response
    const client = createClient();
    const { data: response, error: responseError } = await client
      .from('forecast_responses')
      .upsert({
        user_id: userId,
        week_of: submission.week_of,
        team: userProfile.team || null,
        area: userProfile.area || null,
        region: userProfile.region || null,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,week_of'
      })
      .select()
      .single();

    if (responseError) throw responseError;

    // Delete existing answers for this response (in case of re-submission)
    const { error: deleteError } = await client
      .from('forecast_answers')
      .delete()
      .eq('response_id', response.id);

    if (deleteError) throw deleteError;

    // Insert new answers
    const answersToInsert = submission.answers.map(answer => ({
      response_id: response.id,
      question_id: answer.question_id,
      answer_text: answer.answer_text || null,
      answer_number: answer.answer_number || null
    }));

    const { error: answersError } = await client
      .from('forecast_answers')
      .insert(answersToInsert);

    if (answersError) throw answersError;
  },

  // Dashboard
  async getWeeklyForecast(weekOf?: string, supabaseClient?: any): Promise<ForecastSummary> {
    const client = supabaseClient || createClient();
    const targetWeek = weekOf || getMonday();

    // Get all unique areas from user_profiles for completion tracking
    // Filter to only include Outside Sales and Field Marketing departments
    const { data: allAreas, error: areasError } = await client
      .from('user_profiles')
      .select('area, region, department')
      .not('area', 'is', null)
      .not('area', 'eq', '')
      .not('region', 'is', null)
      .not('region', 'eq', 'Corporate')
      .not('region', 'eq', 'Inside Sales')
      .in('department', ['Outside Sales', 'Field Marketing']);

    if (areasError) throw areasError;

    // Get unique area-region combinations
    const uniqueAreas = Array.from(
      new Set(allAreas?.map((a: { area: string; region: string }) => `${a.area}|${a.region}`))
    ).map((combo) => {
      const [area, region] = (combo as string).split('|');
      return { area, region };
    }).filter(area => area.region && area.region !== 'Corporate' && area.region !== 'Inside Sales');

    // Get all responses for the week (excluding Corporate, Inside Sales and null regions)
    // Also join with user_profiles to filter by department and get submitter info
    const { data: responses, error: responsesError } = await client
      .from('forecast_responses')
      .select(`
        *,
        forecast_answers (*),
        user_profiles!user_id (department, first_name, last_name, profile_pic_url, user_key)
      `)
      .eq('week_of', targetWeek)
      .not('region', 'is', null)
      .not('region', 'eq', 'Corporate')
      .not('region', 'eq', 'Inside Sales')
      .in('user_profiles.department', ['Outside Sales', 'Field Marketing']);

    if (responsesError) throw responsesError;

    // Get previous week's responses for forecast accuracy comparison
    const previousWeekDate = new Date(targetWeek + 'T12:00:00');
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    const previousWeek = getMonday(previousWeekDate);

    const { data: previousWeekResponses } = await client
      .from('forecast_responses')
      .select(`
        *,
        forecast_answers (*),
        user_profiles!user_id (department)
      `)
      .eq('week_of', previousWeek)
      .not('region', 'is', null)
      .not('region', 'eq', 'Corporate')
      .not('region', 'eq', 'Inside Sales')
      .in('user_profiles.department', ['Outside Sales', 'Field Marketing']);

    // Get all questions to map answers
    const { data: questions, error: questionsError } = await client
      .from('forecast_questions')
      .select('id, question_text');

    if (questionsError) throw questionsError;

    // Create maps for easy lookup using pattern matching
    const salesForecastId = questions?.find((q: { question_text: string; id: string }) => q.question_text.includes('sales forecast for this week'))?.id;
    const leadForecastId = questions?.find((q: { question_text: string; id: string }) => q.question_text.includes('lead forecast for this week'))?.id;
    const stretchGoalId = questions?.find((q: { question_text: string; id: string }) => q.question_text.includes('stretch goal for sales'))?.id;
    const lastWeekSalesId = questions?.find((q: { question_text: string; id: string }) => q.question_text.includes('total sales last week'))?.id;
    const scheduledLeadsId = questions?.find((q: { question_text: string; id: string }) => q.question_text.includes('leads and two-touches are currently scheduled'))?.id;

    // Create map of previous week's forecasts for comparison
    const previousWeekForecastMap = new Map<string, number>();
    previousWeekResponses?.forEach((response: any) => {
      const answers = response.forecast_answers || [];
      const salesForecast = answers.find((a: any) => a.question_id === salesForecastId)?.answer_number || 0;
      const areaKey = `${response.area}-${response.region}`;
      previousWeekForecastMap.set(areaKey, Number(salesForecast));
    });

    // Create a set of submitted areas
    const submittedAreas = new Set(
      responses?.map((r: any) => `${r.area}|${r.region}`) || []
    );

    // Calculate completion stats
    const totalAreasCount = uniqueAreas.length;
    const completedAreasCount = submittedAreas.size;
    const completionRate = totalAreasCount > 0 ? (completedAreasCount / totalAreasCount) * 100 : 0;

    // Identify pending areas
    const pendingAreas = uniqueAreas
      .filter(area => !submittedAreas.has(`${area.area}|${area.region}`))
      .map(area => ({
        area: area.area,
        region: area.region,
        days_overdue: 0 // TODO: Calculate based on expected submission date
      }));

    // Calculate regional completion stats (excluding Corporate, Inside Sales and null regions)
    const regionCompletionMap = new Map<string, { total: number; completed: number }>();
    uniqueAreas.forEach(area => {
      if (area.region && area.region !== 'Corporate' && area.region !== 'Inside Sales') {
        if (!regionCompletionMap.has(area.region)) {
          regionCompletionMap.set(area.region, { total: 0, completed: 0 });
        }
        const regionStats = regionCompletionMap.get(area.region)!;
        regionStats.total++;
        if (submittedAreas.has(`${area.area}|${area.region}`)) {
          regionStats.completed++;
        }
      }
    });

    const regionCompletionStats = Array.from(regionCompletionMap.entries()).map(([region, stats]) => ({
      region,
      total_areas: stats.total,
      completed_areas: stats.completed,
      completion_rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }));

    // Aggregate data
    let totalSales = 0;
    let totalLeads = 0;
    let totalStretch = 0;

    const regionMap = new Map<string, any>();
    const areaMap = new Map<string, any>();
    const teamMap = new Map<string, any>();

    responses?.forEach((response: any) => {
      const answers = response.forecast_answers || [];

      const salesForecast = answers.find((a: any) => a.question_id === salesForecastId)?.answer_number || 0;
      const leadForecast = answers.find((a: any) => a.question_id === leadForecastId)?.answer_number || 0;
      const stretchGoal = answers.find((a: any) => a.question_id === stretchGoalId)?.answer_number || 0;
      const lastWeekSales = answers.find((a: any) => a.question_id === lastWeekSalesId)?.answer_number || 0;
      const scheduledLeads = answers.find((a: any) => a.question_id === scheduledLeadsId)?.answer_number || 0;

      totalSales += Number(salesForecast);
      totalLeads += Number(leadForecast);
      totalStretch += Number(stretchGoal);

      // Aggregate by region
      if (response.region) {
        if (!regionMap.has(response.region)) {
          regionMap.set(response.region, {
            region: response.region,
            response_count: 0,
            sales_forecast: 0,
            lead_forecast: 0,
            stretch_goal: 0
          });
        }
        const regionData = regionMap.get(response.region);
        regionData.response_count++;
        regionData.sales_forecast += Number(salesForecast);
        regionData.lead_forecast += Number(leadForecast);
        regionData.stretch_goal += Number(stretchGoal);
      }

      // Aggregate by area
      if (response.area) {
        const areaKey = `${response.area}-${response.region}`;
        if (!areaMap.has(areaKey)) {
          // Get previous week's forecast for this area
          const lastWeekForecast = previousWeekForecastMap.get(areaKey) || 0;

          // Get submitter info from the joined user_profiles data
          const userProfile = response.user_profiles;
          const submitterName = userProfile ?
            `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : '';

          areaMap.set(areaKey, {
            area: response.area,
            region: response.region,
            response_count: 0,
            sales_forecast: 0,
            lead_forecast: 0,
            stretch_goal: 0,
            last_week_sales: 0,
            last_week_sales_forecast: lastWeekForecast,
            scheduled_leads: 0,
            has_submitted: true,
            submitted_at: response.submitted_at,
            submitted_by: response.user_id,
            submitter_name: submitterName,
            submitter_profile_pic: userProfile?.profile_pic_url || null,
            submitter_user_key: userProfile?.user_key || null,
            forecast_accuracy: null // Will be calculated after aggregation
          });
        }
        const areaData = areaMap.get(areaKey);
        areaData.response_count++;
        areaData.sales_forecast += Number(salesForecast);
        areaData.lead_forecast += Number(leadForecast);
        areaData.stretch_goal += Number(stretchGoal);
        areaData.last_week_sales += Number(lastWeekSales);
        areaData.scheduled_leads += Number(scheduledLeads);

        // Calculate forecast accuracy after we have the actual data
        if (areaData.last_week_sales_forecast && areaData.last_week_sales_forecast > 0 && areaData.last_week_sales > 0) {
          const tolerance = 0.05; // 5% tolerance for "hit"
          const ratio = areaData.last_week_sales / areaData.last_week_sales_forecast;
          if (ratio >= (1 + tolerance)) {
            areaData.forecast_accuracy = 'above';
          } else if (ratio <= (1 - tolerance)) {
            areaData.forecast_accuracy = 'below';
          } else {
            areaData.forecast_accuracy = 'hit';
          }
        }
      }

      // Aggregate by team (only if team is specified)
      if (response.team) {
        const teamKey = `${response.team}-${response.area}-${response.region}`;
        if (!teamMap.has(teamKey)) {
          teamMap.set(teamKey, {
            team: response.team,
            area: response.area || '',
            region: response.region || '',
            manager_name: '', // TODO: Get from user profile
            sales_forecast: 0,
            lead_forecast: 0,
            stretch_goal: 0
          });
        }
        const teamData = teamMap.get(teamKey);
        teamData.sales_forecast += Number(salesForecast);
        teamData.lead_forecast += Number(leadForecast);
        teamData.stretch_goal += Number(stretchGoal);
      }
    });

    // Add pending areas to the area map with has_submitted = false
    uniqueAreas.forEach(area => {
      const areaKey = `${area.area}-${area.region}`;
      if (!areaMap.has(areaKey)) {
        // Get previous week's forecast for this area (even if they haven't submitted this week)
        const lastWeekForecast = previousWeekForecastMap.get(areaKey) || 0;

        areaMap.set(areaKey, {
          area: area.area,
          region: area.region,
          response_count: 0,
          sales_forecast: 0,
          lead_forecast: 0,
          stretch_goal: 0,
          last_week_sales: 0,
          last_week_sales_forecast: lastWeekForecast,
          scheduled_leads: 0,
          has_submitted: false,
          submitted_at: null,
          forecast_accuracy: null // Cannot calculate accuracy without this week's actual data
        });
      }
    });

    return {
      week_of: targetWeek,
      total_responses: responses?.length || 0,
      sales_forecast: totalSales,
      lead_forecast: totalLeads,
      stretch_goal: totalStretch,
      by_region: Array.from(regionMap.values()),
      by_area: Array.from(areaMap.values()),
      by_team: Array.from(teamMap.values()),
      completion_stats: {
        total_areas: totalAreasCount,
        completed_areas: completedAreasCount,
        completion_rate: completionRate,
        by_region: regionCompletionStats
      },
      pending_areas: pendingAreas
    };
  },

  async getResponsesByRegion(region: string, weekOf?: string): Promise<ForecastResponseWithAnswers[]> {
    const targetWeek = weekOf || getMonday();
    const client = createClient();

    const { data, error } = await client
      .from('forecast_responses')
      .select(`
        *,
        forecast_answers (*)
      `)
      .eq('week_of', targetWeek)
      .eq('region', region);

    if (error) throw error;
    return (data || []).map((response: any) => ({
      ...response,
      answers: response.forecast_answers || []
    }));
  }
};