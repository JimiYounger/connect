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

    // Get current user's profile to know their area
    const { data: currentUserProfile } = await supabase
      .from('user_profiles')
      .select('area')
      .eq('user_id', user.id)
      .single();

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all users for people selection
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, team, area, region, role, user_key')
      .order('first_name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    return NextResponse.json({
      users: users || [],
      currentUserArea: currentUserProfile.area || null
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}