'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { 
  Eye, 
  CheckCircle, 
  Clock, 
  FolderOpen, 
  Tag, 
  Users, 
  Play,
  Loader2,
  AlertCircle,
  Share2
} from 'lucide-react'
import type { ImportFormData } from '../VideoImportWizard'

interface ReviewStepProps {
  formData: ImportFormData
  updateFormData: (updates: Partial<ImportFormData>) => void
  canSubmit: boolean
}

export function ReviewStep({ formData, updateFormData: _updateFormData, canSubmit }: ReviewStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFinalSubmit = async () => {
    if (!formData.selectedVideo || formData.processingStatus.status !== 'completed') {
      setSubmitError('Video processing must be completed before submission')
      return
    }

    if (!formData.category) {
      setSubmitError('Please select a category')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/video-library/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vimeoId: formData.selectedVideo.id,
          title: formData.videoDetails.title,
          description: formData.videoDetails.description,
          categoryId: formData.category.id,
          subcategoryId: formData.subcategory?.id,
          tags: formData.tags,
          permissions: formData.permissions,
          publicSharingEnabled: formData.publicSharingEnabled,
          customThumbnailUrl: formData.videoDetails.customThumbnailUrl,
          thumbnailSource: formData.videoDetails.thumbnailSource,
          vimeoData: {
            uri: formData.selectedVideo.uri,
            duration: formData.selectedVideo.duration,
            thumbnail_url: formData.selectedVideo.thumbnail_url
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Import failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setSubmitSuccess(true)
        // Redirect to video library after a short delay
        setTimeout(() => {
          window.location.href = '/admin/video-library'
        }, 2000)
      } else {
        throw new Error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-green-800">Video Imported Successfully!</h3>
              <p className="text-green-600 mt-2">
                Your video has been added to the library and is now searchable.
              </p>
            </div>
            <Button asChild>
              <a href="/admin/video-library">
                Go to Video Library
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Video Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Video Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.selectedVideo && (
            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <Image
                  src={
                    formData.videoDetails.thumbnailSource === 'vimeo' 
                      ? formData.selectedVideo.thumbnail_url
                      : formData.videoDetails.customThumbnailUrl || formData.selectedVideo.thumbnail_url
                  }
                  alt={formData.selectedVideo.title}
                  width={128}
                  height={80}
                  className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                />
                <div className="text-xs text-center text-gray-500">
                  {formData.videoDetails.thumbnailSource === 'vimeo' 
                    ? 'Vimeo'
                    : formData.videoDetails.thumbnailSource === 'upload'
                    ? 'Custom Upload'
                    : 'External URL'
                  }
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{formData.videoDetails.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{formData.videoDetails.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(formData.selectedVideo.duration)}</span>
                  </div>
                  <div>Vimeo ID: {formData.selectedVideo.id}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {formData.processingStatus.status === 'completed' ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Processing Completed</div>
                  <div className="text-sm text-green-600">
                    Transcript extracted, chunks created, and embeddings generated
                  </div>
                </div>
              </>
            ) : formData.processingStatus.status === 'processing' ? (
              <>
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                <div>
                  <div className="font-medium text-blue-800">Processing in Progress</div>
                  <div className="text-sm text-blue-600">
                    {formData.processingStatus.currentStep} ({formData.processingStatus.progress}%)
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-red-600" />
                <div>
                  <div className="font-medium text-red-800">Processing Failed</div>
                  <div className="text-sm text-red-600">
                    {formData.processingStatus.error || 'Processing incomplete'}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {formData.processingStatus.transcript ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Transcript</span>
            </div>
            <div className="flex items-center gap-2">
              {formData.processingStatus.chunks ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Chunks</span>
            </div>
            <div className="flex items-center gap-2">
              {formData.processingStatus.embeddings ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">Embeddings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Category</Label>
            <div className="mt-1">
              {formData.category ? (
                <Badge variant="secondary" className="text-sm">
                  {formData.category.name}
                </Badge>
              ) : (
                <span className="text-sm text-red-600">No category selected</span>
              )}
            </div>
          </div>

          {formData.subcategory && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Subcategory</Label>
              <div className="mt-1">
                <Badge variant="outline" className="text-sm">
                  {formData.subcategory.name}
                </Badge>
              </div>
            </div>
          )}

          {formData.tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Tags</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Access Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.permissions.roleTypes.length === 0 && 
           formData.permissions.teams.length === 0 && 
           formData.permissions.areas.length === 0 && 
           formData.permissions.regions.length === 0 ? (
            <p className="text-sm text-gray-600">Available to all users</p>
          ) : (
            <div className="space-y-3">
              {formData.permissions.roleTypes.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Role Types</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.permissions.roleTypes.map(role => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.permissions.teams.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Teams</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.permissions.teams.map(team => (
                      <Badge key={team} variant="secondary" className="text-xs">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.permissions.areas.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Areas</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.permissions.areas.map(area => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.permissions.regions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Regions</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {formData.permissions.regions.map(region => (
                      <Badge key={region} variant="secondary" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Public Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {formData.publicSharingEnabled ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">Public Sharing Enabled</div>
                  <div className="text-sm text-green-600">
                    This video can be shared publicly with recruits or customers
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-gray-100"></div>
                <div>
                  <div className="font-medium text-gray-700">Public Sharing Disabled</div>
                  <div className="text-sm text-gray-600">
                    This video is only available to internal users
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <Card>
        <CardContent className="pt-6">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 font-medium">Error: {submitError}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              Ready to import this video to your library? This will make it searchable and available to users based on the permissions you&apos;ve set.
            </div>

            <Button
              onClick={handleFinalSubmit}
              disabled={
                !canSubmit ||
                isSubmitting || 
                formData.processingStatus.status !== 'completed' ||
                !formData.category
              }
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing Video...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Import Video to Library
                </>
              )}
            </Button>

            {(formData.processingStatus.status !== 'completed' || !formData.category) && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                {formData.processingStatus.status !== 'completed' 
                  ? 'Video processing must be completed before import'
                  : 'Please select a category before import'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

