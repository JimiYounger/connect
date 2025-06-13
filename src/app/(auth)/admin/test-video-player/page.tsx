'use client'

import { useState } from 'react'
import { VideoPlayer } from '@/features/videoViewer/components/VideoPlayer'
import { VideoPermissionGate } from '@/features/videoViewer/components/VideoPermissionGate'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import type { VideoForViewing } from '@/features/videoViewer/types'

// Mock video data for testing
const mockVideo: VideoForViewing = {
  id: 'test-video-1',
  title: 'Sample Training Video - Mobile Optimization Best Practices',
  description: 'Learn how to create mobile-first designs that provide premium user experiences. This comprehensive training covers touch interactions, responsive layouts, and performance optimization techniques.',
  vimeoId: '76979871', // Sample Vimeo video ID
  vimeoDuration: 300, // 5 minutes
  vimeoThumbnailUrl: 'https://i.vimeocdn.com/video/example_thumbnail.jpg',
  customThumbnailUrl: undefined,
  thumbnailSource: 'vimeo',
  category: {
    id: 'cat-1',
    name: 'Design & UX'
  },
  subcategory: {
    id: 'subcat-1',
    name: 'Mobile Design'
  },
  series: {
    id: 'series-1',
    name: 'Mobile Development Series'
  },
  tags: ['mobile', 'design', 'ux', 'responsive'],
  libraryStatus: 'approved',
  publicSharingEnabled: true,
  visibilityConditions: {
    roleTypes: ['Setter', 'Manager', 'Admin'],
    teams: [],
    areas: [],
    regions: []
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export default function TestVideoPlayerPage() {
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Player Test</h1>
              <p className="text-gray-600 mt-1">Testing mobile-first video player component</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showDebugInfo}
                  onChange={(e) => setShowDebugInfo(e.target.checked)}
                  className="rounded"
                />
                Debug Info
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Video Player Component</h2>
            
            <VideoPermissionGate
              video={mockVideo}
              profile={profile}
              showDebugInfo={showDebugInfo}
            >
              <VideoPlayer
                video={mockVideo}
                autoplay={false}
                onComplete={() => console.log('Video completed!')}
                onProgress={(time) => console.log('Progress:', time)}
              />
            </VideoPermissionGate>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Mobile Testing Instructions</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Touch Controls:</strong> Tap anywhere on the video to show/hide controls</p>
            <p>• <strong>Auto-hide:</strong> Controls automatically hide after 3 seconds when playing</p>
            <p>• <strong>Resume Feature:</strong> Will show resume prompt if you&apos;ve watched 5-90% of the video</p>
            <p>• <strong>Progress Tracking:</strong> Progress is saved every 5 seconds and on major events</p>
            <p>• <strong>Fullscreen:</strong> Tap the fullscreen button for immersive viewing</p>
            <p>• <strong>Skip Controls:</strong> Use the 10-second skip buttons for quick navigation</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">🎯 Mobile-First Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Touch-optimized controls</li>
              <li>• Auto-hiding UI</li>
              <li>• Large touch targets</li>
              <li>• Responsive design</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-2">📊 Analytics & Progress</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Watch progress tracking</li>
              <li>• Resume functionality</li>
              <li>• Event logging</li>
              <li>• Completion tracking</li>
            </ul>
          </div>
        </div>

        {/* User Info */}
        {profile && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Current User Context</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <div>Name: {profile.first_name} {profile.last_name}</div>
              <div>Role: {profile.role_type}</div>
              <div>Team: {profile.team || 'None'}</div>
              <div>Area: {profile.area || 'None'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}