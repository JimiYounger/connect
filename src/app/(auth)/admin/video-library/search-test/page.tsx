'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Play, Clock, Zap, ArrowLeft, SkipForward } from 'lucide-react'
import Link from 'next/link'
import { VideoPlayerModal } from '@/features/videoLibrary/components/VideoPlayerModal'

interface SearchResult {
  id: string
  title: string
  description?: string
  vimeo_id?: string
  vimeo_duration?: number
  vimeo_thumbnail_url?: string
  similarity: number
  highlight: string
  matching_chunks: {
    chunk_index: number
    content: string
    similarity: number
    timestamp_start?: number
    timestamp_end?: number
  }[]
}

export default function VideoSearchTestPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchStats, setSearchStats] = useState<{
    total: number
    query: string
    match_threshold: number
    match_count: number
  } | null>(null)
  const [threshold, _setThreshold] = useState(0.3)
  const [selectedVideo, setSelectedVideo] = useState<{
    video: SearchResult
    startTime?: number
    highlight?: string
  } | null>(null)

  const performSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/video-library/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          match_threshold: threshold,
          match_count: 20,
          log_search: true
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setResults(data.results || [])
        setSearchStats({
          total: data.total,
          query: data.query,
          match_threshold: data.match_threshold,
          match_count: data.match_count
        })
        setError(null)
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const openVideoModal = (video: SearchResult, startTime?: number, highlight?: string) => {
    setSelectedVideo({ video, startTime, highlight })
  }

  const closeVideoModal = () => {
    setSelectedVideo(null)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/video-library">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Video Library
          </Link>
        </Button>
      </div>
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Video Search</h1>
        <p className="text-gray-600">Search through video content using natural language</p>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            AI Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Try: 'solar efficiency', 'battery storage', 'homeowner benefits'..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={performSearch} 
                disabled={loading || !query.trim()}
                size="lg"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Search Stats */}
      {searchStats && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="font-medium">Query:</span> &quot;{searchStats.query}&quot;
              </div>
              <div>
                <span className="font-medium">Results:</span> {searchStats.total}
              </div>
              <div>
                <span className="font-medium">Threshold:</span> {Math.round(searchStats.match_threshold * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching with AI...</p>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results</h2>
          
          {results.map((result, _index) => (
            <Card key={result.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Video Header */}
                  <div className="flex gap-4">
                    {result.vimeo_thumbnail_url ? (
                      <Image
                        src={result.vimeo_thumbnail_url}
                        alt={result.title}
                        width={128}
                        height={80}
                        className="w-32 h-20 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-32 h-20 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                        <Play className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-2">{result.title}</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">
                          {Math.round(result.similarity * 100)}% match
                        </Badge>
                      </div>
                      
                      {result.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(result.vimeo_duration)}</span>
                        </div>
                        {result.vimeo_id && (
                          <div>
                            <span>Vimeo ID: {result.vimeo_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openVideoModal(result, undefined, result.highlight)}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Video
                    </Button>
                    
                    {result.matching_chunks && result.matching_chunks.length > 0 && (
                      <Button 
                        variant="outline"
                        onClick={() => openVideoModal(
                          result, 
                          result.matching_chunks[0].timestamp_start,
                          result.matching_chunks[0].content
                        )}
                        className="flex-1"
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        Play from Match
                      </Button>
                    )}
                  </div>

                  {/* Best Match Highlight */}
                  {result.highlight && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Best Match:</p>
                      <p className="text-sm text-yellow-700 italic">&quot;{result.highlight}&quot;</p>
                    </div>
                  )}

                  {/* Matching Chunks */}
                  {result.matching_chunks && result.matching_chunks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Found in {result.matching_chunks.length} segment{result.matching_chunks.length > 1 ? 's' : ''}:
                      </p>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {result.matching_chunks.slice(0, 3).map((chunk, chunkIndex) => (
                          <div key={chunkIndex} className="p-2 bg-gray-50 rounded-md text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-600">
                                Segment #{chunk.chunk_index + 1}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(chunk.similarity * 100)}% match
                                </Badge>
                                {chunk.timestamp_start && (
                                  <span>@ {formatTimestamp(chunk.timestamp_start)}</span>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700">&quot;{chunk.content}&quot;</p>
                          </div>
                        ))}
                        
                        {result.matching_chunks.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            ... and {result.matching_chunks.length - 3} more segments
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && searchStats && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or using different keywords.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sample Queries */}
      {!searchStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sample Queries to Try</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'solar efficiency optimization',
                'battery storage benefits',
                'homeowner energy savings',
                'solar panel installation',
                'utility incentives',
                'energy production maximization'
              ].map((sampleQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto p-3"
                  onClick={() => setQuery(sampleQuery)}
                >
                  <Search className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{sampleQuery}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={!!selectedVideo}
          onClose={closeVideoModal}
          video={{
            id: selectedVideo.video.id,
            title: selectedVideo.video.title,
            description: selectedVideo.video.description,
            vimeo_id: selectedVideo.video.vimeo_id,
            vimeo_duration: selectedVideo.video.vimeo_duration,
            vimeo_thumbnail_url: selectedVideo.video.vimeo_thumbnail_url
          }}
          startTime={selectedVideo.startTime}
          highlight={selectedVideo.highlight}
        />
      )}
    </div>
  )
}