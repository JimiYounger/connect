import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { forecastService } from '@/features/forecasting/services/forecastService';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get week from query params
    const { searchParams } = new URL(request.url);
    const weekOf = searchParams.get('week_of') || undefined;

    const forecastSummary = await forecastService.getWeeklyForecast(weekOf, supabase);

    return NextResponse.json(forecastSummary);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}