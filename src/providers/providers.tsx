'use client'

import { type PropsWithChildren } from 'react'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  )
} 