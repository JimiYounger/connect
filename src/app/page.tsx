// my-app/src/app/page.tsx
'use client'

import { useAuth } from "@/features/auth/context/auth-context"
import { LoginButtonWrapper } from '@/features/auth/components/LoginButtonWrapper'
import { redirect } from 'next/navigation'
import { LoadingState } from "@/components/loading-state"

export const metadata = {
  title: 'Connect by Purelight',
  description: 'Everything You Need In One Place',
  openGraph: {
    title: 'Connect by Purelight',
    description: 'Everything You Need In One Place',
    url: 'https://www.plpconnect.com',
    images: [
      {
        url: 'https://ucarecdn.com/43907444-0ddb-4271-a3ec-c28ab182b972/-/preview/1000x1000/',
        width: 1000,
        height: 1000,
        alt: 'Connect Thumbnail',
      },
    ],
    type: 'website',
  },
}

export default function Home() {
  const { session, loading } = useAuth()

  if (loading.any) {
    return <LoadingState />
  }
  
  if (session) {
    redirect('/dashboard')
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Connect</h1>
        <p className="text-gray-600">Please sign in to continue</p>
        <LoginButtonWrapper />
      </div>
    </main>
  )
}
