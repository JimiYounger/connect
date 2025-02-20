import { renderHook } from '@testing-library/react'
import { usePermissions } from '../hooks/usePermissions'
import { useProfile } from '@/features/users/hooks/useProfile'

// Mock dependencies
jest.mock('@/features/users/hooks/useProfile')

describe('usePermissions', () => {
  const mockProfile = {
    role_type: 'Manager',
    role: 'Sales Manager',
    team: 'Sales',
    area: 'Portland',
    region: 'Northwest'
  }

  beforeEach(() => {
    ;(useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null
    })
  })

  it('allows permitted actions', () => {
    const { result } = renderHook(() => usePermissions())

    expect(result.current.can('view_dashboard')).toBe(true)
    expect(result.current.can('view_reports')).toBe(true)
  })

  it('restricts unauthorized actions', () => {
    const { result } = renderHook(() => usePermissions())

    expect(result.current.can('manage_users')).toBe(false)
    expect(result.current.can('edit_settings')).toBe(false)
  })

  it('respects area restrictions', () => {
    const { result } = renderHook(() => usePermissions())

    expect(
      result.current.can('view_area', { area: 'Portland' })
    ).toBe(true)

    expect(
      result.current.can('view_area', { area: 'Seattle' })
    ).toBe(false)
  })
}) 