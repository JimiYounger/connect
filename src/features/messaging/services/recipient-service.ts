import { createClient } from '@/lib/supabase';
import { 
  OrganizationFilter, 
  Recipient 
} from '../types';
import type { OrganizationStructure } from '@/features/organization/types';
import type { UserProfile } from '@/features/users/types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * RecipientService class for handling recipient selection and filtering
 */
export class RecipientService {
  /**
   * Fetches recipients based on organization filters
   */
  async getRecipientsByFilter(
    filter: OrganizationFilter,
    limit?: number,
    offset?: number
  ): Promise<{ recipients: Recipient[]; totalCount: number }> {
    try {
      // Start building the query
      let query = createClient()
        .from('user_profiles')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (filter.roleType) {
        query = query.eq('role_type', filter.roleType);
      }
      
      if (filter.team) {
        query = query.eq('team', filter.team);
      }
      
      if (filter.area) {
        query = query.eq('area', filter.area);
      }
      
      if (filter.region) {
        query = query.eq('region', filter.region);
      }
      
      // Only include users with phone numbers
      query = query.not('phone', 'is', null);
      
      // Apply pagination if provided
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      
      if (offset !== undefined) {
        query = query.range(offset, offset + (limit || 10) - 1);
      }
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch recipients: ${error.message}`);
      }
      
      // Get opted-out users to filter them out
      const { data: optedOutUsers, error: optedOutError } = await createClient()
        .from('user_message_preferences')
        .select('user_id')
        .eq('opted_out', true);
        
      if (optedOutError) {
        console.error('Error fetching opted-out users:', optedOutError);
      }
      
      const optedOutIds = new Set(optedOutUsers?.map(user => user.user_id) || []);
      
      // Map to Recipient interface and filter out opted-out users
      const recipients = (data || [])
        .filter(user => !optedOutIds.has(user.id))
        .map(user => this.mapUserProfileToRecipient(user));
      
      return { 
        recipients, 
        totalCount: (count || 0) - optedOutIds.size 
      };
    } catch (error) {
      console.error('Error fetching recipients by filter:', error);
      throw error;
    }
  }
  
  /**
   * Get a preview of recipients based on filter criteria
   */
  async getRecipientsPreview(
    filter: OrganizationFilter,
    limit: number = 500
  ): Promise<{ recipients: Recipient[], totalCount: number }> {
    console.log('[RecipientService] Getting recipients preview with filter:', JSON.stringify(filter, null, 2));
    
    try {
      // Initialize Supabase client
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );
      
      // Start building the query
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' });
      
      // Apply filters
      query = this.applyFilters(query, filter);
      
      // First get the total count
      let countQuery = supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      // Apply the same filters to the count query
      countQuery = this.applyFilters(countQuery, filter);
      
      // Get the count
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error('[RecipientService] Error counting recipients:', countError);
        throw new Error(`Failed to count recipients: ${countError.message}`);
      }
      
      console.log(`[RecipientService] Total count before pagination: ${totalCount}`);
      
      // Now get the actual recipients with limit
      const { data, error } = await query
        .limit(limit)
        .order('last_name', { ascending: true });
      
      if (error) {
        console.error('[RecipientService] Error fetching recipients:', error);
        throw new Error(`Failed to fetch recipients: ${error.message}`);
      }
      
      // Map the data to the Recipient type
      const recipients = (data || []).map(profile => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone || '',
        roleType: profile.role_type || '',
        team: profile.team || undefined,
        area: profile.area || undefined,
        region: profile.region || undefined,
        optedOut: false, // TODO: Implement opt-out functionality
        avatarUrl: profile.profile_pic_url || undefined
      }));
      
      console.log(`[RecipientService] Returning ${recipients.length} recipients out of ${totalCount} total`);
      
      return {
        recipients,
        totalCount: totalCount || 0
      };
    } catch (error) {
      console.error('[RecipientService] Error in getRecipientsPreview:', error);
      throw error;
    }
  }
  
  /**
   * Get the count of recipients based on filter criteria
   */
  async getRecipientCount(filter: OrganizationFilter): Promise<number> {
    console.log('[RecipientService] Getting recipient count with filter:', JSON.stringify(filter, null, 2));
    
    try {
      // Initialize Supabase client
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );
      
      // Start building the query
      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      // Apply filters
      query = this.applyFilters(query, filter);
      
      // Get count
      const { count, error } = await query;
      
      if (error) {
        console.error('[RecipientService] Error counting recipients:', error);
        throw new Error(`Failed to count recipients: ${error.message}`);
      }
      
      console.log(`[RecipientService] Total count: ${count}`);
      
      return count || 0;
    } catch (error) {
      console.error('[RecipientService] Error in getRecipientCount:', error);
      throw error;
    }
  }
  
  /**
   * Apply filters to a Supabase query
   * @private
   */
  private applyFilters(query: any, filter: OrganizationFilter): any {
    console.log('[RecipientService] Applying filters:', JSON.stringify(filter, null, 2));
    
    // Apply role type filter - handle both legacy and new format
    if (Array.isArray(filter.roleTypes) && filter.roleTypes.length > 0) {
      // Check if "all" is selected (all role types)
      const includesAll = filter.roleTypes.includes("all");
      if (!includesAll) {
        query = query.in('role_type', filter.roleTypes);
        console.log(`[RecipientService] Applied role_type filter: ${filter.roleTypes.join(', ')}`);
      } else {
        console.log('[RecipientService] All role types selected, not applying role_type filter');
      }
    } else if (filter.roleType) {
      // Handle legacy single value filter
      if (filter.roleType !== "all") {
        query = query.eq('role_type', filter.roleType);
        console.log(`[RecipientService] Applied legacy role_type filter: ${filter.roleType}`);
      }
    }
    
    // Apply team filter - handle both legacy and new format
    if (Array.isArray(filter.teams) && filter.teams.length > 0) {
      // Check if "all" is selected (all teams)
      const includesAll = filter.teams.includes("all");
      if (!includesAll) {
        query = query.in('team', filter.teams);
        console.log(`[RecipientService] Applied team filter: ${filter.teams.join(', ')}`);
      } else {
        console.log('[RecipientService] All teams selected, not applying team filter');
      }
    } else if (filter.team) {
      // Handle legacy single value filter
      if (filter.team !== "all") {
        query = query.eq('team', filter.team);
        console.log(`[RecipientService] Applied legacy team filter: ${filter.team}`);
      }
    }
    
    // Apply area filter - handle both legacy and new format
    if (Array.isArray(filter.areas) && filter.areas.length > 0) {
      // Check if "all" is selected (all areas)
      const includesAll = filter.areas.includes("all");
      if (!includesAll) {
        query = query.in('area', filter.areas);
        console.log(`[RecipientService] Applied area filter: ${filter.areas.join(', ')}`);
      } else {
        console.log('[RecipientService] All areas selected, not applying area filter');
      }
    } else if (filter.area) {
      // Handle legacy single value filter
      if (filter.area !== "all") {
        query = query.eq('area', filter.area);
        console.log(`[RecipientService] Applied legacy area filter: ${filter.area}`);
      }
    }
    
    // Apply region filter - handle both legacy and new format
    if (Array.isArray(filter.regions) && filter.regions.length > 0) {
      // Check if "all" is selected (all regions)
      const includesAll = filter.regions.includes("all");
      if (!includesAll) {
        query = query.in('region', filter.regions);
        console.log(`[RecipientService] Applied region filter: ${filter.regions.join(', ')}`);
      } else {
        console.log('[RecipientService] All regions selected, not applying region filter');
      }
    } else if (filter.region) {
      // Handle legacy single value filter
      if (filter.region !== "all") {
        query = query.eq('region', filter.region);
        console.log(`[RecipientService] Applied legacy region filter: ${filter.region}`);
      }
    }
    
    // Only include profiles with a phone number
    query = query.not('phone', 'is', null);
    console.log('[RecipientService] Applied phone not null filter');
    
    return query;
  }
  
  /**
   * Checks if a user has opted out of messages
   */
  async hasUserOptedOut(userId: string): Promise<boolean> {
    try {
      const { data, error } = await createClient()
        .from('user_message_preferences')
        .select('opted_out')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          return false; // Default to not opted out if no record exists
        }
        throw new Error(`Failed to check opt-out status: ${error.message}`);
      }
      
      return data?.opted_out || false;
    } catch (error) {
      console.error('Error checking user opt-out status:', error);
      return false; // Default to not opted out in case of error
    }
  }
  
  /**
   * Gets all available filter options from the organization structure
   */
  async getFilterOptions(): Promise<OrganizationStructure> {
    try {
      const response = await fetch('/api/organization-structure');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organization structure: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Return default empty structure
      return {
        roleTypes: [],
        teams: [],
        areas: [],
        regions: []
      };
    }
  }
  
  /**
   * Gets a single recipient by ID
   */
  async getRecipientById(userId: string): Promise<Recipient | null> {
    try {
      const { data, error } = await createClient()
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw new Error(`Failed to fetch recipient: ${error.message}`);
      }
      
      if (!data) {
        return null;
      }
      
      return this.mapUserProfileToRecipient(data);
    } catch (error) {
      console.error('Error fetching recipient by ID:', error);
      return null;
    }
  }
  
  /**
   * Gets recipients by their IDs
   */
  async getRecipientsByIds(userIds: string[]): Promise<Recipient[]> {
    if (!userIds.length) {
      return [];
    }
    
    try {
      const { data, error } = await createClient()
        .from('user_profiles')
        .select('*')
        .in('id', userIds);
        
      if (error) {
        throw new Error(`Failed to fetch recipients by IDs: ${error.message}`);
      }
      
      return (data || []).map(user => this.mapUserProfileToRecipient(user));
    } catch (error) {
      console.error('Error fetching recipients by IDs:', error);
      return [];
    }
  }
  
  /**
   * Validates a list of recipients to ensure they can receive messages
   * Returns filtered list with only valid recipients
   */
  async validateRecipients(recipients: Recipient[]): Promise<{
    validRecipients: Recipient[];
    invalidRecipients: Array<{ recipient: Recipient; reason: string }>;
  }> {
    try {
      // Get all opted-out users
      const { data: optedOutUsers, error: optedOutError } = await createClient()
        .from('user_message_preferences')
        .select('user_id')
        .eq('opted_out', true);
        
      if (optedOutError) {
        console.error('Error fetching opted-out users:', optedOutError);
      }
      
      const optedOutIds = new Set(optedOutUsers?.map(user => user.user_id) || []);
      
      const validRecipients: Recipient[] = [];
      const invalidRecipients: Array<{ recipient: Recipient; reason: string }> = [];
      
      // Validate each recipient
      recipients.forEach(recipient => {
        if (!recipient.phone) {
          invalidRecipients.push({ 
            recipient, 
            reason: 'Missing phone number' 
          });
        } else if (optedOutIds.has(recipient.id)) {
          invalidRecipients.push({ 
            recipient, 
            reason: 'User has opted out of messages' 
          });
        } else {
          validRecipients.push(recipient);
        }
      });
      
      return { validRecipients, invalidRecipients };
    } catch (error) {
      console.error('Error validating recipients:', error);
      return { 
        validRecipients: recipients, 
        invalidRecipients: [] 
      };
    }
  }

  /**
   * Gets recipients by role type
   */
  async getRecipientsByRoleType(roleType: string): Promise<Recipient[]> {
    try {
      const { recipients } = await this.getRecipientsByFilter({ roleType });
      return recipients;
    } catch (error) {
      console.error('Error fetching recipients by role type:', error);
      return [];
    }
  }

  /**
   * Gets recipients by team
   */
  async getRecipientsByTeam(team: string): Promise<Recipient[]> {
    try {
      const { recipients } = await this.getRecipientsByFilter({ team });
      return recipients;
    } catch (error) {
      console.error('Error fetching recipients by team:', error);
      return [];
    }
  }

  /**
   * Gets recipients by area
   */
  async getRecipientsByArea(area: string): Promise<Recipient[]> {
    try {
      const { recipients } = await this.getRecipientsByFilter({ area });
      return recipients;
    } catch (error) {
      console.error('Error fetching recipients by area:', error);
      return [];
    }
  }

  /**
   * Gets recipients by region
   */
  async getRecipientsByRegion(region: string): Promise<Recipient[]> {
    try {
      const { recipients } = await this.getRecipientsByFilter({ region });
      return recipients;
    } catch (error) {
      console.error('Error fetching recipients by region:', error);
      return [];
    }
  }

  /**
   * Maps a UserProfile to a Recipient
   */
  private mapUserProfileToRecipient(profile: UserProfile): Recipient {
    // Ensure we have a valid ID - use user_id as fallback or generate a placeholder
    const id = profile.id || profile.user_id || `temp-${Date.now()}`;
    
    return {
      id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      roleType: profile.role_type,
      team: profile.team,
      area: profile.area,
      region: profile.region
    };
  }

  /**
   * Converts the current user profile to a recipient
   */
  convertProfileToRecipient(profile: UserProfile): Recipient {
    return this.mapUserProfileToRecipient(profile);
  }
}

// Export a singleton instance for use throughout the application
export const recipientService = new RecipientService();

// Export a hook-compatible function for client components
export async function getOrganizationFilterOptions(): Promise<OrganizationStructure> {
  return recipientService.getFilterOptions();
} 