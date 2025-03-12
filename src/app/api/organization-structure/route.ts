// src/app/api/organization-structure/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  
  // First verify if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Use hard-coded values for now, until RLS is fixed
    const roleTypes = ['Setter', 'Closer', 'Manager', 'Executive', 'Admin'];
    
    // Get unique values with direct queries
    const [teamsRes, areasRes, regionsRes] = await Promise.all([
      supabase.from('user_profiles').select('team'),
      supabase.from('user_profiles').select('area'),
      supabase.from('user_profiles').select('region')
    ]);
    
    // Process results
    const uniqueTeams = [...new Set(teamsRes.data?.map(t => t.team).filter(Boolean) || [])];
    const uniqueAreas = [...new Set(areasRes.data?.map(a => a.area).filter(Boolean) || [])];
    const uniqueRegions = [...new Set(regionsRes.data?.map(r => r.region).filter(Boolean) || [])];
    
    return NextResponse.json({
      roleTypes,
      teams: uniqueTeams,
      areas: uniqueAreas,
      regions: uniqueRegions
    });
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json({ 
      roleTypes: ['Setter', 'Closer', 'Manager', 'Executive', 'Admin'],
      teams: [],
      areas: [],
      regions: []
    });
  }
}