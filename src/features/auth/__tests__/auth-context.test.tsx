import { render, act, renderHook, waitFor } from '@testing-library/react'
import { useAuth, AuthProvider } from '../context/auth-context'

// Mock the entire supabase-client module
jest.mock('../utils/supabase-client', () => ({
  authService: {
    getSession: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn()
  }
}))

describe('AuthContext', () => {
  const mockSession = {
    user: {
      id: '123',
      email: 'test@purelightpower.com',
      user_metadata: {
        full_name: 'Test User'
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Set up default mock implementations
    const { authService } = require('../utils/supabase-client')
    authService.getSession.mockResolvedValue(mockSession)
    authService.signOut.mockResolvedValue({ error: null })
    authService.signInWithGoogle.mockResolvedValue({ error: null })
  })

  it('provides initial auth state', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    // Initial state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.session).toBeNull()

    // Wait for auth state to be loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Session should be set
    expect(result.current.session).toEqual(mockSession)
  })

  it('handles sign out', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.signOut()
    })

    const { authService } = require('../utils/supabase-client')
    expect(authService.signOut).toHaveBeenCalled()
  })

  it('handles error states', async () => {
    const { authService } = require('../utils/supabase-client')
    authService.getSession.mockRejectedValueOnce(new Error('Auth error'))

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.session).toBeNull()
  })

  it('provides auth methods to children', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.signOut).toBeDefined()
    expect(typeof result.current.signOut).toBe('function')
  })
}) 