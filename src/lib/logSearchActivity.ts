// src/lib/logSearchActivity.ts

/**
 * Logs search activity to the document_search_logs table
 */
export async function logSearchActivity(
  supabase: any,
  userId: string,
  query: string,
  filters: Record<string, any> | null,
  resultCount: number
) {
  try {
    console.log('Logging search activity')
    
    // Get user profile ID
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    const userProfileId = userProfile?.id
    
    // Check table schema to determine correct column name
    const { data: tableInfo, error: schemaError } = await supabase
      .from('document_search_logs')
      .select('*')
      .limit(1)
    
    // Handle schema issues gracefully
    if (schemaError) {
      console.warn('Could not verify table schema, using fallback approach', schemaError)
    }
    
    // Prepare log entry - try multiple timestamp column names
    const logEntry: Record<string, any> = {
      user_id: userId,
      user_profile_id: userProfileId,
      query: query,
      filters: filters ? JSON.stringify(filters) : null,
      result_count: resultCount,
    }
    
    // Try to detect the timestamp column name from the schema or use common alternatives
    // First, add all possible timestamp formats to cover different naming conventions
    if (!schemaError && tableInfo && tableInfo.length > 0) {
      // Use column that actually exists in schema
      if ('created_at' in tableInfo[0]) {
        logEntry.created_at = new Date().toISOString()
      } else if ('timestamp' in tableInfo[0]) {
        logEntry.timestamp = new Date().toISOString()
      } else if ('search_time' in tableInfo[0]) {
        logEntry.search_time = new Date().toISOString()
      } else {
        // Fallback to all common timestamp column names
        logEntry.created_at = new Date().toISOString()
        logEntry.timestamp = new Date().toISOString() 
        logEntry.search_time = new Date().toISOString()
      }
    } else {
      // Fallback if we couldn't check schema
      logEntry.created_at = new Date().toISOString()
      logEntry.timestamp = new Date().toISOString()
      logEntry.search_time = new Date().toISOString()
    }
    
    // Log the search
    const { error: logError } = await supabase
      .from('document_search_logs')
      .insert(logEntry)
    
    if (logError) {
      // Don't spam console with the same error repeatedly
      console.warn('Failed to log search activity, disabling further logging', logError.message)
      
      // Create a temporary no-op function to replace this function
      // This prevents further logging attempts in this session
      // @ts-ignore - intentionally replacing the function
      logSearchActivity = async () => { /* no-op */ }
    } else {
      console.log('Search activity logged successfully')
    }
  } catch (logError) {
    // Catch and log any errors without failing the main request
    console.warn('Error in search activity logging:', logError)
    
    // Disable further logging to prevent infinite errors
    // @ts-ignore - intentionally replacing the function
    logSearchActivity = async () => { /* no-op */ }
  }
} 