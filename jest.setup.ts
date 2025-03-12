import '@testing-library/jest-dom'

// Mock environment variables for Supabase
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-supabase-url.com'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  redirect: jest.fn(),
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            single: jest.fn(),
            limit: jest.fn(() => ({
              single: jest.fn()
            })),
          }))
        }))
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}))

// Mock Request and other web APIs
global.Request = class {
  constructor() {
    return {}
  }
} as any

global.Response = class {
  constructor() {
    return {}
  }
} as any

global.Headers = class {
  constructor() {
    return {}
  }
} as any

// Global setup
global.fetch = jest.fn()

// Add this to your jest.setup.ts file
jest.mock('react-grid-layout/css/styles.css', () => ({}));
jest.mock('react-resizable/css/styles.css', () => ({})); 