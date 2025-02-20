// src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json
          id: string
          metadata: Json | null
          redis_id: string | null
          status: string
          synced_at: string | null
          timestamp: number
          type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details: Json
          id?: string
          metadata?: Json | null
          redis_id?: string | null
          status: string
          synced_at?: string | null
          timestamp: number
          type: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json
          id?: string
          metadata?: Json | null
          redis_id?: string | null
          status?: string
          synced_at?: string | null
          timestamp?: number
          type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_banner_roles: {
        Row: {
          banner_id: string | null
          created_at: string | null
          id: string
          role_type: string
        }
        Insert: {
          banner_id?: string | null
          created_at?: string | null
          id?: string
          role_type: string
        }
        Update: {
          banner_id?: string | null
          created_at?: string | null
          id?: string
          role_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "carousel_banner_roles_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "carousel_banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_banner_roles_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "carousel_banners_detailed"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_banners: {
        Row: {
          click_behavior: string
          created_at: string | null
          description: string | null
          end_date: string | null
          file_id: string | null
          id: string
          is_active: boolean | null
          open_in_iframe: boolean | null
          order_index: number | null
          start_date: string | null
          title: string
          updated_at: string | null
          url: string | null
          vimeo_video_id: string | null
          vimeo_video_title: string | null
        }
        Insert: {
          click_behavior: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          file_id?: string | null
          id?: string
          is_active?: boolean | null
          open_in_iframe?: boolean | null
          order_index?: number | null
          start_date?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          vimeo_video_id?: string | null
          vimeo_video_title?: string | null
        }
        Update: {
          click_behavior?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          file_id?: string | null
          id?: string
          is_active?: boolean | null
          open_in_iframe?: boolean | null
          order_index?: number | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          vimeo_video_id?: string | null
          vimeo_video_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carousel_banners_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          message: string
          path: string | null
          redis_id: string | null
          severity: string
          source: string
          stack: string | null
          synced_at: string | null
          timestamp: number
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message: string
          path?: string | null
          redis_id?: string | null
          severity: string
          source: string
          stack?: string | null
          synced_at?: string | null
          timestamp: number
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          path?: string | null
          redis_id?: string | null
          severity?: string
          source?: string
          stack?: string | null
          synced_at?: string | null
          timestamp?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profile"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          cdn_url: string
          created_at: string
          id: string
          mime_type: string
          original_filename: string
          size: number
          uploadcare_uuid: string
          user_id: string | null
        }
        Insert: {
          cdn_url: string
          created_at?: string
          id?: string
          mime_type: string
          original_filename: string
          size: number
          uploadcare_uuid: string
          user_id?: string | null
        }
        Update: {
          cdn_url?: string
          created_at?: string
          id?: string
          mime_type?: string
          original_filename?: string
          size?: number
          uploadcare_uuid?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          airtable_record_id: string
          area: string | null
          created_at: string
          department: string | null
          email: string
          first_name: string
          google_user_id: string | null
          health_dashboard: string | null
          hire_date: string | null
          id: string
          last_airtable_sync: string
          last_name: string
          phone: string | null
          profile_pic_url: string | null
          recruiting_record_id: string | null
          region: string | null
          role: string | null
          role_type: string | null
          salesforce_id: string | null
          shirt_size: string | null
          team: string | null
          updated_at: string
          user_id: string | null
          user_key: string | null
        }
        Insert: {
          airtable_record_id: string
          area?: string | null
          created_at?: string
          department?: string | null
          email: string
          first_name: string
          google_user_id?: string | null
          health_dashboard?: string | null
          hire_date?: string | null
          id?: string
          last_airtable_sync?: string
          last_name: string
          phone?: string | null
          profile_pic_url?: string | null
          recruiting_record_id?: string | null
          region?: string | null
          role?: string | null
          role_type?: string | null
          salesforce_id?: string | null
          shirt_size?: string | null
          team?: string | null
          updated_at?: string
          user_id?: string | null
          user_key?: string | null
        }
        Update: {
          airtable_record_id?: string
          area?: string | null
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string
          google_user_id?: string | null
          health_dashboard?: string | null
          hire_date?: string | null
          id?: string
          last_airtable_sync?: string
          last_name?: string
          phone?: string | null
          profile_pic_url?: string | null
          recruiting_record_id?: string | null
          region?: string | null
          role?: string | null
          role_type?: string | null
          salesforce_id?: string | null
          shirt_size?: string | null
          team?: string | null
          updated_at?: string
          user_id?: string | null
          user_key?: string | null
        }
        Relationships: []
      }
      user_recruiters: {
        Row: {
          created_at: string
          id: string
          recruiter_airtable_id: string
          user_profile_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          recruiter_airtable_id: string
          user_profile_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          recruiter_airtable_id?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recruiters_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supervisors: {
        Row: {
          created_at: string
          id: string
          supervisor_airtable_id: string
          user_profile_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          supervisor_airtable_id: string
          user_profile_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          supervisor_airtable_id?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_supervisors_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      carousel_banners_detailed: {
        Row: {
          banner_url: string | null
          click_behavior: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          file_id: string | null
          id: string | null
          is_active: boolean | null
          is_currently_active: boolean | null
          open_in_iframe: boolean | null
          order_index: number | null
          original_filename: string | null
          role_count: number | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          vimeo_video_id: string | null
          vimeo_video_title: string | null
          visible_to_roles: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carousel_banners_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_banner_currently_active: {
        Args: {
          p_is_active: boolean
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
      sync_user_profile: {
        Args: {
          p_email: string
          p_airtable_record_id: string
          p_first_name: string
          p_last_name: string
          p_role: string
          p_role_type: string
          p_team: string
          p_area: string
          p_region: string
          p_phone: string
          p_profile_pic_url: string
          p_google_user_id: string
          p_hire_date: string
          p_user_key: string
          p_recruiting_record_id: string
          p_health_dashboard: string
          p_salesforce_id: string
          p_shirt_size?: string
          p_department?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
