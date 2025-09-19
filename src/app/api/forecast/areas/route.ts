import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile to know their default area
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('area, region')
      .eq('user_id', user.id)
      .single();

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get distinct area-region pairs from user_profiles
    const { data: areas, error: areasError } = await supabase
      .from('user_profiles')
      .select('area, region')
      .not('area', 'is', null)
      .not('region', 'is', null)
      .not('area', 'eq', '')
      .not('region', 'eq', '')
      .order('area');

    if (areasError) {
      console.error('Error fetching areas:', areasError);
      throw areasError;
    }

    // Create a unique area-region mapping
    const areaRegionMap = new Map<string, string>();
    areas?.forEach(({ area, region }) => {
      if (area && region) {
        areaRegionMap.set(area, region);
      }
    });

    // Convert to array and sort
    const uniqueAreas = Array.from(areaRegionMap.entries())
      .map(([area, region]) => ({ area, region }))
      .sort((a, b) => a.area.localeCompare(b.area));

    return NextResponse.json({
      areas: uniqueAreas,
      currentUserArea: currentUserProfile.area,
      currentUserRegion: currentUserProfile.region
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch areas' },
      { status: 500 }
    );
  }
}