import { AudioUploadForm } from '@/features/audioLibrary/upload/AudioUploadForm'
import { getAudioSeriesOptions } from '@/features/audioLibrary/services/audio-service'
import { createClient } from '@/lib/supabase-server'

export default async function AudioUploadPage() {
  // Fetch audio series options for the dropdown
  const seriesOptions = await getAudioSeriesOptions()
  
  // Get the current user ID from Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id || ''
  
  if (!currentUserId) {
    // This should not happen as the admin layout should enforce authentication
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-500">Error: Could not retrieve user information.</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload New Audio</h1>
      <AudioUploadForm 
        seriesOptions={seriesOptions} 
        currentUserId={currentUserId} 
      />
    </div>
  )
}