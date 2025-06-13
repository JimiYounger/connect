'use client'

import { ReactNode } from 'react'
import { Lock, AlertCircle, Eye } from 'lucide-react'
import { useVideoPermissions } from '../hooks/useVideoPermissions'
import type { VideoForViewing, VideoPermissionResult } from '../types'
import type { UserProfile } from '@/features/users/types'

interface VideoPermissionGateProps {
  video: VideoForViewing
  profile: UserProfile | null
  children: ReactNode
  fallback?: ReactNode
  showDebugInfo?: boolean
}

export function VideoPermissionGate({ 
  video, 
  profile, 
  children, 
  fallback,
  showDebugInfo = false 
}: VideoPermissionGateProps) {
  const { canViewVideo, getPermissionSummary, isAdmin, isLoading } = useVideoPermissions(profile)

  // Loading state
  if (isLoading) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check permission
  const permissionResult = canViewVideo(video)
  
  // If user can view, render the video player
  if (permissionResult.canView) {
    return (
      <div>
        {children}
        {/* Debug info for admins */}
        {showDebugInfo && isAdmin && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-medium mb-2">🔧 Permission Debug (Admin Only)</h4>
            <div className="space-y-1">
              <div>Access Reason: <span className="font-mono">{permissionResult.reason}</span></div>
              <div>Video Status: <span className="font-mono">{video.libraryStatus}</span></div>
              <div>Public Sharing: <span className="font-mono">{video.publicSharingEnabled ? 'Yes' : 'No'}</span></div>
              {video.visibilityConditions && (
                <div>Restrictions: <span className="font-mono">{JSON.stringify(video.visibilityConditions)}</span></div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Custom fallback if provided
  if (fallback) {
    return <>{fallback}</>
  }

  // Default access denied UI
  return (
    <div className="aspect-video bg-gray-50 rounded-lg border border-gray-200">
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <VideoAccessDeniedContent 
          video={video}
          permissionResult={permissionResult}
          isAdmin={isAdmin}
          debugInfo={showDebugInfo ? getPermissionSummary(video) : null}
        />
      </div>
    </div>
  )
}

interface VideoAccessDeniedContentProps {
  video: VideoForViewing
  permissionResult: VideoPermissionResult
  isAdmin: boolean
  debugInfo: any
}

function VideoAccessDeniedContent({ 
  video, 
  permissionResult, 
  isAdmin, 
  debugInfo 
}: VideoAccessDeniedContentProps) {
  const getAccessDeniedMessage = () => {
    switch (permissionResult.restrictionReason) {
      case 'not_approved':
        return {
          icon: <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />,
          title: 'Video Under Review',
          message: 'This video is currently being reviewed and is not yet available for viewing.',
          isTemporary: true
        }
      
      case 'no_role_match':
        return {
          icon: <Lock className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'Access Restricted',
          message: 'This video is restricted to specific roles and is not available to your account.',
          isTemporary: false
        }
      
      case 'no_team_match':
        return {
          icon: <Lock className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'Team Restricted',
          message: 'This video is only available to specific teams.',
          isTemporary: false
        }
      
      case 'no_area_match':
        return {
          icon: <Lock className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'Area Restricted',
          message: 'This video is only available to specific areas.',
          isTemporary: false
        }
      
      case 'no_region_match':
        return {
          icon: <Lock className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'Region Restricted',
          message: 'This video is only available to specific regions.',
          isTemporary: false
        }
      
      default:
        return {
          icon: <Eye className="w-12 h-12 text-gray-400 mb-4" />,
          title: 'Not Available',
          message: 'This video is not currently available for viewing.',
          isTemporary: true
        }
    }
  }

  const { icon, title, message, isTemporary } = getAccessDeniedMessage()

  return (
    <>
      {icon}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
        {message}
      </p>

      {isTemporary && (
        <p className="text-xs text-gray-500 mt-3">
          Please check back later or contact your administrator.
        </p>
      )}

      {/* Video info (even when restricted) */}
      <div className="mt-6 pt-4 border-t border-gray-200 w-full max-w-sm">
        <h4 className="font-medium text-gray-900 text-sm mb-1">
          {video.title}
        </h4>
        
        {video.category && (
          <p className="text-xs text-gray-500">
            {video.category.name}
            {video.subcategory && ` • ${video.subcategory.name}`}
          </p>
        )}
      </div>

      {/* Admin debug info */}
      {isAdmin && debugInfo && (
        <details className="mt-4 text-left w-full max-w-sm">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            🔧 Debug Info (Admin)
          </summary>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono space-y-1">
            <div>Can View: {debugInfo.canView ? '✅' : '❌'}</div>
            <div>Approved: {debugInfo.checks.isApproved ? '✅' : '❌'}</div>
            <div>Public: {debugInfo.checks.isPublic ? '✅' : '❌'}</div>
            <div>Role Access: {debugInfo.checks.hasRoleAccess ? '✅' : '❌'}</div>
            <div>Team Access: {debugInfo.checks.hasTeamAccess ? '✅' : '❌'}</div>
            <div>Area Access: {debugInfo.checks.hasAreaAccess ? '✅' : '❌'}</div>
            <div>Region Access: {debugInfo.checks.hasRegionAccess ? '✅' : '❌'}</div>
          </div>
        </details>
      )}
    </>
  )
}