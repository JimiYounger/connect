// src/app/dashboard/[id]/page.tsx

import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { QueryProvider } from '@/providers/QueryProvider'
import { Suspense } from 'react'

interface DashboardPageProps {
  params: {
    id: string
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  return (
    <QueryProvider>
      <main className="min-h-screen">
        <Suspense fallback={<div>Loading...</div>}>
          <DashboardLayout dashboardId={params.id} />
        </Suspense>
      </main>
    </QueryProvider>
  )
} 