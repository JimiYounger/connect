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
      bulk_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_segments: number | null
          query_parameters: Json
          sender_id: string
          template_variables: Json | null
          total_recipients: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_segments?: number | null
          query_parameters: Json
          sender_id: string
          template_variables?: Json | null
          total_recipients?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_segments?: number | null
          query_parameters?: Json
          sender_id?: string
          template_variables?: Json | null
          total_recipients?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_messages_sender_id_fkey"
            columns: ["sender_id"]
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
      document_categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_content: {
        Row: {
          content: string
          created_at: string | null
          document_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_content_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_index: number | null
          content: string | null
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          chunk_index?: number | null
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_subcategories: {
        Row: {
          created_at: string | null
          description: string | null
          document_category_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_category_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_category_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_subcategories_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tag_assignments: {
        Row: {
          document_id: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          document_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          document_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_tag_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "document_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          document_id: string | null
          file_path: string
          file_type: string
          id: string
          uploaded_at: string | null
          version_label: string | null
        }
        Insert: {
          document_id?: string | null
          file_path: string
          file_type: string
          id?: string
          uploaded_at?: string | null
          version_label?: string | null
        }
        Update: {
          document_id?: string | null
          file_path?: string
          file_type?: string
          id?: string
          uploaded_at?: string | null
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_visibility: {
        Row: {
          conditions: Json
          document_id: string | null
          id: string
        }
        Insert: {
          conditions?: Json
          document_id?: string | null
          id?: string
        }
        Update: {
          conditions?: Json
          document_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_visibility_document_id_fkey1"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          current_version_id: string | null
          description: string | null
          document_category_id: string | null
          document_subcategory_id: string | null
          id: string
          subcategory_id: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          current_version_id?: string | null
          description?: string | null
          document_category_id?: string | null
          document_subcategory_id?: string | null
          id?: string
          subcategory_id?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          current_version_id?: string | null
          description?: string | null
          document_category_id?: string | null
          document_subcategory_id?: string | null
          id?: string
          subcategory_id?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_category_id_fkey"
            columns: ["document_category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_subcategory_id_fkey"
            columns: ["document_subcategory_id"]
            isOneToOne: false
            referencedRelation: "document_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "document_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      messages: {
        Row: {
          bulk_message_id: string | null
          content: string
          created_at: string
          error_message: string | null
          id: string
          is_outbound: boolean
          message_segments: number | null
          read_at: string | null
          recipient_id: string
          sender_id: string
          status: string | null
          twilio_sid: string | null
          updated_at: string
        }
        Insert: {
          bulk_message_id?: string | null
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_outbound: boolean
          message_segments?: number | null
          read_at?: string | null
          recipient_id: string
          sender_id: string
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string
        }
        Update: {
          bulk_message_id?: string | null
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_outbound?: boolean
          message_segments?: number | null
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string | null
          twilio_sid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_bulk_message_id_fkey"
            columns: ["bulk_message_id"]
            isOneToOne: false
            referencedRelation: "bulk_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_message_preferences: {
        Row: {
          opted_out: boolean
          opted_out_at: string | null
          user_id: string
        }
        Insert: {
          opted_out?: boolean
          opted_out_at?: string | null
          user_id: string
        }
        Update: {
          opted_out?: boolean
          opted_out_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_message_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
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
        Args: { user_role_type: string }
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
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_banner_currently_active: {
        Args: { p_is_active: boolean; p_start_date: string; p_end_date: string }
        Returns: boolean
      }
      is_navigation_item_currently_active: {
        Args: { p_is_active: boolean; p_start_date: string; p_end_date: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
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
        Args: { p_widget_id: string; p_config: Json; p_created_by?: string }
        Returns: Json
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
