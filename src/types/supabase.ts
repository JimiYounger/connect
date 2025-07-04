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
      audio_chunks: {
        Row: {
          audio_file_id: string | null
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          end_time: number | null
          id: string
          start_time: number | null
        }
        Insert: {
          audio_file_id?: string | null
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          end_time?: number | null
          id?: string
          start_time?: number | null
        }
        Update: {
          audio_file_id?: string | null
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          end_time?: number | null
          id?: string
          start_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_chunks_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_files: {
        Row: {
          audio_series_id: string | null
          created_at: string | null
          created_by: string | null
          current_version_id: string | null
          description: string | null
          embedding_status: string | null
          id: string
          preview_image_url: string | null
          summary: string | null
          summary_status: string | null
          title: string
          updated_at: string | null
          visibility_conditions: Json | null
        }
        Insert: {
          audio_series_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          embedding_status?: string | null
          id?: string
          preview_image_url?: string | null
          summary?: string | null
          summary_status?: string | null
          title: string
          updated_at?: string | null
          visibility_conditions?: Json | null
        }
        Update: {
          audio_series_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          embedding_status?: string | null
          id?: string
          preview_image_url?: string | null
          summary?: string | null
          summary_status?: string | null
          title?: string
          updated_at?: string | null
          visibility_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_listens: {
        Row: {
          audio_file_id: string | null
          created_at: string | null
          events: Json | null
          id: string
          percent_complete: number | null
          played_seconds: number | null
          user_id: string | null
        }
        Insert: {
          audio_file_id?: string | null
          created_at?: string | null
          events?: Json | null
          id?: string
          percent_complete?: number | null
          played_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          audio_file_id?: string | null
          created_at?: string | null
          events?: Json | null
          id?: string
          percent_complete?: number | null
          played_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_listens_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_listens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_series: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      audio_transcripts: {
        Row: {
          audio_file_id: string | null
          content: string
          created_at: string | null
          id: string
        }
        Insert: {
          audio_file_id?: string | null
          content: string
          created_at?: string | null
          id?: string
        }
        Update: {
          audio_file_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_transcripts_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_versions: {
        Row: {
          audio_file_id: string | null
          file_path: string
          file_type: string
          id: string
          uploaded_at: string | null
          version_label: string | null
        }
        Insert: {
          audio_file_id?: string | null
          file_path: string
          file_type: string
          id?: string
          uploaded_at?: string | null
          version_label?: string | null
        }
        Update: {
          audio_file_id?: string | null
          file_path?: string
          file_type?: string
          id?: string
          uploaded_at?: string | null
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_versions_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_visibility: {
        Row: {
          audio_file_id: string | null
          conditions: Json
          id: string
        }
        Insert: {
          audio_file_id?: string | null
          conditions?: Json
          id?: string
        }
        Update: {
          audio_file_id?: string | null
          conditions?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_visibility_audio_file_id_fkey"
            columns: ["audio_file_id"]
            isOneToOne: false
            referencedRelation: "audio_files"
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
          video_id: string | null
          video_title: string | null
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
          video_id?: string | null
          video_title?: string | null
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
          video_id?: string | null
          video_title?: string | null
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
          {
            foreignKeyName: "carousel_banners_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_banners_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
        ]
      }
      contact_tag_assignments: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      contact_visibility: {
        Row: {
          area: string | null
          contact_id: string
          id: string
          region: string | null
          role_type: string | null
          team: string | null
        }
        Insert: {
          area?: string | null
          contact_id: string
          id?: string
          region?: string | null
          role_type?: string | null
          team?: string | null
        }
        Update: {
          area?: string | null
          contact_id?: string
          id?: string
          region?: string | null
          role_type?: string | null
          team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_visibility_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          can_text: boolean | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          department_id: string | null
          email: string
          first_name: string
          google_user_id: string | null
          id: string
          job_title: string | null
          last_name: string
          last_updated_at: string | null
          location: string | null
          order_index: number
          phone: string | null
          profile_image_url: string | null
          timezone: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          can_text?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          email: string
          first_name: string
          google_user_id?: string | null
          id?: string
          job_title?: string | null
          last_name: string
          last_updated_at?: string | null
          location?: string | null
          order_index?: number
          phone?: string | null
          profile_image_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          can_text?: boolean | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department_id?: string | null
          email?: string
          first_name?: string
          google_user_id?: string | null
          id?: string
          job_title?: string | null
          last_name?: string
          last_updated_at?: string | null
          location?: string | null
          order_index?: number
          phone?: string | null
          profile_image_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
      departments: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          id: string
          name: string
          order: number
        }
        Insert: {
          id?: string
          name: string
          order?: number
        }
        Update: {
          id?: string
          name?: string
          order?: number
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
      document_chunks_old: {
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
      document_search_logs: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          profile_id: string | null
          query: string
          result_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          profile_id?: string | null
          query: string
          result_count: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          profile_id?: string | null
          query?: string
          result_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_search_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
          order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_category_id: string
          id?: string
          name: string
          order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_category_id?: string
          id?: string
          name?: string
          order?: number | null
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
          description_status: string | null
          document_category_id: string | null
          document_subcategory_id: string | null
          embedding_status: string | null
          id: string
          order: number | null
          preview_image_url: string | null
          summary: string | null
          summary_status: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          current_version_id?: string | null
          description?: string | null
          description_status?: string | null
          document_category_id?: string | null
          document_subcategory_id?: string | null
          embedding_status?: string | null
          id?: string
          order?: number | null
          preview_image_url?: string | null
          summary?: string | null
          summary_status?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          current_version_id?: string | null
          description?: string | null
          description_status?: string | null
          document_category_id?: string | null
          document_subcategory_id?: string | null
          embedding_status?: string | null
          id?: string
          order?: number | null
          preview_image_url?: string | null
          summary?: string | null
          summary_status?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
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
      series_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          module_name: string | null
          order_index: number
          season_number: number | null
          series_id: string
          updated_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          module_name?: string | null
          order_index?: number
          season_number?: number | null
          series_id: string
          updated_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          module_name?: string | null
          order_index?: number
          season_number?: number | null
          series_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_content_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "video_series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_seasons: {
        Row: {
          created_at: string | null
          id: string
          season_number: number
          series_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          season_number: number
          series_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          season_number?: number
          series_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_seasons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "video_series"
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
      video_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          thumbnail_color: string | null
          thumbnail_source: string | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          thumbnail_color?: string | null
          thumbnail_source?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          thumbnail_color?: string | null
          thumbnail_source?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_chunks: {
        Row: {
          chunk_index: number
          confidence_score: number | null
          content: string
          created_at: string | null
          embedding: string | null
          end_time: number | null
          id: string
          speaker: string | null
          start_time: number | null
          video_file_id: string
          video_transcript_id: string | null
          word_count: number | null
        }
        Insert: {
          chunk_index: number
          confidence_score?: number | null
          content: string
          created_at?: string | null
          embedding?: string | null
          end_time?: number | null
          id?: string
          speaker?: string | null
          start_time?: number | null
          video_file_id: string
          video_transcript_id?: string | null
          word_count?: number | null
        }
        Update: {
          chunk_index?: number
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          end_time?: number | null
          id?: string
          speaker?: string | null
          start_time?: number | null
          video_file_id?: string
          video_transcript_id?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_chunks_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_chunks_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
          {
            foreignKeyName: "video_chunks_video_transcript_id_fkey"
            columns: ["video_transcript_id"]
            isOneToOne: false
            referencedRelation: "video_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_files: {
        Row: {
          admin_selected: boolean | null
          created_at: string | null
          created_by: string | null
          current_version_id: string | null
          custom_thumbnail_url: string | null
          description: string | null
          embedding_status: string | null
          id: string
          library_status: string | null
          order_index: number | null
          preview_image_url: string | null
          public_sharing_enabled: boolean | null
          summary: string | null
          summary_status: string | null
          thumbnail_source: string | null
          title: string
          transcript_status: string | null
          updated_at: string | null
          video_category_id: string | null
          video_subcategory_id: string | null
          vimeo_duration: number | null
          vimeo_id: string | null
          vimeo_metadata: Json | null
          vimeo_thumbnail_url: string | null
          vimeo_uri: string | null
          visibility_conditions: Json | null
        }
        Insert: {
          admin_selected?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          custom_thumbnail_url?: string | null
          description?: string | null
          embedding_status?: string | null
          id?: string
          library_status?: string | null
          order_index?: number | null
          preview_image_url?: string | null
          public_sharing_enabled?: boolean | null
          summary?: string | null
          summary_status?: string | null
          thumbnail_source?: string | null
          title: string
          transcript_status?: string | null
          updated_at?: string | null
          video_category_id?: string | null
          video_subcategory_id?: string | null
          vimeo_duration?: number | null
          vimeo_id?: string | null
          vimeo_metadata?: Json | null
          vimeo_thumbnail_url?: string | null
          vimeo_uri?: string | null
          visibility_conditions?: Json | null
        }
        Update: {
          admin_selected?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          custom_thumbnail_url?: string | null
          description?: string | null
          embedding_status?: string | null
          id?: string
          library_status?: string | null
          order_index?: number | null
          preview_image_url?: string | null
          public_sharing_enabled?: boolean | null
          summary?: string | null
          summary_status?: string | null
          thumbnail_source?: string | null
          title?: string
          transcript_status?: string | null
          updated_at?: string | null
          video_category_id?: string | null
          video_subcategory_id?: string | null
          vimeo_duration?: number | null
          vimeo_id?: string | null
          vimeo_metadata?: Json | null
          vimeo_thumbnail_url?: string | null
          vimeo_uri?: string | null
          visibility_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_files_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "video_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_files_video_category_id_fkey"
            columns: ["video_category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_files_video_subcategory_id_fkey"
            columns: ["video_subcategory_id"]
            isOneToOne: false
            referencedRelation: "video_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      video_search_logs: {
        Row: {
          created_at: string | null
          embedding_used: string | null
          id: string
          results_count: number | null
          search_context: Json | null
          search_duration_ms: number | null
          search_query: string
          search_type: string | null
          top_result_video_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          embedding_used?: string | null
          id?: string
          results_count?: number | null
          search_context?: Json | null
          search_duration_ms?: number | null
          search_query: string
          search_type?: string | null
          top_result_video_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          embedding_used?: string | null
          id?: string
          results_count?: number | null
          search_context?: Json | null
          search_duration_ms?: number | null
          search_query?: string
          search_type?: string | null
          top_result_video_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_search_logs_top_result_video_id_fkey"
            columns: ["top_result_video_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_search_logs_top_result_video_id_fkey"
            columns: ["top_result_video_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
          {
            foreignKeyName: "video_search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_series: {
        Row: {
          content_count: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          has_seasons: boolean | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          order_index: number | null
          parent_series_id: string | null
          series_type: string | null
          tags: string[] | null
          thumbnail_color: string | null
          thumbnail_source: string | null
          thumbnail_url: string | null
          total_duration: number | null
          updated_at: string | null
        }
        Insert: {
          content_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          has_seasons?: boolean | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          order_index?: number | null
          parent_series_id?: string | null
          series_type?: string | null
          tags?: string[] | null
          thumbnail_color?: string | null
          thumbnail_source?: string | null
          thumbnail_url?: string | null
          total_duration?: number | null
          updated_at?: string | null
        }
        Update: {
          content_count?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          has_seasons?: boolean | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          order_index?: number | null
          parent_series_id?: string | null
          series_type?: string | null
          tags?: string[] | null
          thumbnail_color?: string | null
          thumbnail_source?: string | null
          thumbnail_url?: string | null
          total_duration?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_series_parent_series_id_fkey"
            columns: ["parent_series_id"]
            isOneToOne: false
            referencedRelation: "video_series"
            referencedColumns: ["id"]
          },
        ]
      }
      video_subcategories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          thumbnail_color: string | null
          thumbnail_source: string | null
          thumbnail_url: string | null
          updated_at: string | null
          video_category_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          thumbnail_color?: string | null
          thumbnail_source?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_category_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          thumbnail_color?: string | null
          thumbnail_source?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_subcategories_video_category_id_fkey"
            columns: ["video_category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      video_tag_assignments: {
        Row: {
          created_at: string | null
          id: string
          tag_id: string
          video_file_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_id: string
          video_file_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_id?: string
          video_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "video_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_tag_assignments_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_tag_assignments_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
        ]
      }
      video_tags: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      video_transcripts: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          full_transcript: string
          id: string
          language: string | null
          metadata: Json | null
          source: string | null
          updated_at: string | null
          video_file_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          full_transcript: string
          id?: string
          language?: string | null
          metadata?: Json | null
          source?: string | null
          updated_at?: string | null
          video_file_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          full_transcript?: string
          id?: string
          language?: string | null
          metadata?: Json | null
          source?: string | null
          updated_at?: string | null
          video_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_transcripts_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_transcripts_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
        ]
      }
      video_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_current: boolean | null
          thumbnail_url: string | null
          title: string
          version_number: number
          video_file_id: string
          vimeo_id: string | null
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_current?: boolean | null
          thumbnail_url?: string | null
          title: string
          version_number: number
          video_file_id: string
          vimeo_id?: string | null
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_current?: boolean | null
          thumbnail_url?: string | null
          title?: string
          version_number?: number
          video_file_id?: string
          vimeo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_versions_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_versions_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
        ]
      }
      video_visibility: {
        Row: {
          conditions: Json
          created_at: string | null
          id: string
          updated_at: string | null
          video_file_id: string
        }
        Insert: {
          conditions: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          video_file_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          video_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_visibility_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_visibility_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
          },
        ]
      }
      video_watches: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          device_type: string | null
          events: Json | null
          id: string
          last_position: number | null
          percent_complete: number | null
          total_duration: number | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
          video_file_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          device_type?: string | null
          events?: Json | null
          id?: string
          last_position?: number | null
          percent_complete?: number | null
          total_duration?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
          video_file_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          device_type?: string | null
          events?: Json | null
          id?: string
          last_position?: number | null
          percent_complete?: number | null
          total_duration?: number | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
          video_file_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_watches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_watches_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_watches_video_file_id_fkey"
            columns: ["video_file_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
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
          video_id: string | null
          video_title: string | null
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
          {
            foreignKeyName: "carousel_banners_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carousel_banners_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_org_analytics"
            referencedColumns: ["video_id"]
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
      video_org_analytics: {
        Row: {
          area: string | null
          avg_completion_rate: number | null
          last_watched: string | null
          region: string | null
          role_type: string | null
          team: string | null
          title: string | null
          total_views: number | null
          unique_viewers: number | null
          video_id: string | null
          vimeo_duration: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cosine_similarity_3072: {
        Args: { a: string; b: string }
        Returns: number
      }
      create_audio_file_with_version: {
        Args: {
          p_title: string
          p_description: string
          p_audio_series_id: string
          p_created_by: string
          p_file_path: string
          p_file_type: string
        }
        Returns: Json
      }
      create_video_chunks_from_transcript: {
        Args: {
          video_id: string
          transcript_id: string
          full_transcript: string
          chunk_duration?: number
        }
        Returns: number
      }
      delete_category_and_reassign: {
        Args: {
          p_category_id: string
          p_fallback_category_id: string
          p_document_overrides: Json
        }
        Returns: Json
      }
      delete_subcategory_and_reassign: {
        Args: { p_subcategory_id: string; p_fallback_subcategory_id: string }
        Returns: Json
      }
      get_daily_engagement_metrics: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          date: string
          total_views: number
          unique_viewers: number
          unique_videos_watched: number
          avg_completion_rate: number
        }[]
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
      get_trending_videos: {
        Args: { days?: number; limit_count?: number }
        Returns: {
          video_id: string
          title: string
          total_views: number
          unique_viewers: number
          avg_completion_rate: number
          trend_score: number
        }[]
      }
      get_user_carousel_banners: {
        Args: {
          user_role_type: string
          user_team: string
          user_area: string
          user_region: string
        }
        Returns: {
          banner_url: string
          click_behavior: string
          created_at: string
          description: string
          end_date: string
          file_id: string
          id: string
          is_active: boolean
          is_currently_active: boolean
          open_in_iframe: boolean
          order_index: number
          original_filename: string
          role_count: number
          role_details: Json
          role_ids: string[]
          start_date: string
          title: string
          updated_at: string
          url: string
          vimeo_video_id: string
          vimeo_video_title: string
          video_id: string
          video_title: string
          visible_to_roles: string
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
      get_user_video_progress: {
        Args: { user_profile_id: string; video_id?: string }
        Returns: {
          video_file_id: string
          video_title: string
          watched_seconds: number
          total_duration: number
          percent_complete: number
          last_position: number
          completed: boolean
          last_watched: string
        }[]
      }
      get_video_org_breakdown: {
        Args: { video_id: string; timeframe?: number }
        Returns: {
          org_level: string
          org_value: string
          total_views: number
          unique_viewers: number
          avg_completion_rate: number
          last_watched: string
        }[]
      }
      get_video_tags: {
        Args: { video_ids: string[] }
        Returns: {
          video_id: string
          tags: string[]
        }[]
      }
      get_video_user_details: {
        Args: { video_id: string; org_filters?: Json }
        Returns: {
          user_id: string
          first_name: string
          last_name: string
          email: string
          region: string
          area: string
          team: string
          watched_seconds: number
          percent_complete: number
          completed: boolean
          last_watched: string
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
      match_chunks: {
        Args:
          | {
              query_embedding: string
              match_count?: number
              similarity_threshold?: number
            }
          | {
              query_embedding: string
              similarity_threshold?: number
              match_count?: number
            }
        Returns: {
          id: string
          document_id: string
          content: string
          similarity: number
        }[]
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          document_id: string
          chunk_index: number
          content: string
          similarity: number
        }[]
      }
      match_video_chunks: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
          filter_category_id?: string
          filter_subcategory_id?: string
          filter_series_id?: string
          filter_tag_ids?: string[]
        }
        Returns: {
          video_id: string
          chunk_id: string
          chunk_index: number
          content: string
          similarity: number
          timestamp_start: number
          timestamp_end: number
          video_title: string
          video_description: string
          vimeo_id: string
          vimeo_duration: number
          vimeo_thumbnail_url: string
          custom_thumbnail_url: string
          thumbnail_source: string
          video_created_at: string
          video_updated_at: string
          embedding_status: string
          category_id: string
          category_name: string
          subcategory_id: string
          subcategory_name: string
          visibility_conditions: Json
        }[]
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
      reorder_documents: {
        Args: { p_documents: Json }
        Returns: Json
      }
      search_similar_chunks: {
        Args: {
          query_embedding: string
          user_filters: Json
          threshold?: number
          match_count?: number
        }
        Returns: {
          chunk_id: string
          document_id: string
          chunk_index: number
          content: string
          similarity: number
        }[]
      }
      search_video_content: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          video_id: string
          chunk_id: string
          content: string
          start_time: number
          end_time: number
          similarity: number
          video_title: string
          vimeo_id: string
        }[]
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
      test_function: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_vector_dimensions: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      update_contact_order: {
        Args: {
          contact_updates: Database["public"]["CompositeTypes"]["contact_order_update"][]
        }
        Returns: undefined
      }
      update_series_metadata: {
        Args: { series_id_param: string }
        Returns: undefined
      }
      update_video_processing_status: {
        Args: { video_id: string; status_type: string; status_value: string }
        Returns: undefined
      }
      update_video_watch_progress: {
        Args:
          | {
              user_profile_id: string
              video_id: string
              current_position: number
              video_duration: number
              event_data?: Json
            }
          | {
              video_id: string
              user_profile_id: string
              current_position: number
              event_data?: Json
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
      contact_order_update: {
        id: string | null
        order_index: number | null
        updated_by: string | null
        updated_at: string | null
      }
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
