import { AuthButton } from '@/components/auth/auth-button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Connect</h1>
        <p className="text-gray-600">Please sign in to continue</p>
        <AuthButton />
      </div>
    </main>
  )
}
