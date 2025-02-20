import { syncService } from '../services/sync-service'
import { createClient } from '@/features/auth/utils/supabase-server'
import { getTeamMemberByEmail } from '@/lib/airtable'

// Mock dependencies
jest.mock('@/features/auth/utils/supabase-server')
jest.mock('@/lib/airtable', () => ({
  getTeamMemberByEmail: jest.fn(),
  base: jest.fn(() => ({
    select: jest.fn(),
  })),
}))

describe('syncService', () => {
  const mockTeamMember = {
    id: 'rec123',
    fields: {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john@purelightpower.com',
      'Role': 'Manager',
      'Role Type': 'Manager',
      'Team': 'Sales',
      'Area': 'Portland',
      'Region': 'Northwest'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getTeamMemberByEmail as jest.Mock).mockResolvedValue(mockTeamMember)
    ;(createClient as jest.Mock).mockReturnValue({
      rpc: jest.fn().mockResolvedValue({ error: null }),
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTeamMember,
              error: null
            })
          })
        })
      })
    })
  })

  it('syncs user profile successfully', async () => {
    const result = await syncService.syncUserProfile(
      'john@purelightpower.com',
      'google123'
    )

    expect(result).toEqual(mockTeamMember)
    expect(getTeamMemberByEmail).toHaveBeenCalledWith('john@purelightpower.com')
  })

  it('handles missing Airtable data', async () => {
    ;(getTeamMemberByEmail as jest.Mock).mockResolvedValue(null)

    await expect(
      syncService.syncUserProfile('missing@purelightpower.com', 'google123')
    ).rejects.toThrow('User not found in Airtable')
  })
}) 