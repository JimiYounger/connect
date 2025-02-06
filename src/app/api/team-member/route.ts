import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Airtable from 'airtable'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Create a new cookie store and await it
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })

    // Get and await the session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID!)

    console.log('Fetching team member for email:', email)

    const records = await base('Team Members')
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      })
      .firstPage()

    if (!records || records.length === 0) {
      console.log('No team member found for email:', email)
      return NextResponse.json({ data: null })
    }

    console.log('Found team member:', records[0].fields)

    return NextResponse.json({ 
      data: {
        id: records[0].id,
        fields: records[0].fields
      }
    })

  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 