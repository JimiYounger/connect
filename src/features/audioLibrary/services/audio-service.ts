import { createClient } from '@/lib/supabase-server'

/**
 * Fetches audio series options for the dropdown in the upload form
 * @returns Array of options with label and value for each audio series
 */
export async function getAudioSeriesOptions() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('audio_series')
    .select('id, name')
    .order('name')
  
  if (error) {
    console.error('Error fetching audio series:', error)
    return []
  }
  
  return data.map(series => ({
    label: series.name,
    value: series.id
  }))
}