'use client'

import { useState, useCallback } from 'react'
import { vimeoClient } from '../utils/vimeoClient'

export function VimeoUploader() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedVideoUri, setUploadedVideoUri] = useState<string | null>(null)

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)
      setUploadedVideoUri(null)

      const uri = await vimeoClient.uploadVideo(file, (progress) => {
        setProgress(progress)
      })
      
      setUploadedVideoUri(uri)
      console.log('Upload complete:', uri)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }, [])

  return (
    <div className="w-full">
      <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
        uploading ? 'border-blue-300' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <svg
            className={`w-12 h-12 mb-3 ${uploading ? 'text-blue-400' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h3m11 0h4M3 12h18M3 16h3m11 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <p className="text-sm text-gray-600">
            {uploading ? 'Uploading...' : 'Click to upload a video or drag and drop'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: MP4, WebM, MOV
          </p>
        </label>
      </div>

      {(uploading || progress > 0) && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {progress.toFixed(1)}% uploaded
          </p>
        </div>
      )}

      {uploadedVideoUri && (
        <p className="mt-4 text-sm text-green-600 text-center">
          Video uploaded successfully!
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500">
          Error: {error}
        </p>
      )}
    </div>
  )
}