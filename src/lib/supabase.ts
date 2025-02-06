import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/supabase'

// This will give you a fully typed client
export const supabase = createClientComponentClient<Database>()

// If you need a server-side client, you can also add:
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}