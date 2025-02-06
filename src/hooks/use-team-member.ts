'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { getTeamMemberByEmail } from '@/lib/airtable'
import type { TeamMember } from '@/types/airtable'

export function useTeamMember() {
  const { user } = useAuth()
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTeamMember() {
      if (user?.email) {
        const member = await getTeamMemberByEmail(user.email)
        setTeamMember(member)
      } else {
        setTeamMember(null)
      }
      setLoading(false)
    }

    loadTeamMember()
  }, [user?.email])

  return { teamMember, loading }
}