import '@testing-library/jest-dom'

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
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
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