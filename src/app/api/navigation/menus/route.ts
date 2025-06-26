// src/app/api/navigation/menus/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    
    // Fetch navigation menus
    const { data, error } = await supabase
      .from('navigation_menus')
      .select('*, items:navigation_items(count)')
      .order('name')
    
    if (error) {
      console.error('Error fetching navigation menus:', error)
      return NextResponse.json(
        { error: 'Failed to fetch navigation menus' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}