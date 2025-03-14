import { createClient } from '@supabase/supabase-js';
import { 
  OrganizationFilter, 
  Recipient 
} from '../types';
import { Database } from '@/types/supabase';
import type { OrganizationStructure } from '@/features/organization/types';
import type { UserProfile } from '@/features/users/types';

// Initialize Supabase client for client-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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
      let query = supabase
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
      const { data: optedOutUsers, error: optedOutError } = await supabase
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
   * Gets a preview list of recipients (limited number for UI display)
   */
  async getRecipientsPreview(
    filter: OrganizationFilter,
    previewLimit = 10
  ): Promise<{ recipients: Recipient[]; totalCount: number }> {
    return this.getRecipientsByFilter(filter, previewLimit, 0);
  }
  
  /**
   * Checks if a user has opted out of messages
   */
  async hasUserOptedOut(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
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
   * Gets a count of recipients matching the filter criteria
   */
  async getRecipientCount(filter: OrganizationFilter): Promise<number> {
    try {
      const { totalCount } = await this.getRecipientsByFilter(filter, 1, 0);
      return totalCount;
    } catch (error) {
      console.error('Error getting recipient count:', error);
      return 0;
    }
  }
  
  /**
   * Gets a single recipient by ID
   */
  async getRecipientById(userId: string): Promise<Recipient | null> {
    try {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data: optedOutUsers, error: optedOutError } = await supabase
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