// src/app/dashboard/page.tsx
import { getServerSession } from "@/features/auth/utils/auth-server"
import { AuthProvider } from "@/features/auth/context/auth-context"
import { DashboardContent } from "./DashboardContent"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  try {
    const initialSession = await getServerSession()
    
    // Optional: Redirect if no session
    if (!initialSession) {
      redirect('/')
    }

    return (
      <AuthProvider initialSession={initialSession}>
        <DashboardContent />
      </AuthProvider>
    )
  } catch (error) {
    console.error('Error in DashboardPage:', error)
    redirect('/')
  }
}
