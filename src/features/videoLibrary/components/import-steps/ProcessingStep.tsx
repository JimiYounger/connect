'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  FileText,
  Layers,
  Zap
} from 'lucide-react'
import type { ImportFormData } from '../VideoImportWizard'

interface ProcessingStepProps {
  formData: ImportFormData
  updateFormData: (updates: Partial<ImportFormData>) => void
}

export function ProcessingStep({ formData, updateFormData }: ProcessingStepProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [_processingVideoId, setProcessingVideoId] = useState<string | null>(null)
  const processedVideoRef = useRef<string | null>(null)

  const pollProcessingStatus = useCallback(async (videoFileId: string) => {
    let attempts = 0
    let consecutiveErrors = 0
    const maxAttempts = 60 // 5 minutes at 5-second intervals
    const maxConsecutiveErrors = 3 // Allow 3 consecutive errors before failing
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/video-library/status/${videoFileId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          // Reset consecutive errors on successful response
          consecutiveErrors = 0
          
          const { transcriptStatus, embeddingStatus, chunksCount } = data
          
          let progress = 20
          let currentStep = 'Extracting transcript...'
          let transcript = false
          let chunks = false
          let embeddings = false
          
          // Update based on transcript status
          if (transcriptStatus === 'completed') {
            transcript = true
            progress = 40
            currentStep = 'Transcript extracted, creating chunks...'
          }
          
          // Update based on chunks
          if (chunksCount > 0) {
            chunks = true
            progress = 60
            currentStep = `Created ${chunksCount} chunks, generating embeddings...`
          }
          
          // Update based on embedding status
          if (embeddingStatus === 'completed') {
            embeddings = true
            progress = 100
            currentStep = 'Processing completed successfully!'
            
            updateFormData({
              processingStatus: {
                status: 'completed',
                progress: 100,
                currentStep,
                transcript,
                chunks,
                embeddings
              }
            })
            setIsProcessing(false)
            return
          }
          
          // Check for failures
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
              embeddings
            }
          })
          
          // Continue polling if not completed and within max attempts
          attempts++
          if (attempts < maxAttempts) {
            setTimeout(poll, 5000) // Poll every 5 seconds
          } else {
            throw new Error('Processing timeout - taking longer than expected')
          }
        } else {
          throw new Error(data.error || 'Status check failed')
        }
      } catch (error) {
        console.error('Polling error:', error)
        consecutiveErrors++
        
        // Only fail after multiple consecutive errors or if it's a definitive failure
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
              error: error instanceof Error ? error.message : 'Status check failed'
            }
          })
          setIsProcessing(false)
        } else {
          // Retry after a shorter delay for temporary errors
          attempts++
          if (attempts < maxAttempts) {
            console.log(`Temporary error (${consecutiveErrors}/${maxConsecutiveErrors}), retrying in 3 seconds...`)
            setTimeout(poll, 3000) // Shorter retry delay for errors
          } else {
            updateFormData({
              processingStatus: {
                status: 'failed',
                progress: formData.processingStatus.progress,
                currentStep: 'Processing timeout',
                transcript: formData.processingStatus.transcript,
                chunks: formData.processingStatus.chunks,
                embeddings: formData.processingStatus.embeddings,
                error: 'Processing took too long'
              }
            })
            setIsProcessing(false)
          }
        }
      }
    }
    
    poll()
  }, [formData.processingStatus, updateFormData, setIsProcessing])

  const startProcessing = useCallback(async () => {
    if (!formData.selectedVideo) return
    if (isProcessing) {
      console.log('Processing already in progress, skipping duplicate request')
      return
    }
    if (processedVideoRef.current === formData.selectedVideo.id) {
      console.log('Video already processed, skipping duplicate request')
      return
    }

    setIsProcessing(true)
    processedVideoRef.current = formData.selectedVideo.id
    updateFormData({
      processingStatus: {
        status: 'processing',
        progress: 10,
        currentStep: 'Starting video processing...',
        transcript: false,
        chunks: false,
        embeddings: false
      }
    })

    try {
      // Step 1: Create video file record and start processing
      const response = await fetch('/api/video-library/import-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vimeoId: formData.selectedVideo.id,
          title: formData.videoDetails.title,
          description: formData.videoDetails.description,
          vimeoUri: formData.selectedVideo.uri,
          vimeoDuration: formData.selectedVideo.duration,
          vimeoThumbnailUrl: formData.selectedVideo.thumbnail_url
        })
      })

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.videoFileId) {
        setProcessingVideoId(data.videoFileId)
        
        // Check if video was already processed
        if (data.alreadyProcessed) {
          updateFormData({
            processingStatus: {
              status: 'completed',
              progress: 100,
              currentStep: 'Video already processed and ready!',
              transcript: true,
              chunks: true,
              embeddings: true
            }
          })
          setIsProcessing(false)
        } else {
          updateFormData({
            processingStatus: {
              status: 'processing',
              progress: 20,
              currentStep: 'Video record created, extracting transcript...',
              transcript: false,
              chunks: false,
              embeddings: false
            }
          })
          
          // Start polling for status after a short delay to allow processing to begin
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
          error: error instanceof Error ? error.message : 'Processing failed'
        }
      })
      setIsProcessing(false)
    }
  }, [formData.selectedVideo, formData.videoDetails, updateFormData, isProcessing, pollProcessingStatus])

  const retryProcessing = () => {
    updateFormData({
      processingStatus: {
        status: 'idle',
        progress: 0,
        currentStep: '',
        transcript: false,
        chunks: false,
        embeddings: false
      }
    })
    setProcessingVideoId(null)
    processedVideoRef.current = null // Reset the processed video ref
    startProcessing()
  }

  // Auto-start processing when component mounts and video is selected
  useEffect(() => {
    if (formData.selectedVideo && formData.processingStatus.status === 'idle' && !isProcessing) {
      startProcessing()
    }
  }, [formData.selectedVideo, formData.processingStatus.status, isProcessing, startProcessing])

  const updateVideoDetails = (field: 'title' | 'description', value: string) => {
    updateFormData({
      videoDetails: {
        ...formData.videoDetails,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Video Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video-title">Title</Label>
            <Input
              id="video-title"
              value={formData.videoDetails.title}
              onChange={(e) => updateVideoDetails('title', e.target.value)}
              placeholder="Enter video title..."
            />
          </div>
          
          <div>
            <Label htmlFor="video-description">Description</Label>
            <Textarea
              id="video-description"
              value={formData.videoDetails.description}
              onChange={(e) => updateVideoDetails('description', e.target.value)}
              placeholder="Enter video description..."
              rows={3}
            />
          </div>
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
        <CardContent className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="font-medium text-sm">Transcript</div>
                <div className="text-xs text-gray-500">
                  {formData.processingStatus.transcript ? 'Completed' : 'Extracting...'}
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
                <div className="font-medium text-sm">Chunks</div>
                <div className="text-xs text-gray-500">
                  {formData.processingStatus.chunks ? 'Created' : 'Processing...'}
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
                <div className="font-medium text-sm">Embeddings</div>
                <div className="text-xs text-gray-500">
                  {formData.processingStatus.embeddings ? 'Generated' : 'Generating...'}
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {formData.processingStatus.status === 'completed' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Processing Completed</div>
                <div className="text-sm text-green-600">
                  Your video has been processed and is ready for categorization
                </div>
              </div>
            </div>
          )}

          {formData.processingStatus.status === 'failed' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <div className="font-medium text-red-800">Processing Failed</div>
                  <div className="text-sm text-red-600">
                    {formData.processingStatus.error || 'An error occurred during processing'}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={retryProcessing}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Processing
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-800">Processing in Progress</div>
                <div className="text-sm text-blue-600">
                  This may take a few minutes. You can continue to the next step once completed.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}