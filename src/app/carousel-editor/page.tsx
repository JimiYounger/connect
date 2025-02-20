'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadcareUploader } from '@/components/uploadcare-uploader'
import { useFiles } from '@/hooks/use-files'
import { useAuth } from '@/features/auth/context/auth-context'
import { AuthButton } from '@/components/auth/auth-button'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import { VimeoUploader } from '@/features/vimeo/components/VimeoUploader'
import { VimeoGallery } from '@/features/vimeo/components/VimeoGallery'
import type { VimeoVideo } from '@/features/vimeo/types/vimeo.types'
import type { FileInfo } from '@/types/files'

export default function CarouselEditorPage() {
  const router = useRouter()
  const { user, teamMember, loading, error } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const { saveFile, error: fileError } = useFiles()
  const [selectedVideo, setSelectedVideo] = useState<VimeoVideo | null>(null)
  const [thumbnails, setThumbnails] = useState<string[]>([])

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    )
  }

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user || !teamMember?.fields) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold mb-8">Please Sign In</h1>
        <AuthButton />
      </div>
    )
  }

  const allowedRoleTypes = ['Admin', 'Marketing']
  const roleType = teamMember.fields['Role Type']
  if (!roleType || !allowedRoleTypes.includes(roleType)) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="mb-8">You do not have permission to access this page.</p>
        <LogoutButton />
      </div>
    )
  }

  const handleUpload = async (fileInfo: {
    cdnUrl: string
    uuid: string
    originalFilename: string
    mimeType: string
    size: number
  }) => {
    try {
      setIsLoading(true)
      await saveFile(fileInfo)
    } catch (error) {
      console.error('Error saving file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoSelect = (video: { id: string; title: string }) => {
    // Convert the gallery video format to VimeoVideo format
    const vimeoVideo: VimeoVideo = {
      uri: `/videos/${video.id}`,
      name: video.title,
      description: '',
      link: `https://vimeo.com/${video.id}`,
      duration: 0,
      width: 0,
      height: 0,
      created_time: new Date().toISOString(),
      modified_time: new Date().toISOString(),
      pictures: {
        base_link: '',
        sizes: [{
          width: 0,
          height: 0,
          link: ''
        }]
      }
    }
    setSelectedVideo(vimeoVideo)
    console.log('Selected video:', vimeoVideo)
  }

  const handleThumbnailUpload = (fileInfo: FileInfo) => {
    if (fileInfo.cdnUrl) {
      const imageUrls = [
        `${fileInfo.cdnUrl}-/preview/1000x1000/-/quality/smart/`,
        `${fileInfo.cdnUrl}-/preview/800x800/-/quality/smart/`,
        `${fileInfo.cdnUrl}-/preview/500x500/-/quality/smart/`,
      ]
      setThumbnails(imageUrls)
    }
  }

  const fullName = teamMember.fields['Full Name'] || 'User'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Carousel Editor</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Signed in as {fullName}
          </p>
          <LogoutButton />
        </div>
      </div>
      
      {selectedVideo && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-medium mb-2">Selected Video</h2>
          <div className="flex items-start gap-4">
            <img 
              src={selectedVideo.pictures.sizes[0].link} 
              alt={selectedVideo.name}
              className="w-24 h-24 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium">{selectedVideo.name}</p>
              <p className="text-sm text-gray-600">
                Duration: {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}
              </p>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Custom Thumbnail</h3>
                <UploadcareUploader 
                  onUpload={handleThumbnailUpload}
                  className="w-full"
                />
              </div>

              {thumbnails.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Preview Thumbnails</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {thumbnails.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setSelectedVideo(null)
                  setThumbnails([])
                }}
                className="mt-4 text-sm text-red-600 hover:text-red-700"
              >
                Remove Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-medium mb-4">Upload New Video</h2>
          <VimeoUploader />
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-4">Your Videos</h2>
          <VimeoGallery 
            onVideoSelect={handleVideoSelect}
            selectedVideoId={selectedVideo ? selectedVideo.uri.split('/').pop() : undefined}
          />
        </div>
      </div>
    </div>
  )
} 