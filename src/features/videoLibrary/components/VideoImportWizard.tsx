'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, ArrowRight, ArrowLeft, Play, Search, FolderOpen, Eye, Loader2, FileText, Layers, Zap } from 'lucide-react'
import { VideoSelectionStep } from './import-steps/VideoSelectionStep'
import { CategorizationStep } from './import-steps/CategorizationStep'
import { ReviewStep } from './import-steps/ReviewStep'

export interface VimeoVideo {
  id: string
  title: string
  description: string
  thumbnail_url: string
  duration: number
  uri?: string
  url?: string
}

export interface ProcessingStatus {
  status: 'idle' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string
  transcript?: boolean
  chunks?: boolean
  embeddings?: boolean
  descriptionGenerating?: boolean
  error?: string
}

export interface CategoryData {
  id?: string
  name: string
  description?: string
  permissions: {
    roleTypes: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }
}

export interface SubcategoryData {
  id?: string
  name: string
  description?: string
  categoryId: string
  permissions: {
    roleTypes: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }
}

export interface ImportFormData {
  selectedVideo: VimeoVideo | null
  processingStatus: ProcessingStatus
  videoDetails: {
    title: string
    description: string
    customThumbnailUrl: string
    thumbnailSource: 'vimeo' | 'upload' | 'url'
  }
  category: CategoryData | null
  subcategory: SubcategoryData | null
  tags: string[]
  permissions: {
    roleTypes: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }
  publicSharingEnabled: boolean
}

const WIZARD_STEPS = [
  {
    id: 'selection',
    title: 'Select Video',
    description: 'Search and choose video from Vimeo',
    icon: Search
  },
  {
    id: 'categorization',
    title: 'Categorization',
    description: 'Organize and set permissions',
    icon: FolderOpen
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Final review and submit',
    icon: Eye
  }
]

export function VideoImportWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<ImportFormData>({
    selectedVideo: null,
    processingStatus: {
      status: 'idle',
      progress: 0,
      currentStep: '',
      transcript: false,
      chunks: false,
      embeddings: false,
      descriptionGenerating: false
    },
    videoDetails: {
      title: '',
      description: '',
      customThumbnailUrl: '',
      thumbnailSource: 'vimeo'
    },
    category: null,
    subcategory: null,
    tags: [],
    permissions: {
      roleTypes: [],
      teams: [],
      areas: [],
      regions: []
    },
    publicSharingEnabled: false
  })

  const updateFormData = useCallback((updates: Partial<ImportFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  // Background processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [_processingVideoId, setProcessingVideoId] = useState<string | null>(null)
  const processedVideoRef = useRef<string | null>(null)

  // Background processing functions (extracted from ProcessingStep)
  const startBackgroundProcessing = useCallback(async (video: VimeoVideo) => {
    if (!video) return
    if (isProcessing) {
      console.log('Processing already in progress, skipping duplicate request')
      return
    }
    if (processedVideoRef.current === video.id) {
      console.log('Video already processed, skipping duplicate request')
      return
    }

    setIsProcessing(true)
    processedVideoRef.current = video.id
    updateFormData({
      processingStatus: {
        status: 'processing',
        progress: 10,
        currentStep: 'Getting your video ready for AI magic...',
        transcript: false,
        chunks: false,
        embeddings: false,
        descriptionGenerating: false
      },
      videoDetails: {
        title: video.title,
        description: video.description,
        customThumbnailUrl: '',
        thumbnailSource: 'vimeo'
      }
    })

    try {
      const response = await fetch('/api/video-library/import-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vimeoId: video.id,
          title: video.title,
          description: video.description,
          vimeoUri: video.uri,
          vimeoDuration: video.duration,
          vimeoThumbnailUrl: video.thumbnail_url
        })
      })

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.videoFileId) {
        setProcessingVideoId(data.videoFileId)
        
        if (data.alreadyProcessed) {
          updateFormData({
            processingStatus: {
              status: 'completed',
              progress: 100,
              currentStep: 'Video already processed and ready to go! ✨',
              transcript: true,
              chunks: true,
              embeddings: true,
              descriptionGenerating: false
            }
          })
          setIsProcessing(false)
        } else {
          updateFormData({
            processingStatus: {
              status: 'processing',
              progress: 20,
              currentStep: 'Video saved, extracting transcription...',
              transcript: false,
              chunks: false,
              embeddings: false,
              descriptionGenerating: false
            }
          })
          
          setTimeout(() => {
            pollProcessingStatus(data.videoFileId)
          }, 2000)
        }
      } else {
        throw new Error(data.error || 'Processing failed')
      }
    } catch (error) {
      console.error('Processing error:', error)
      updateFormData({
        processingStatus: {
          status: 'failed',
          progress: 0,
          currentStep: 'Processing failed',
          transcript: false,
          chunks: false,
          embeddings: false,
          descriptionGenerating: false,
          error: error instanceof Error ? error.message : 'Processing failed'
        }
      })
      setIsProcessing(false)
    }
  }, [isProcessing, updateFormData])

  const pollProcessingStatus = useCallback(async (videoFileId: string) => {
    let attempts = 0
    let consecutiveErrors = 0
    const maxAttempts = 60
    const maxConsecutiveErrors = 3
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/video-library/status/${videoFileId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          consecutiveErrors = 0
          
          const { transcriptStatus, embeddingStatus, chunksCount, videoFile } = data
          
          let progress = 20
          let currentStep = 'Extracting transcription...'
          let transcript = false
          let chunks = false
          let embeddings = false
          let descriptionGenerating = false
          
          // Track description generation
          const hasOriginalDescription = formData.videoDetails.description && formData.videoDetails.description.trim() !== ''
          const hasGeneratedDescription = videoFile?.description && videoFile.description !== formData.selectedVideo?.description
          
          // Show description generating during transcript processing and right after completion if no description yet
          if (!hasOriginalDescription && !hasGeneratedDescription) {
            if (transcriptStatus === 'processing' || transcriptStatus === 'completed') {
              descriptionGenerating = true
            }
          }
          
          if (transcriptStatus === 'completed') {
            transcript = true
            progress = 35
            
            if (!hasOriginalDescription && !hasGeneratedDescription) {
              currentStep = 'Transcription complete, generating description...'
            } else {
              currentStep = 'Transcription complete, optimizing for search...'
            }
          }
          
          // Update description if it was generated
          if (hasGeneratedDescription && videoFile?.description !== formData.videoDetails.description) {
            setFormData(prev => ({
              ...prev,
              videoDetails: {
                ...prev.videoDetails,
                description: videoFile.description
              }
            }))
          }
          
          if (chunksCount > 0) {
            chunks = true
            progress = 70
            currentStep = `Optimized for search, working AI magic...`
            descriptionGenerating = false
          }
          
          if (embeddingStatus === 'completed') {
            embeddings = true
            progress = 100
            currentStep = 'AI magic complete! Ready to categorize! ✨'
            
            updateFormData({
              processingStatus: {
                status: 'completed',
                progress: 100,
                currentStep,
                transcript,
                chunks,
                embeddings,
                descriptionGenerating: false
              }
            })
            setIsProcessing(false)
            return
          }
          
          if (transcriptStatus === 'failed' || embeddingStatus === 'failed') {
            throw new Error(`Processing failed: ${transcriptStatus === 'failed' ? 'transcript' : 'embeddings'} step failed`)
          }
          
          updateFormData({
            processingStatus: {
              status: 'processing',
              progress,
              currentStep,
              transcript,
              chunks,
              embeddings,
              descriptionGenerating
            }
          })
          
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000)
          } else {
            throw new Error('Processing timeout - taking longer than expected')
          }
        } else {
          throw new Error(data.error || 'Status check failed')
        }
      } catch (error) {
        console.error('Polling error:', error)
        consecutiveErrors++
        
        const isDefinitiveFailure = error instanceof Error && 
          (error.message.includes('Processing failed:') || 
           error.message.includes('Processing timeout'))
        
        if (consecutiveErrors >= maxConsecutiveErrors || isDefinitiveFailure) {
          updateFormData({
            processingStatus: {
              status: 'failed',
              progress: formData.processingStatus.progress,
              currentStep: 'Processing failed',
              transcript: formData.processingStatus.transcript,
              chunks: formData.processingStatus.chunks,
              embeddings: formData.processingStatus.embeddings,
              descriptionGenerating: false,
              error: error instanceof Error ? error.message : 'Status check failed'
            }
          })
          setIsProcessing(false)
        } else {
          attempts++
          if (attempts < maxAttempts) {
            console.log(`Temporary error (${consecutiveErrors}/${maxConsecutiveErrors}), retrying in 3 seconds...`)
            setTimeout(poll, 3000)
          } else {
            updateFormData({
              processingStatus: {
                status: 'failed',
                progress: formData.processingStatus.progress,
                currentStep: 'Processing timeout',
                transcript: formData.processingStatus.transcript,
                chunks: formData.processingStatus.chunks,
                embeddings: formData.processingStatus.embeddings,
                descriptionGenerating: false,
                error: 'Processing took too long'
              }
            })
            setIsProcessing(false)
          }
        }
      }
    }
    
    poll()
  }, [formData.processingStatus, formData.videoDetails.description, formData.selectedVideo?.description, updateFormData, setIsProcessing])

  // Auto-start processing when video is selected
  useEffect(() => {
    if (formData.selectedVideo && formData.processingStatus.status === 'idle' && !isProcessing) {
      startBackgroundProcessing(formData.selectedVideo)
    }
  }, [formData.selectedVideo, formData.processingStatus.status, isProcessing, startBackgroundProcessing])

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Selection
        return formData.selectedVideo !== null
      case 1: // Categorization
        return formData.category !== null
      case 2: // Review (can only submit when processing is complete)
        return true
      default:
        return false
    }
  }

  const canSubmit = () => {
    return formData.processingStatus.status === 'completed' && formData.category !== null
  }

  const handleNext = () => {
    if (canProceedToNext() && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed'
    if (stepIndex === currentStep) return 'current'
    return 'upcoming'
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <VideoSelectionStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 1:
        return (
          <CategorizationStep
            formData={formData}
            updateFormData={updateFormData}
          />
        )
      case 2:
        return (
          <ReviewStep
            formData={formData}
            updateFormData={updateFormData}
            canSubmit={canSubmit()}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Video Import Wizard</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="font-semibold">
                {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}%
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress 
              value={((currentStep + 1) / WIZARD_STEPS.length) * 100} 
              className="h-2"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const status = getStepStatus(index)
              const StepIcon = step.icon
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
                    {index > 0 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                    
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        status === 'completed' 
                          ? 'bg-green-500 border-green-500 text-white'
                          : status === 'current'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <div className={`text-sm font-medium ${
                          status === 'current' ? 'text-blue-600' : 
                          status === 'completed' ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 max-w-20">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Background Processing Indicator */}
      {formData.selectedVideo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-5 w-5" />
              Video Processing
              {formData.processingStatus.status === 'completed' && (
                <Badge className="bg-green-100 text-green-800 ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
              {formData.processingStatus.status === 'processing' && (
                <Badge className="bg-blue-100 text-blue-800 ml-2">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </Badge>
              )}
              {formData.processingStatus.status === 'failed' && (
                <Badge className="bg-red-100 text-red-800 ml-2">
                  Failed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{formData.processingStatus.progress}%</span>
                </div>
                <Progress value={formData.processingStatus.progress} className="h-2" />
                <p className="text-sm text-gray-600">{formData.processingStatus.currentStep}</p>
              </div>

              {/* Processing Steps */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    formData.processingStatus.transcript
                      ? 'bg-green-100 text-green-600'
                      : isProcessing
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {formData.processingStatus.transcript ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Transcription</div>
                    <div className="text-xs text-gray-500">
                      {formData.processingStatus.transcript ? 'Complete' : 'Extracting...'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    formData.processingStatus.chunks
                      ? 'bg-green-100 text-green-600'
                      : formData.processingStatus.transcript && isProcessing
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {formData.processingStatus.chunks ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : formData.processingStatus.transcript && isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Search Optimization</div>
                    <div className="text-xs text-gray-500">
                      {formData.processingStatus.chunks ? 'Optimized' : 'Optimizing...'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    formData.processingStatus.embeddings
                      ? 'bg-green-100 text-green-600'
                      : formData.processingStatus.chunks && isProcessing
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {formData.processingStatus.embeddings ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : formData.processingStatus.chunks && isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">AI Magic</div>
                    <div className="text-xs text-gray-500">
                      {formData.processingStatus.embeddings ? 'Complete ✨' : 'Working...'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {formData.processingStatus.status === 'failed' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-red-800">Processing Failed</div>
                    <div className="text-sm text-red-600">
                      {formData.processingStatus.error || 'An error occurred during processing'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <div className="min-h-[600px]">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < WIZARD_STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    // Handle final submission
                    console.log('Final submission:', formData)
                  }}
                  disabled={!canSubmit()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {formData.processingStatus.status === 'completed' ? 'Import Video' : 'Waiting for processing...'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}