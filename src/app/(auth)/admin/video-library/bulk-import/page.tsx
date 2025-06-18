'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  FileText,
  Play,
  BarChart3
} from 'lucide-react'

interface VideoImportRow {
  vimeo_url: string
  category_name: string
  subcategory_name?: string
  thumbnail_url?: string
}

interface ProcessingResult {
  vimeo_url: string
  status: 'success' | 'error'
  error?: string
  video_id?: string
  title?: string
}

interface ProcessingSummary {
  total: number
  successful: number
  failed: number
}

export default function BulkImportPage() {
  const [csvData, setCsvData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentVideo, setCurrentVideo] = useState('')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ProcessingResult[]>([])
  const [summary, setSummary] = useState<ProcessingSummary | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const sampleCsv = `vimeo_url,category_name,subcategory_name,thumbnail_url
https://vimeo.com/123456789,Training,Onboarding,https://example.com/custom-thumb1.jpg
https://vimeo.com/987654321,Tutorials,Advanced,
https://vimeo.com/555666777,Marketing,,https://example.com/custom-thumb2.jpg`

  const parseCsvData = (csvText: string): VideoImportRow[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const header = lines[0].toLowerCase()
    if (!header.includes('vimeo_url') || !header.includes('category_name')) {
      throw new Error('CSV must include vimeo_url and category_name columns')
    }

    // Detect delimiter - check if first line has tabs (Excel copy/paste) or commas
    const delimiter = lines[0].includes('\t') ? '\t' : ','

    const videos: VideoImportRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(delimiter).map(p => p.trim())
      if (parts.length < 2) {
        throw new Error(`Row ${i + 1}: Invalid format - expected at least 2 columns separated by ${delimiter === '\t' ? 'tabs' : 'commas'}`)
      }

      const [vimeo_url, category_name, subcategory_name, thumbnail_url] = parts
      if (!vimeo_url || !category_name) {
        throw new Error(`Row ${i + 1}: Missing required fields`)
      }

      videos.push({
        vimeo_url,
        category_name,
        subcategory_name: subcategory_name || undefined,
        thumbnail_url: thumbnail_url || undefined
      })
    }

    return videos
  }

  const handleBulkImport = async () => {
    try {
      setIsProcessing(true)
      setResults([])
      setSummary(null)
      setErrors([])
      setProgress(0)
      setCurrentVideo('')

      const videos = parseCsvData(csvData)
      if (videos.length === 0) {
        throw new Error('No valid video rows found in CSV')
      }

      setCurrentVideo('Starting bulk import...')

      const response = await fetch('/api/admin/video-library/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videos })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process bulk import')
      }

      const data = await response.json()
      setResults(data.results)
      setSummary(data.summary)
      setProgress(100)
      setCurrentVideo('Bulk import completed!')

    } catch (error) {
      console.error('Bulk import error:', error)
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred'])
    } finally {
      setIsProcessing(false)
    }
  }

  const retryFailedVideo = async (result: ProcessingResult) => {
    try {
      const video = {
        vimeo_url: result.vimeo_url,
        category_name: 'Retry', // You might want to store original category
        subcategory_name: undefined,
        thumbnail_url: undefined
      }

      const response = await fetch('/api/admin/video-library/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videos: [video] })
      })

      if (response.ok) {
        const data = await response.json()
        // Update the specific result in our results array
        setResults(prev => prev.map(r => 
          r.vimeo_url === result.vimeo_url ? data.results[0] : r
        ))
      }
    } catch (error) {
      console.error('Retry failed:', error)
    }
  }

  const downloadResults = () => {
    const csvContent = [
      'vimeo_url,status,title,error',
      ...results.map(r => 
        `"${r.vimeo_url}","${r.status}","${r.title || ''}","${r.error || ''}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-import-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Video Import</h1>
          <p className="text-muted-foreground mt-2">
            Import multiple videos from Vimeo using a CSV file
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Format Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your data should have the following columns. You can copy/paste directly from Excel or use CSV format:
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
            <li><strong>vimeo_url</strong> - Full Vimeo URL (required)</li>
            <li><strong>category_name</strong> - Category name (will be created if doesn&apos;t exist)</li>
            <li><strong>subcategory_name</strong> - Subcategory name (optional, will be created if doesn&apos;t exist)</li>
            <li><strong>thumbnail_url</strong> - Custom thumbnail URL (optional, uses Vimeo thumbnail if empty)</li>
          </ul>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 font-medium">💡 Pro Tip:</p>
            <p className="text-xs text-blue-700 mt-1">
              You can copy data directly from Excel and paste it here - no need to convert to CSV format!
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Sample CSV:</p>
            <pre className="text-xs font-mono">{sampleCsv}</pre>
          </div>
        </CardContent>
      </Card>

      {/* CSV Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Data Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Paste your CSV data here..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleBulkImport}
              disabled={!csvData.trim() || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isProcessing ? 'Processing...' : 'Start Bulk Import'}
            </Button>
            
            {results.length > 0 && (
              <Button 
                variant="outline" 
                onClick={downloadResults}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing videos...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              {currentVideo && (
                <p className="text-sm text-muted-foreground">{currentVideo}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Import Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Videos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {result.title || result.vimeo_url}
                      </div>
                      {result.error && (
                        <div className="text-sm text-red-600 truncate">
                          {result.error}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground truncate">
                        {result.vimeo_url}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                    
                    {result.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryFailedVideo(result)}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}