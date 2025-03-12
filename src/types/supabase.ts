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
          area: string | null
          banner_id: string | null
          created_at: string | null
          id: string
          region: string | null
          role_type: string
          team: string | null
        }
        Insert: {
          area?: string | null
          banner_id?: string | null
          created_at?: string | null
          id?: string
          region?: string | null
          role_type: string
          team?: string | null
        }
        Update: {
          area?: string | null
          banner_id?: string | null
          created_at?: string | null
          id?: string
          region?: string | null
          role_type?: string
          team?: string | null
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
      dashboard_drafts: {
        Row: {
          created_at: string | null
          created_by: string | null
          dashboard_id: string
          description: string | null
          id: string
          is_current: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dashboard_id: string
          description?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dashboard_id?: string
          description?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_drafts_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          dashboard_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          scheduled_publish_date: string | null
          status: string
          updated_at: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dashboard_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          scheduled_publish_date?: string | null
          status: string
          updated_at?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dashboard_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          scheduled_publish_date?: string | null
          status?: string
          updated_at?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_versions_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          role_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          role_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      draft_widget_placements: {
        Row: {
          created_at: string | null
          created_by: string | null
          draft_id: string
          height: number
          id: string
          layout_type: string
          position_x: number
          position_y: number
          widget_id: string
          width: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          draft_id: string
          height: number
          id?: string
          layout_type: string
          position_x: number
          position_y: number
          widget_id: string
          width: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          draft_id?: string
          height?: number
          id?: string
          layout_type?: string
          position_x?: number
          position_y?: number
          widget_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "draft_widget_placements_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "dashboard_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_widget_placements_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
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
      navigation_analytics: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          navigation_item_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          navigation_item_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          navigation_item_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_analytics_navigation_item_id_fkey"
            columns: ["navigation_item_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_analytics_navigation_item_id_fkey"
            columns: ["navigation_item_id"]
            isOneToOne: false
            referencedRelation: "navigation_items_active"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_item_roles: {
        Row: {
          area: string | null
          created_at: string | null
          id: string
          navigation_item_id: string | null
          region: string | null
          role_type: string
          team: string | null
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          id?: string
          navigation_item_id?: string | null
          region?: string | null
          role_type: string
          team?: string | null
        }
        Update: {
          area?: string | null
          created_at?: string | null
          id?: string
          navigation_item_id?: string | null
          region?: string | null
          role_type?: string
          team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_item_roles_navigation_item_id_fkey"
            columns: ["navigation_item_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_item_roles_navigation_item_id_fkey"
            columns: ["navigation_item_id"]
            isOneToOne: false
            referencedRelation: "navigation_items_active"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          dynamic_variables: Json | null
          end_date: string | null
          id: string
          is_active: boolean | null
          is_external: boolean | null
          is_public: boolean | null
          menu_id: string | null
          open_in_iframe: boolean | null
          order_index: number
          parent_id: string | null
          start_date: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dynamic_variables?: Json | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          is_public?: boolean | null
          menu_id?: string | null
          open_in_iframe?: boolean | null
          order_index: number
          parent_id?: string | null
          start_date?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          dynamic_variables?: Json | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          is_public?: boolean | null
          menu_id?: string | null
          open_in_iframe?: boolean | null
          order_index?: number
          parent_id?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "navigation_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items_active"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_menus: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_menus_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thumbnails: {
        Row: {
          created_at: string | null
          id: string
          uploadcare_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          uploadcare_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          uploadcare_url?: string
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
      widget_analytics: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
          widget_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
          widget_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_analytics_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          position: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      widget_configurations: {
        Row: {
          config: Json
          created_at: string | null
          created_by: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          widget_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          widget_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_configurations_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_placements: {
        Row: {
          created_at: string | null
          height: number
          id: string
          layout_type: string
          position_x: number
          position_y: number
          version_id: string
          widget_id: string
          width: number
        }
        Insert: {
          created_at?: string | null
          height: number
          id?: string
          layout_type: string
          position_x: number
          position_y: number
          version_id: string
          widget_id: string
          width: number
        }
        Update: {
          created_at?: string | null
          height?: number
          id?: string
          layout_type?: string
          position_x?: number
          position_y?: number
          version_id?: string
          widget_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "widget_placements_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dashboard_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_placements_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          category_id: string | null
          component_path: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_type: string | null
          file_id: string | null
          id: string
          is_active: boolean
          is_published: boolean
          name: string
          public: boolean
          shape: string
          size_ratio: string
          thumbnail_url: string | null
          updated_at: string | null
          widget_type: string
        }
        Insert: {
          category_id?: string | null
          component_path?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_type?: string | null
          file_id?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          name: string
          public?: boolean
          shape: string
          size_ratio: string
          thumbnail_url?: string | null
          updated_at?: string | null
          widget_type: string
        }
        Update: {
          category_id?: string | null
          component_path?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_type?: string | null
          file_id?: string | null
          id?: string
          is_active?: boolean
          is_published?: boolean
          name?: string
          public?: boolean
          shape?: string
          size_ratio?: string
          thumbnail_url?: string | null
          updated_at?: string | null
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "widgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "widget_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widgets_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
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
          role_details: Json | null
          role_ids: string[] | null
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
      navigation_items_active: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          dynamic_variables: Json | null
          end_date: string | null
          id: string | null
          is_active: boolean | null
          is_currently_active: boolean | null
          is_external: boolean | null
          is_public: boolean | null
          menu_id: string | null
          open_in_iframe: boolean | null
          order_index: number | null
          parent_id: string | null
          role_details: Json | null
          role_ids: string[] | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          visible_to_roles: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "navigation_menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "navigation_items_active"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_navigation_for_user: {
        Args: {
          p_user_id: string
          p_role_type?: string
          p_team?: string
          p_area?: string
          p_region?: string
        }
        Returns: {
          id: string
          menu_id: string
          parent_id: string
          title: string
          url: string
          description: string
          is_external: boolean
          open_in_iframe: boolean
          order_index: number
          level: number
        }[]
      }
      get_organization_structure: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_carousel_banners: {
        Args: {
          user_role_type: string
          user_team: string
          user_area: string
          user_region: string
        }
        Returns: {
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
          role_details: Json | null
          role_ids: string[] | null
          start_date: string | null
          title: string | null
          updated_at: string | null
          url: string | null
          vimeo_video_id: string | null
          vimeo_video_title: string | null
          visible_to_roles: string | null
        }[]
      }
      get_user_dashboard: {
        Args: {
          user_role_type: string
        }
        Returns: {
          id: string
          name: string
          description: string
          role_type: string
          version_id: string
          version_number: number
          version_name: string
          widgets: Json
        }[]
      }
      get_user_navigation_items: {
        Args: {
          user_role_type: string
          user_team: string
          user_area: string
          user_region: string
        }
        Returns: {
          id: string
          menu_id: string
          parent_id: string
          title: string
          url: string
          description: string
          dynamic_variables: Json
          is_external: boolean
          open_in_iframe: boolean
          order_index: number
          is_active: boolean
          is_public: boolean
          start_date: string
          end_date: string
          created_at: string
          updated_at: string
          created_by: string
          is_currently_active: boolean
          visible_to_roles: string
          role_ids: string[]
          role_details: Json
          depth: number
          path: string[]
        }[]
      }
      is_banner_currently_active: {
        Args: {
          p_is_active: boolean
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
      is_navigation_item_currently_active: {
        Args: {
          p_is_active: boolean
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
      log_navigation_interaction: {
        Args: {
          p_navigation_item_id: string
          p_user_id: string
          p_interaction_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      matches_user_criteria: {
        Args: {
          role_details: Json
          user_role_type: string
          user_team: string
          user_area: string
          user_region: string
        }
        Returns: boolean
      }
      set_widget_configuration: {
        Args: {
          p_widget_id: string
          p_config: Json
          p_created_by?: string
        }
        Returns: Json
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
