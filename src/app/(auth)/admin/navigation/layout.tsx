'use client'

import { ReactNode } from 'react'

export default function AdminNavigationLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  )
}