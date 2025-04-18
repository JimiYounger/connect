create extension if not exists "vector" with schema "public" version '0.8.0';

create table "public"."activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "redis_id" text,
    "type" text not null,
    "action" text not null,
    "user_id" uuid,
    "user_email" text,
    "status" text not null,
    "details" jsonb not null,
    "metadata" jsonb,
    "timestamp" bigint not null,
    "created_at" timestamp with time zone default now(),
    "synced_at" timestamp with time zone default now()
);


alter table "public"."activity_logs" enable row level security;

create table "public"."bulk_messages" (
    "id" uuid not null default uuid_generate_v4(),
    "sender_id" uuid not null,
    "content" text not null,
    "template_variables" jsonb,
    "query_parameters" jsonb not null,
    "total_recipients" integer,
    "message_segments" integer,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."carousel_banner_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "banner_id" uuid,
    "role_type" text not null,
    "team" text,
    "area" text,
    "region" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."carousel_banners" (
    "id" uuid not null default uuid_generate_v4(),
    "title" character varying not null,
    "description" text,
    "file_id" uuid,
    "order_index" integer,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "click_behavior" character varying not null,
    "url" text,
    "open_in_iframe" boolean default false,
    "vimeo_video_id" character varying,
    "vimeo_video_title" character varying,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone
);


create table "public"."dashboard_drafts" (
    "id" uuid not null default uuid_generate_v4(),
    "dashboard_id" uuid not null,
    "name" text not null,
    "description" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_current" boolean default true
);


create table "public"."dashboard_versions" (
    "id" uuid not null default uuid_generate_v4(),
    "dashboard_id" uuid not null,
    "version_number" integer not null,
    "name" text not null,
    "description" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_active" boolean default false,
    "status" text not null,
    "scheduled_publish_date" timestamp with time zone
);


create table "public"."dashboards" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_active" boolean default true,
    "role_type" text not null
);


create table "public"."document_categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "order" integer not null default 0
);


alter table "public"."document_categories" enable row level security;

create table "public"."document_chunks" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid,
    "chunk_index" integer not null,
    "content" text not null,
    "embedding" vector(1536),
    "created_at" timestamp with time zone default now()
);


alter table "public"."document_chunks" enable row level security;

create table "public"."document_content" (
    "document_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."document_content" enable row level security;

create table "public"."document_embeddings" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid,
    "chunk_index" integer,
    "content" text,
    "embedding" vector(1536),
    "created_at" timestamp without time zone default now(),
    "updated_at" timestamp without time zone default now()
);


create table "public"."document_subcategories" (
    "id" uuid not null default gen_random_uuid(),
    "document_category_id" uuid not null,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "order" integer
);


alter table "public"."document_subcategories" enable row level security;

create table "public"."document_tag_assignments" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid,
    "tag_id" uuid
);


create table "public"."document_tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null
);


create table "public"."document_versions" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid,
    "file_path" text not null,
    "file_type" text not null,
    "version_label" text,
    "uploaded_at" timestamp with time zone default now()
);


create table "public"."document_visibility" (
    "id" uuid not null default gen_random_uuid(),
    "document_id" uuid,
    "conditions" jsonb not null default '{}'::jsonb
);


create table "public"."documents" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "document_category_id" uuid,
    "uploaded_by" uuid,
    "current_version_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "subcategory_id" uuid,
    "document_subcategory_id" uuid,
    "preview_image_url" text,
    "order" integer
);


alter table "public"."documents" enable row level security;

create table "public"."draft_widget_placements" (
    "id" uuid not null default uuid_generate_v4(),
    "draft_id" uuid not null,
    "widget_id" uuid not null,
    "position_x" integer not null,
    "position_y" integer not null,
    "width" integer not null,
    "height" integer not null,
    "layout_type" text not null,
    "created_at" timestamp with time zone default now(),
    "created_by" uuid
);


create table "public"."error_logs" (
    "id" uuid not null default gen_random_uuid(),
    "redis_id" text,
    "message" text not null,
    "stack" text,
    "severity" text not null,
    "source" text not null,
    "user_id" uuid,
    "path" text,
    "context" jsonb,
    "timestamp" bigint not null,
    "created_at" timestamp with time zone default now(),
    "synced_at" timestamp with time zone default now()
);


alter table "public"."error_logs" enable row level security;

create table "public"."files" (
    "id" uuid not null default uuid_generate_v4(),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "user_id" uuid,
    "cdn_url" text not null,
    "uploadcare_uuid" text not null,
    "original_filename" text not null,
    "mime_type" text not null,
    "size" bigint not null
);


alter table "public"."files" enable row level security;

create table "public"."messages" (
    "id" uuid not null default uuid_generate_v4(),
    "sender_id" uuid not null,
    "recipient_id" uuid not null,
    "bulk_message_id" uuid,
    "content" text not null,
    "is_outbound" boolean not null,
    "message_segments" integer,
    "twilio_sid" text,
    "status" character varying(20) default 'pending'::character varying,
    "error_message" text,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."navigation_analytics" (
    "id" uuid not null default uuid_generate_v4(),
    "navigation_item_id" uuid,
    "user_id" uuid,
    "interaction_type" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."navigation_analytics" enable row level security;

create table "public"."navigation_item_roles" (
    "id" uuid not null default uuid_generate_v4(),
    "navigation_item_id" uuid,
    "role_type" text not null,
    "team" text,
    "area" text,
    "region" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."navigation_item_roles" enable row level security;

create table "public"."navigation_items" (
    "id" uuid not null default uuid_generate_v4(),
    "menu_id" uuid,
    "parent_id" uuid,
    "title" text not null,
    "url" text not null,
    "description" text,
    "dynamic_variables" jsonb,
    "is_external" boolean default false,
    "open_in_iframe" boolean default false,
    "order_index" integer not null,
    "is_active" boolean default true,
    "is_public" boolean default false,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid
);


alter table "public"."navigation_items" enable row level security;

create table "public"."navigation_menus" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid
);


alter table "public"."navigation_menus" enable row level security;

create table "public"."thumbnails" (
    "id" uuid not null default gen_random_uuid(),
    "uploadcare_url" text not null,
    "created_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."thumbnails" enable row level security;

create table "public"."user_message_preferences" (
    "user_id" uuid not null,
    "opted_out" boolean not null default false,
    "opted_out_at" timestamp with time zone
);


create table "public"."user_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "airtable_record_id" text not null,
    "first_name" text not null,
    "last_name" text not null,
    "email" text not null,
    "phone" text,
    "role" text,
    "role_type" character varying(50),
    "team" text,
    "area" text,
    "region" text,
    "shirt_size" text,
    "recruiting_record_id" text,
    "google_user_id" text,
    "salesforce_id" text,
    "department" text,
    "hire_date" date,
    "user_key" text,
    "profile_pic_url" text,
    "health_dashboard" text,
    "last_airtable_sync" timestamp with time zone not null default now(),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_profiles" enable row level security;

create table "public"."user_recruiters" (
    "id" uuid not null default uuid_generate_v4(),
    "user_profile_id" uuid,
    "recruiter_airtable_id" text not null,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."user_supervisors" (
    "id" uuid not null default uuid_generate_v4(),
    "user_profile_id" uuid,
    "supervisor_airtable_id" text not null,
    "created_at" timestamp with time zone not null default now()
);


create table "public"."widget_analytics" (
    "id" uuid not null default uuid_generate_v4(),
    "widget_id" uuid not null,
    "user_id" uuid not null,
    "interaction_type" character varying(50) not null,
    "created_at" timestamp with time zone default now(),
    "metadata" jsonb default '{}'::jsonb
);


create table "public"."widget_categories" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying(100) not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "position" integer default 0,
    "color" text
);


create table "public"."widget_configurations" (
    "id" uuid not null default uuid_generate_v4(),
    "widget_id" uuid not null,
    "config" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid,
    "updated_by" uuid
);


create table "public"."widget_placements" (
    "id" uuid not null default uuid_generate_v4(),
    "version_id" uuid not null,
    "widget_id" uuid not null,
    "position_x" integer not null,
    "position_y" integer not null,
    "width" integer not null,
    "height" integer not null,
    "layout_type" text not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."widgets" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying(255) not null,
    "description" text,
    "thumbnail_url" text,
    "widget_type" character varying(50) not null,
    "display_type" character varying(50),
    "size_ratio" character varying(20) not null,
    "shape" character varying(20) not null,
    "category_id" uuid,
    "component_path" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_published" boolean not null default false,
    "is_active" boolean not null default true,
    "public" boolean not null default false,
    "created_by" uuid,
    "file_id" uuid
);


CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE UNIQUE INDEX activity_logs_redis_id_key ON public.activity_logs USING btree (redis_id);

CREATE UNIQUE INDEX bulk_messages_pkey ON public.bulk_messages USING btree (id);

CREATE UNIQUE INDEX carousel_banner_roles_pkey ON public.carousel_banner_roles USING btree (id);

CREATE UNIQUE INDEX carousel_banners_pkey ON public.carousel_banners USING btree (id);

CREATE UNIQUE INDEX dashboard_drafts_pkey ON public.dashboard_drafts USING btree (id);

CREATE UNIQUE INDEX dashboard_versions_pkey ON public.dashboard_versions USING btree (id);

CREATE UNIQUE INDEX dashboards_pkey ON public.dashboards USING btree (id);

CREATE UNIQUE INDEX document_categories_name_key ON public.document_categories USING btree (name);

CREATE UNIQUE INDEX document_categories_pkey ON public.document_categories USING btree (id);

CREATE INDEX document_chunks_embedding_idx ON public.document_chunks USING ivfflat (embedding) WITH (lists='100');

CREATE UNIQUE INDEX document_chunks_pkey ON public.document_chunks USING btree (id);

CREATE UNIQUE INDEX document_content_pkey ON public.document_content USING btree (document_id);

CREATE UNIQUE INDEX document_embeddings_pkey ON public.document_embeddings USING btree (id);

CREATE UNIQUE INDEX document_subcategories_pkey ON public.document_subcategories USING btree (id);

CREATE UNIQUE INDEX document_tag_assignments_pkey ON public.document_tag_assignments USING btree (id);

CREATE UNIQUE INDEX document_tags_name_key ON public.document_tags USING btree (name);

CREATE UNIQUE INDEX document_tags_pkey ON public.document_tags USING btree (id);

CREATE UNIQUE INDEX document_versions_pkey ON public.document_versions USING btree (id);

CREATE UNIQUE INDEX document_visibility_pkey1 ON public.document_visibility USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX draft_widget_placements_pkey ON public.draft_widget_placements USING btree (id);

CREATE UNIQUE INDEX error_logs_pkey ON public.error_logs USING btree (id);

CREATE UNIQUE INDEX error_logs_redis_id_key ON public.error_logs USING btree (redis_id);

CREATE UNIQUE INDEX files_pkey ON public.files USING btree (id);

CREATE INDEX idx_bulk_messages_created_at ON public.bulk_messages USING btree (created_at);

CREATE INDEX idx_bulk_messages_sender_id ON public.bulk_messages USING btree (sender_id);

CREATE INDEX idx_carousel_banner_roles_banner_id ON public.carousel_banner_roles USING btree (banner_id);

CREATE INDEX idx_carousel_banner_roles_lookup ON public.carousel_banner_roles USING btree (role_type, team, area, region);

CREATE INDEX idx_document_visibility_conditions ON public.document_visibility USING gin (conditions);

CREATE INDEX idx_draft_widget_placements_layout_type ON public.draft_widget_placements USING btree (layout_type);

CREATE INDEX idx_messages_bulk_message_id ON public.messages USING btree (bulk_message_id);

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);

CREATE INDEX idx_messages_recipient_id ON public.messages USING btree (recipient_id);

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);

CREATE INDEX idx_messages_status ON public.messages USING btree (status);

CREATE INDEX idx_navigation_analytics_created_at ON public.navigation_analytics USING btree (created_at);

CREATE INDEX idx_navigation_analytics_item ON public.navigation_analytics USING btree (navigation_item_id);

CREATE INDEX idx_navigation_analytics_user ON public.navigation_analytics USING btree (user_id);

CREATE INDEX idx_navigation_item_roles_item_id ON public.navigation_item_roles USING btree (navigation_item_id);

CREATE INDEX idx_navigation_item_roles_lookup ON public.navigation_item_roles USING btree (role_type, team, area, region);

CREATE INDEX idx_navigation_items_dates ON public.navigation_items USING btree (start_date, end_date) WHERE ((start_date IS NOT NULL) OR (end_date IS NOT NULL));

CREATE INDEX idx_navigation_items_menu_id ON public.navigation_items USING btree (menu_id);

CREATE INDEX idx_navigation_items_order ON public.navigation_items USING btree (order_index, created_at);

CREATE INDEX idx_navigation_items_parent_id ON public.navigation_items USING btree (parent_id);

CREATE INDEX idx_thumbnails_created_at ON public.thumbnails USING btree (created_at);

CREATE INDEX idx_user_profiles_email ON public.user_profiles USING btree (email);

CREATE INDEX idx_user_profiles_role_type ON public.user_profiles USING btree (role_type);

CREATE INDEX idx_user_profiles_team ON public.user_profiles USING btree (team);

CREATE INDEX idx_user_recruiters_user ON public.user_recruiters USING btree (user_profile_id);

CREATE INDEX idx_user_supervisors_user ON public.user_supervisors USING btree (user_profile_id);

CREATE INDEX idx_widget_analytics_user ON public.widget_analytics USING btree (user_id);

CREATE INDEX idx_widget_analytics_widget ON public.widget_analytics USING btree (widget_id);

CREATE INDEX idx_widget_placements_layout_type ON public.widget_placements USING btree (layout_type);

CREATE INDEX idx_widgets_type ON public.widgets USING btree (widget_type);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX navigation_analytics_pkey ON public.navigation_analytics USING btree (id);

CREATE UNIQUE INDEX navigation_item_roles_pkey ON public.navigation_item_roles USING btree (id);

CREATE UNIQUE INDEX navigation_items_pkey ON public.navigation_items USING btree (id);

CREATE UNIQUE INDEX navigation_menus_pkey ON public.navigation_menus USING btree (id);

CREATE UNIQUE INDEX thumbnails_pkey ON public.thumbnails USING btree (id);

CREATE UNIQUE INDEX uq_doc_subcategory_name_per_category ON public.document_subcategories USING btree (document_category_id, name);

CREATE UNIQUE INDEX user_message_preferences_pkey ON public.user_message_preferences USING btree (user_id);

CREATE UNIQUE INDEX user_profiles_airtable_record_id_key ON public.user_profiles USING btree (airtable_record_id);

CREATE UNIQUE INDEX user_profiles_email_key ON public.user_profiles USING btree (email);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX user_recruiters_pkey ON public.user_recruiters USING btree (id);

CREATE UNIQUE INDEX user_supervisors_pkey ON public.user_supervisors USING btree (id);

CREATE UNIQUE INDEX widget_analytics_pkey ON public.widget_analytics USING btree (id);

CREATE UNIQUE INDEX widget_categories_name_key ON public.widget_categories USING btree (name);

CREATE UNIQUE INDEX widget_categories_pkey ON public.widget_categories USING btree (id);

CREATE UNIQUE INDEX widget_configurations_pkey ON public.widget_configurations USING btree (id);

CREATE UNIQUE INDEX widget_configurations_widget_id_unique ON public.widget_configurations USING btree (widget_id);

CREATE UNIQUE INDEX widget_placements_pkey ON public.widget_placements USING btree (id);

CREATE UNIQUE INDEX widgets_pkey ON public.widgets USING btree (id);

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."bulk_messages" add constraint "bulk_messages_pkey" PRIMARY KEY using index "bulk_messages_pkey";

alter table "public"."carousel_banner_roles" add constraint "carousel_banner_roles_pkey" PRIMARY KEY using index "carousel_banner_roles_pkey";

alter table "public"."carousel_banners" add constraint "carousel_banners_pkey" PRIMARY KEY using index "carousel_banners_pkey";

alter table "public"."dashboard_drafts" add constraint "dashboard_drafts_pkey" PRIMARY KEY using index "dashboard_drafts_pkey";

alter table "public"."dashboard_versions" add constraint "dashboard_versions_pkey" PRIMARY KEY using index "dashboard_versions_pkey";

alter table "public"."dashboards" add constraint "dashboards_pkey" PRIMARY KEY using index "dashboards_pkey";

alter table "public"."document_categories" add constraint "document_categories_pkey" PRIMARY KEY using index "document_categories_pkey";

alter table "public"."document_chunks" add constraint "document_chunks_pkey" PRIMARY KEY using index "document_chunks_pkey";

alter table "public"."document_content" add constraint "document_content_pkey" PRIMARY KEY using index "document_content_pkey";

alter table "public"."document_embeddings" add constraint "document_embeddings_pkey" PRIMARY KEY using index "document_embeddings_pkey";

alter table "public"."document_subcategories" add constraint "document_subcategories_pkey" PRIMARY KEY using index "document_subcategories_pkey";

alter table "public"."document_tag_assignments" add constraint "document_tag_assignments_pkey" PRIMARY KEY using index "document_tag_assignments_pkey";

alter table "public"."document_tags" add constraint "document_tags_pkey" PRIMARY KEY using index "document_tags_pkey";

alter table "public"."document_versions" add constraint "document_versions_pkey" PRIMARY KEY using index "document_versions_pkey";

alter table "public"."document_visibility" add constraint "document_visibility_pkey1" PRIMARY KEY using index "document_visibility_pkey1";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."draft_widget_placements" add constraint "draft_widget_placements_pkey" PRIMARY KEY using index "draft_widget_placements_pkey";

alter table "public"."error_logs" add constraint "error_logs_pkey" PRIMARY KEY using index "error_logs_pkey";

alter table "public"."files" add constraint "files_pkey" PRIMARY KEY using index "files_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."navigation_analytics" add constraint "navigation_analytics_pkey" PRIMARY KEY using index "navigation_analytics_pkey";

alter table "public"."navigation_item_roles" add constraint "navigation_item_roles_pkey" PRIMARY KEY using index "navigation_item_roles_pkey";

alter table "public"."navigation_items" add constraint "navigation_items_pkey" PRIMARY KEY using index "navigation_items_pkey";

alter table "public"."navigation_menus" add constraint "navigation_menus_pkey" PRIMARY KEY using index "navigation_menus_pkey";

alter table "public"."thumbnails" add constraint "thumbnails_pkey" PRIMARY KEY using index "thumbnails_pkey";

alter table "public"."user_message_preferences" add constraint "user_message_preferences_pkey" PRIMARY KEY using index "user_message_preferences_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_recruiters" add constraint "user_recruiters_pkey" PRIMARY KEY using index "user_recruiters_pkey";

alter table "public"."user_supervisors" add constraint "user_supervisors_pkey" PRIMARY KEY using index "user_supervisors_pkey";

alter table "public"."widget_analytics" add constraint "widget_analytics_pkey" PRIMARY KEY using index "widget_analytics_pkey";

alter table "public"."widget_categories" add constraint "widget_categories_pkey" PRIMARY KEY using index "widget_categories_pkey";

alter table "public"."widget_configurations" add constraint "widget_configurations_pkey" PRIMARY KEY using index "widget_configurations_pkey";

alter table "public"."widget_placements" add constraint "widget_placements_pkey" PRIMARY KEY using index "widget_placements_pkey";

alter table "public"."widgets" add constraint "widgets_pkey" PRIMARY KEY using index "widgets_pkey";

alter table "public"."activity_logs" add constraint "activity_logs_redis_id_key" UNIQUE using index "activity_logs_redis_id_key";

alter table "public"."activity_logs" add constraint "fk_user_profile" FOREIGN KEY (user_id) REFERENCES user_profiles(id) not valid;

alter table "public"."activity_logs" validate constraint "fk_user_profile";

alter table "public"."bulk_messages" add constraint "bulk_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES user_profiles(id) not valid;

alter table "public"."bulk_messages" validate constraint "bulk_messages_sender_id_fkey";

alter table "public"."carousel_banner_roles" add constraint "carousel_banner_roles_banner_id_fkey" FOREIGN KEY (banner_id) REFERENCES carousel_banners(id) ON DELETE CASCADE not valid;

alter table "public"."carousel_banner_roles" validate constraint "carousel_banner_roles_banner_id_fkey";

alter table "public"."carousel_banners" add constraint "carousel_banners_file_id_fkey" FOREIGN KEY (file_id) REFERENCES files(id) not valid;

alter table "public"."carousel_banners" validate constraint "carousel_banners_file_id_fkey";

alter table "public"."carousel_banners" add constraint "valid_date_range" CHECK ((((start_date IS NULL) AND (end_date IS NULL)) OR ((start_date IS NULL) AND (end_date IS NOT NULL)) OR ((start_date IS NOT NULL) AND (end_date IS NULL)) OR (start_date < end_date))) not valid;

alter table "public"."carousel_banners" validate constraint "valid_date_range";

alter table "public"."dashboard_drafts" add constraint "dashboard_drafts_dashboard_id_fkey" FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE not valid;

alter table "public"."dashboard_drafts" validate constraint "dashboard_drafts_dashboard_id_fkey";

alter table "public"."dashboard_versions" add constraint "dashboard_versions_dashboard_id_fkey" FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE not valid;

alter table "public"."dashboard_versions" validate constraint "dashboard_versions_dashboard_id_fkey";

alter table "public"."document_categories" add constraint "document_categories_name_key" UNIQUE using index "document_categories_name_key";

alter table "public"."document_chunks" add constraint "document_chunks_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_chunks" validate constraint "document_chunks_document_id_fkey";

alter table "public"."document_content" add constraint "document_content_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_content" validate constraint "document_content_document_id_fkey";

alter table "public"."document_embeddings" add constraint "document_embeddings_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_embeddings" validate constraint "document_embeddings_document_id_fkey";

alter table "public"."document_subcategories" add constraint "document_subcategories_document_category_id_fkey" FOREIGN KEY (document_category_id) REFERENCES document_categories(id) ON DELETE CASCADE not valid;

alter table "public"."document_subcategories" validate constraint "document_subcategories_document_category_id_fkey";

alter table "public"."document_subcategories" add constraint "uq_doc_subcategory_name_per_category" UNIQUE using index "uq_doc_subcategory_name_per_category";

alter table "public"."document_tag_assignments" add constraint "document_tag_assignments_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_tag_assignments" validate constraint "document_tag_assignments_document_id_fkey";

alter table "public"."document_tag_assignments" add constraint "document_tag_assignments_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES document_tags(id) ON DELETE CASCADE not valid;

alter table "public"."document_tag_assignments" validate constraint "document_tag_assignments_tag_id_fkey";

alter table "public"."document_tags" add constraint "document_tags_name_key" UNIQUE using index "document_tags_name_key";

alter table "public"."document_versions" add constraint "document_versions_document_id_fkey" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_versions" validate constraint "document_versions_document_id_fkey";

alter table "public"."document_visibility" add constraint "document_visibility_document_id_fkey1" FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE not valid;

alter table "public"."document_visibility" validate constraint "document_visibility_document_id_fkey1";

alter table "public"."documents" add constraint "documents_category_id_fkey" FOREIGN KEY (document_category_id) REFERENCES document_categories(id) not valid;

alter table "public"."documents" validate constraint "documents_category_id_fkey";

alter table "public"."documents" add constraint "documents_document_category_id_fkey" FOREIGN KEY (document_category_id) REFERENCES document_categories(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_document_category_id_fkey";

alter table "public"."documents" add constraint "documents_document_subcategory_id_fkey" FOREIGN KEY (document_subcategory_id) REFERENCES document_subcategories(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_document_subcategory_id_fkey";

alter table "public"."documents" add constraint "documents_subcategory_id_fkey" FOREIGN KEY (subcategory_id) REFERENCES document_subcategories(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_subcategory_id_fkey";

alter table "public"."documents" add constraint "documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES user_profiles(id) not valid;

alter table "public"."documents" validate constraint "documents_uploaded_by_fkey";

alter table "public"."draft_widget_placements" add constraint "draft_widget_placements_draft_id_fkey" FOREIGN KEY (draft_id) REFERENCES dashboard_drafts(id) ON DELETE CASCADE not valid;

alter table "public"."draft_widget_placements" validate constraint "draft_widget_placements_draft_id_fkey";

alter table "public"."draft_widget_placements" add constraint "draft_widget_placements_layout_type_check" CHECK ((layout_type = ANY (ARRAY['desktop'::text, 'mobile'::text]))) not valid;

alter table "public"."draft_widget_placements" validate constraint "draft_widget_placements_layout_type_check";

alter table "public"."draft_widget_placements" add constraint "draft_widget_placements_widget_id_fkey" FOREIGN KEY (widget_id) REFERENCES widgets(id) ON DELETE CASCADE not valid;

alter table "public"."draft_widget_placements" validate constraint "draft_widget_placements_widget_id_fkey";

alter table "public"."error_logs" add constraint "error_logs_redis_id_key" UNIQUE using index "error_logs_redis_id_key";

alter table "public"."error_logs" add constraint "fk_user_profile" FOREIGN KEY (user_id) REFERENCES user_profiles(id) not valid;

alter table "public"."error_logs" validate constraint "fk_user_profile";

alter table "public"."files" add constraint "files_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."files" validate constraint "files_user_id_fkey";

alter table "public"."messages" add constraint "messages_bulk_message_id_fkey" FOREIGN KEY (bulk_message_id) REFERENCES bulk_messages(id) not valid;

alter table "public"."messages" validate constraint "messages_bulk_message_id_fkey";

alter table "public"."messages" add constraint "messages_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES user_profiles(id) not valid;

alter table "public"."messages" validate constraint "messages_recipient_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES user_profiles(id) not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."messages" add constraint "messages_status_check" CHECK (((status)::text = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'read'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_status_check";

alter table "public"."navigation_analytics" add constraint "navigation_analytics_navigation_item_id_fkey" FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE SET NULL not valid;

alter table "public"."navigation_analytics" validate constraint "navigation_analytics_navigation_item_id_fkey";

alter table "public"."navigation_analytics" add constraint "navigation_analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) not valid;

alter table "public"."navigation_analytics" validate constraint "navigation_analytics_user_id_fkey";

alter table "public"."navigation_item_roles" add constraint "navigation_item_roles_navigation_item_id_fkey" FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE not valid;

alter table "public"."navigation_item_roles" validate constraint "navigation_item_roles_navigation_item_id_fkey";

alter table "public"."navigation_items" add constraint "navigation_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES user_profiles(id) not valid;

alter table "public"."navigation_items" validate constraint "navigation_items_created_by_fkey";

alter table "public"."navigation_items" add constraint "navigation_items_menu_id_fkey" FOREIGN KEY (menu_id) REFERENCES navigation_menus(id) ON DELETE CASCADE not valid;

alter table "public"."navigation_items" validate constraint "navigation_items_menu_id_fkey";

alter table "public"."navigation_items" add constraint "navigation_items_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE not valid;

alter table "public"."navigation_items" validate constraint "navigation_items_parent_id_fkey";

alter table "public"."navigation_menus" add constraint "navigation_menus_created_by_fkey" FOREIGN KEY (created_by) REFERENCES user_profiles(id) not valid;

alter table "public"."navigation_menus" validate constraint "navigation_menus_created_by_fkey";

alter table "public"."thumbnails" add constraint "uploadcare_url_not_empty" CHECK ((uploadcare_url <> ''::text)) not valid;

alter table "public"."thumbnails" validate constraint "uploadcare_url_not_empty";

alter table "public"."user_message_preferences" add constraint "user_message_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) not valid;

alter table "public"."user_message_preferences" validate constraint "user_message_preferences_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_airtable_record_id_key" UNIQUE using index "user_profiles_airtable_record_id_key";

alter table "public"."user_profiles" add constraint "user_profiles_email_key" UNIQUE using index "user_profiles_email_key";

alter table "public"."user_profiles" add constraint "user_profiles_role_type_check" CHECK (((role_type)::text = ANY ((ARRAY['Setter'::character varying, 'Closer'::character varying, 'Manager'::character varying, 'Admin'::character varying, 'Executive'::character varying])::text[]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_role_type_check";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_id_fkey";

alter table "public"."user_recruiters" add constraint "user_recruiters_user_profile_id_fkey" FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_recruiters" validate constraint "user_recruiters_user_profile_id_fkey";

alter table "public"."user_supervisors" add constraint "user_supervisors_user_profile_id_fkey" FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_supervisors" validate constraint "user_supervisors_user_profile_id_fkey";

alter table "public"."widget_analytics" add constraint "widget_analytics_interaction_type_check" CHECK (((interaction_type)::text = ANY ((ARRAY['click'::character varying, 'view'::character varying, 'data_refresh'::character varying])::text[]))) not valid;

alter table "public"."widget_analytics" validate constraint "widget_analytics_interaction_type_check";

alter table "public"."widget_analytics" add constraint "widget_analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."widget_analytics" validate constraint "widget_analytics_user_id_fkey";

alter table "public"."widget_analytics" add constraint "widget_analytics_widget_id_fkey" FOREIGN KEY (widget_id) REFERENCES widgets(id) ON DELETE CASCADE not valid;

alter table "public"."widget_analytics" validate constraint "widget_analytics_widget_id_fkey";

alter table "public"."widget_categories" add constraint "widget_categories_name_key" UNIQUE using index "widget_categories_name_key";

alter table "public"."widget_configurations" add constraint "widget_configurations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."widget_configurations" validate constraint "widget_configurations_created_by_fkey";

alter table "public"."widget_configurations" add constraint "widget_configurations_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."widget_configurations" validate constraint "widget_configurations_updated_by_fkey";

alter table "public"."widget_configurations" add constraint "widget_configurations_widget_id_fkey" FOREIGN KEY (widget_id) REFERENCES widgets(id) ON DELETE CASCADE not valid;

alter table "public"."widget_configurations" validate constraint "widget_configurations_widget_id_fkey";

alter table "public"."widget_placements" add constraint "widget_placements_layout_type_check" CHECK ((layout_type = ANY (ARRAY['desktop'::text, 'mobile'::text]))) not valid;

alter table "public"."widget_placements" validate constraint "widget_placements_layout_type_check";

alter table "public"."widget_placements" add constraint "widget_placements_version_id_fkey" FOREIGN KEY (version_id) REFERENCES dashboard_versions(id) ON DELETE CASCADE not valid;

alter table "public"."widget_placements" validate constraint "widget_placements_version_id_fkey";

alter table "public"."widget_placements" add constraint "widget_placements_widget_id_fkey" FOREIGN KEY (widget_id) REFERENCES widgets(id) ON DELETE CASCADE not valid;

alter table "public"."widget_placements" validate constraint "widget_placements_widget_id_fkey";

alter table "public"."widgets" add constraint "widgets_category_id_fkey" FOREIGN KEY (category_id) REFERENCES widget_categories(id) not valid;

alter table "public"."widgets" validate constraint "widgets_category_id_fkey";

alter table "public"."widgets" add constraint "widgets_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."widgets" validate constraint "widgets_created_by_fkey";

alter table "public"."widgets" add constraint "widgets_display_type_check" CHECK (((display_type)::text = ANY ((ARRAY['iframe'::character varying, 'window'::character varying, 'route'::character varying])::text[]))) not valid;

alter table "public"."widgets" validate constraint "widgets_display_type_check";

alter table "public"."widgets" add constraint "widgets_file_id_fkey" FOREIGN KEY (file_id) REFERENCES files(id) not valid;

alter table "public"."widgets" validate constraint "widgets_file_id_fkey";

alter table "public"."widgets" add constraint "widgets_shape_check" CHECK (((shape)::text = ANY ((ARRAY['square'::character varying, 'circle'::character varying, 'rectangle'::character varying])::text[]))) not valid;

alter table "public"."widgets" validate constraint "widgets_shape_check";

alter table "public"."widgets" add constraint "widgets_widget_type_check" CHECK (((widget_type)::text = ANY ((ARRAY['redirect'::character varying, 'data_visualization'::character varying, 'interactive_tool'::character varying])::text[]))) not valid;

alter table "public"."widgets" validate constraint "widgets_widget_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_category_and_reassign(p_category_id uuid, p_fallback_category_id uuid, p_document_overrides jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  documents_updated integer := 0;
  subcategories_updated integer := 0;
  row_count integer;

  document_id text;
  new_cat_id text;
begin
  -- 1. Handle document overrides (those manually reassigned)
  for document_id, new_cat_id in
    select key, value from jsonb_each_text(p_document_overrides)
  loop
    update documents
    set document_category_id = new_cat_id::uuid
    where id = document_id::uuid and document_category_id = p_category_id;

    get diagnostics row_count = row_count;
    documents_updated := documents_updated + row_count;
  end loop;

  -- 2. Update remaining documents to fallback
  update documents
  set document_category_id = p_fallback_category_id
  where document_category_id = p_category_id
    and id not in (
      select key::uuid from jsonb_each(p_document_overrides)
    );

  get diagnostics row_count = row_count;
  documents_updated := documents_updated + row_count;

  -- 3. Reassign subcategories to fallback
  update document_subcategories
  set document_category_id = p_fallback_category_id
  where document_category_id = p_category_id;

  get diagnostics row_count = row_count;
  subcategories_updated := row_count;

  -- 4. Delete the category
  delete from document_categories
  where id = p_category_id;

  -- Return result
  return jsonb_build_object(
    'documents_updated', documents_updated,
    'subcategories_updated', subcategories_updated
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_subcategory_and_reassign(p_subcategory_id uuid, p_fallback_subcategory_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_category_id UUID;
  v_fallback_category_id UUID;
  documents_updated INTEGER := 0;
  row_count INTEGER;
BEGIN
  -- Make sure IDs are not the same
  IF p_subcategory_id = p_fallback_subcategory_id THEN
    RAISE EXCEPTION 'Fallback subcategory cannot be the same as the one being deleted';
  END IF;

  -- Ensure subcategory exists and get its category
  SELECT document_category_id INTO v_category_id
  FROM document_subcategories
  WHERE id = p_subcategory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subcategory to delete not found';
  END IF;

  -- Ensure fallback subcategory exists and get its category
  SELECT document_category_id INTO v_fallback_category_id
  FROM document_subcategories
  WHERE id = p_fallback_subcategory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fallback subcategory not found';
  END IF;

  -- Ensure both subcategories are from the same parent category
  IF v_category_id != v_fallback_category_id THEN
    RAISE EXCEPTION 'Subcategories must belong to the same category';
  END IF;

  -- Reassign documents
  UPDATE documents
  SET document_subcategory_id = p_fallback_subcategory_id
  WHERE document_subcategory_id = p_subcategory_id;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  documents_updated := row_count;

  -- Delete the subcategory
  DELETE FROM document_subcategories
  WHERE id = p_subcategory_id;

  -- Return result
  RETURN jsonb_build_object(
    'documents_updated', documents_updated
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_navigation_for_user(p_user_id uuid, p_role_type text DEFAULT NULL::text, p_team text DEFAULT NULL::text, p_area text DEFAULT NULL::text, p_region text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, menu_id uuid, parent_id uuid, title text, url text, description text, is_external boolean, open_in_iframe boolean, order_index integer, level integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH RECURSIVE nav_tree AS (
        -- Base items: top-level items (no parent) that the user can access
        SELECT 
            ni.id, 
            ni.menu_id,
            ni.parent_id,
            ni.title,
            ni.url,
            ni.description,
            ni.is_external,
            ni.open_in_iframe,
            ni.order_index,
            1 AS level
        FROM 
            navigation_items ni
        WHERE 
            ni.parent_id IS NULL
            AND is_navigation_item_currently_active(ni.is_active, ni.start_date, ni.end_date)
            AND (
                ni.is_public = true
                OR EXISTS (
                    SELECT 1 FROM navigation_item_roles nir
                    WHERE nir.navigation_item_id = ni.id
                    AND (
                        -- Exact match
                        (nir.role_type = p_role_type AND 
                         (nir.team = p_team OR nir.team IS NULL) AND
                         (nir.area = p_area OR nir.area IS NULL) AND
                         (nir.region = p_region OR nir.region IS NULL))
                        -- Role type only match (priority #1)
                        OR (nir.role_type = p_role_type AND 
                            nir.team IS NULL AND 
                            nir.area IS NULL AND 
                            nir.region IS NULL)
                    )
                )
            )
            
        UNION ALL
        
        -- Recursive part: children of items already in the tree
        SELECT 
            c.id, 
            c.menu_id,
            c.parent_id,
            c.title,
            c.url,
            c.description,
            c.is_external,
            c.open_in_iframe,
            c.order_index,
            p.level + 1
        FROM 
            navigation_items c
        JOIN 
            nav_tree p ON c.parent_id = p.id
        WHERE 
            is_navigation_item_currently_active(c.is_active, c.start_date, c.end_date)
            AND (
                c.is_public = true
                OR EXISTS (
                    SELECT 1 FROM navigation_item_roles nir
                    WHERE nir.navigation_item_id = c.id
                    AND (
                        -- Exact match
                        (nir.role_type = p_role_type AND 
                         (nir.team = p_team OR nir.team IS NULL) AND
                         (nir.area = p_area OR nir.area IS NULL) AND
                         (nir.region = p_region OR nir.region IS NULL))
                        -- Role type only match (priority #1)
                        OR (nir.role_type = p_role_type AND 
                            nir.team IS NULL AND 
                            nir.area IS NULL AND 
                            nir.region IS NULL)
                    )
                )
            )
    )
    SELECT * FROM nav_tree
    ORDER BY level, order_index, id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_organization_structure()
 RETURNS json
 LANGUAGE plpgsql
AS $function$DECLARE
    result JSON;
BEGIN
    WITH role_types AS (
        SELECT DISTINCT role_type 
        FROM user_profiles 
        WHERE role_type IS NOT NULL
        ORDER BY role_type
    ),
    teams AS (
        SELECT DISTINCT team 
        FROM user_profiles 
        WHERE team IS NOT NULL
        ORDER BY team
    ),
    areas AS (
        SELECT DISTINCT area 
        FROM user_profiles 
        WHERE area IS NOT NULL
        ORDER BY area
    ),
    regions AS (
        SELECT DISTINCT region 
        FROM user_profiles 
        WHERE region IS NOT NULL
        ORDER BY region
    )
    SELECT json_build_object(
        'roleTypes', (SELECT json_agg(role_type) FROM role_types),
        'teams', (SELECT json_agg(team) FROM teams),
        'areas', (SELECT json_agg(area) FROM areas),
        'regions', (SELECT json_agg(region) FROM regions)
    ) INTO result;
    
    RETURN result;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_user_carousel_banners(user_role_type text, user_team text, user_area text, user_region text)
 RETURNS SETOF carousel_banners_detailed
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  has_banners BOOLEAN;
BEGIN
  -- First check if any specific banners match the user's criteria
  SELECT EXISTS (
    SELECT 1 
    FROM carousel_banners_detailed cbd
    WHERE cbd.is_currently_active = TRUE -- Only active banners in valid time window
    AND (
      -- No roles assigned (public) OR matches user criteria
      cbd.role_count = 0 OR 
      matches_user_criteria(cbd.role_details, user_role_type, user_team, user_area, user_region)
    )
  ) INTO has_banners;

  -- Return user-specific banners if they exist
  IF has_banners THEN
    RETURN QUERY
    SELECT *
    FROM carousel_banners_detailed cbd
    WHERE cbd.is_currently_active = TRUE
    AND (
      cbd.role_count = 0 OR 
      matches_user_criteria(cbd.role_details, user_role_type, user_team, user_area, user_region)
    )
    ORDER BY cbd.order_index;
    RETURN;
  END IF;

  -- If no specific banners, look for default banners
  -- (Assuming default banners have a special role_type like 'default')
  RETURN QUERY
  SELECT *
  FROM carousel_banners_detailed cbd
  WHERE cbd.is_currently_active = TRUE
  AND EXISTS (
    SELECT 1 FROM jsonb_each(cbd.role_details) AS rd
    WHERE rd.value->>'role_type' = 'default'
  )
  ORDER BY cbd.order_index;

  -- If still no results, function will return empty set
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_dashboard(user_role_type text)
 RETURNS TABLE(id uuid, name text, description text, role_type text, version_id uuid, version_number integer, version_name text, widgets jsonb)
 LANGUAGE plpgsql
AS $function$
DECLARE
  dashboard_id_var UUID;
  version_id_var UUID;
BEGIN
  -- Find dashboard for user's role_type
  SELECT d.id INTO dashboard_id_var
  FROM dashboards d
  WHERE d.role_type = user_role_type
  AND d.is_active = TRUE
  LIMIT 1;

  -- If found, get the active version
  IF dashboard_id_var IS NOT NULL THEN
    SELECT dv.id INTO version_id_var
    FROM dashboard_versions dv
    WHERE dv.dashboard_id = dashboard_id_var
    AND dv.is_active = TRUE
    ORDER BY dv.version_number DESC
    LIMIT 1;
  END IF;

  -- If specific dashboard with active version found, return it with widgets
  IF dashboard_id_var IS NOT NULL AND version_id_var IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      d.id,
      d.name,
      d.description,
      d.role_type,
      dv.id AS version_id,
      dv.version_number,
      dv.name AS version_name,
      COALESCE(
        (SELECT 
          jsonb_agg(
            jsonb_build_object(
              'id', w.id,
              'name', w.name,
              'description', w.description,
              'widget_type', w.widget_type,
              'display_type', w.display_type,
              'component_path', w.component_path,
              'thumbnail_url', w.thumbnail_url,
              'category_id', w.category_id,
              'shape', w.shape,
              'size_ratio', w.size_ratio,
              'placement', jsonb_build_object(
                'position_x', wp.position_x,
                'position_y', wp.position_y,
                'width', wp.width,
                'height', wp.height,
                'layout_type', wp.layout_type
              ),
              'config', wc.config
            )
          )
        FROM widgets w
        JOIN widget_placements wp ON w.id = wp.widget_id AND wp.version_id = version_id_var
        LEFT JOIN widget_configurations wc ON w.id = wc.widget_id
        WHERE w.is_active = TRUE),
        '[]'::jsonb
      ) AS widgets
    FROM dashboards d
    JOIN dashboard_versions dv ON d.id = dv.dashboard_id AND dv.id = version_id_var
    WHERE d.id = dashboard_id_var;
  ELSE
    -- Return empty result if no dashboard or version found
    RETURN QUERY
    SELECT 
      NULL::uuid AS id,
      NULL::text AS name,
      NULL::text AS description,
      NULL::text AS role_type,
      NULL::uuid AS version_id,
      NULL::integer AS version_number,
      NULL::text AS version_name,
      '[]'::jsonb AS widgets
    WHERE false;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_navigation_items(user_role_type text, user_team text, user_area text, user_region text)
 RETURNS TABLE(id uuid, menu_id uuid, parent_id uuid, title text, url text, description text, dynamic_variables jsonb, is_external boolean, open_in_iframe boolean, order_index integer, is_active boolean, is_public boolean, start_date timestamp with time zone, end_date timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, created_by uuid, is_currently_active boolean, visible_to_roles text, role_ids uuid[], role_details jsonb, depth integer, path text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  has_navigation BOOLEAN;
BEGIN
  -- Check if user-specific navigation exists
  SELECT EXISTS (
    SELECT 1 
    FROM navigation_items_active nia
    WHERE nia.is_currently_active = TRUE
    AND (
      nia.is_public = TRUE OR
      matches_user_criteria(nia.role_details, user_role_type, user_team, user_area, user_region)
    )
  ) INTO has_navigation;

  -- Return user-specific navigation if exists
  IF has_navigation THEN
    -- Use a recursive CTE to build the navigation tree with path and depth
    RETURN QUERY
    WITH RECURSIVE nav_tree AS (
      -- Base case: get root items (no parent)
      SELECT 
        nia.*,
        0 AS depth,
        ARRAY[nia.title] AS path
      FROM navigation_items_active nia
      WHERE nia.parent_id IS NULL
      AND nia.is_currently_active = TRUE
      AND (
        nia.is_public = TRUE OR
        matches_user_criteria(nia.role_details, user_role_type, user_team, user_area, user_region)
      )
      
      UNION ALL
      
      -- Recursive case: join children with their parent
      SELECT 
        c.*,
        p.depth + 1,
        p.path || c.title
      FROM navigation_items_active c
      JOIN nav_tree p ON c.parent_id = p.id
      WHERE c.is_currently_active = TRUE
      AND (
        c.is_public = TRUE OR
        matches_user_criteria(c.role_details, user_role_type, user_team, user_area, user_region)
      )
    )
    SELECT * FROM nav_tree
    ORDER BY path, order_index;
    RETURN;
  END IF;

  -- If no specific navigation, get default navigation
  RETURN QUERY
  WITH RECURSIVE default_nav_tree AS (
    -- Base case: root items
    SELECT 
      nia.*,
      0 AS depth,
      ARRAY[nia.title] AS path
    FROM navigation_items_active nia
    WHERE nia.parent_id IS NULL
    AND nia.is_currently_active = TRUE
    AND EXISTS (
      SELECT 1 FROM jsonb_each(nia.role_details) AS rd
      WHERE rd.value->>'role_type' = 'default'
    )
    
    UNION ALL
    
    -- Recursive case
    SELECT 
      c.*,
      p.depth + 1,
      p.path || c.title
    FROM navigation_items_active c
    JOIN default_nav_tree p ON c.parent_id = p.id
    WHERE c.is_currently_active = TRUE
  )
  SELECT * FROM default_nav_tree
  ORDER BY path, order_index;

  -- If still no results, function will return empty set
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_banner_currently_active(p_is_active boolean, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN p_is_active AND
           (p_start_date IS NULL OR p_start_date <= CURRENT_TIMESTAMP) AND
           (p_end_date IS NULL OR p_end_date > CURRENT_TIMESTAMP);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_navigation_item_currently_active(p_is_active boolean, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN 
        p_is_active AND
        (p_start_date IS NULL OR p_start_date <= CURRENT_TIMESTAMP) AND
        (p_end_date IS NULL OR p_end_date >= CURRENT_TIMESTAMP);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_navigation_interaction(p_navigation_item_id uuid, p_user_id uuid, p_interaction_type text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.navigation_analytics (
        navigation_item_id,
        user_id,
        interaction_type,
        metadata
    ) VALUES (
        p_navigation_item_id,
        p_user_id,
        p_interaction_type,
        p_metadata
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.matches_user_criteria(role_details jsonb, user_role_type text, user_team text, user_area text, user_region text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  role_record JSONB;
  has_match BOOLEAN := FALSE;
BEGIN
  -- If no role details exist, return false (no explicit permissions)
  IF role_details IS NULL OR jsonb_typeof(role_details) != 'object' THEN
    RETURN FALSE;
  END IF;

  -- Check if there are any keys in the object
  IF (SELECT COUNT(*) FROM jsonb_object_keys(role_details)) = 0 THEN
    RETURN FALSE;
  END IF;

  -- Check each role record to see if user matches criteria
  FOR role_record IN SELECT value FROM jsonb_each(role_details) LOOP
    IF (
      -- Match role_type (exact match or wildcard NULL)
      (role_record->>'role_type' IS NULL OR role_record->>'role_type' = user_role_type) AND
      -- Match team (exact match or wildcard NULL)
      (role_record->>'team' IS NULL OR role_record->>'team' = user_team) AND
      -- Match area (exact match or wildcard NULL)
      (role_record->>'area' IS NULL OR role_record->>'area' = user_area) AND
      -- Match region (exact match or wildcard NULL)
      (role_record->>'region' IS NULL OR role_record->>'region' = user_region)
    ) THEN
      has_match := TRUE;
      EXIT; -- Found a match, no need to check further
    END IF;
  END LOOP;
  
  RETURN has_match;
END;
$function$
;

create or replace view "public"."navigation_items_active" as  SELECT ni.id,
    ni.menu_id,
    ni.parent_id,
    ni.title,
    ni.url,
    ni.description,
    ni.dynamic_variables,
    ni.is_external,
    ni.open_in_iframe,
    ni.order_index,
    ni.is_active,
    ni.is_public,
    ni.start_date,
    ni.end_date,
    ni.created_at,
    ni.updated_at,
    ni.created_by,
    is_navigation_item_currently_active(ni.is_active, ni.start_date, ni.end_date) AS is_currently_active,
    string_agg(DISTINCT nir.role_type, ', '::text) AS visible_to_roles,
    array_agg(DISTINCT nir.id) AS role_ids,
    jsonb_object_agg(COALESCE((nir.id)::text, 'null'::text), jsonb_build_object('role_type', nir.role_type, 'team', nir.team, 'area', nir.area, 'region', nir.region)) FILTER (WHERE (nir.id IS NOT NULL)) AS role_details
   FROM (navigation_items ni
     LEFT JOIN navigation_item_roles nir ON ((ni.id = nir.navigation_item_id)))
  GROUP BY ni.id
  ORDER BY ni.order_index, ni.created_at;


CREATE OR REPLACE FUNCTION public.reorder_documents(p_documents jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  doc jsonb;
  updated_count int := 0;
  row_count int;
begin
  for doc in
    select * from jsonb_array_elements(p_documents)
  loop
    update documents
    set
      "order" = (doc->>'order')::int,
      document_category_id = nullif(doc->>'document_category_id', '')::uuid,
      document_subcategory_id = nullif(doc->>'document_subcategory_id', '')::uuid
    where id = (doc->>'id')::uuid;

    get diagnostics row_count = row_count;
    updated_count := updated_count + row_count;
  end loop;

  return jsonb_build_object(
    'documents_updated', updated_count
  );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_widget_configuration(p_widget_id text, p_config jsonb, p_created_by text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  widget_type TEXT;
  clean_config JSONB;
  result JSONB;
BEGIN
  -- Get the widget type
  SELECT widget_type INTO widget_type FROM widgets WHERE id = p_widget_id;
  
  -- Initialize clean config structure based on widget type
  CASE widget_type
    WHEN 'redirect' THEN
      clean_config = jsonb_build_object(
        'styles', COALESCE(p_config->'styles', '{}'::jsonb),
        'redirectUrl', COALESCE(p_config->>'redirectUrl', ''),
        'title', COALESCE(p_config->>'title', ''),
        'subtitle', COALESCE(p_config->>'subtitle', ''),
        'settings', COALESCE(p_config->'settings', '{}'::jsonb)
      );
    WHEN 'embed' THEN
      clean_config = jsonb_build_object(
        'styles', COALESCE(p_config->'styles', '{}'::jsonb),
        'embedUrl', COALESCE(p_config->>'embedUrl', ''),
        'title', COALESCE(p_config->>'title', ''),
        'allowFullscreen', COALESCE((p_config->>'allowFullscreen')::boolean, true),
        'settings', COALESCE(p_config->'settings', '{}'::jsonb)
      );
    -- Add cases for other widget types
    ELSE
      clean_config = p_config;
  END CASE;
  
  -- Insert or update the configuration
  INSERT INTO widget_configurations (widget_id, config, created_by)
  VALUES (p_widget_id, clean_config, p_created_by)
  ON CONFLICT (widget_id) 
  DO UPDATE SET 
    config = clean_config,
    updated_at = now()
  RETURNING config INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_user_profile(p_email text, p_airtable_record_id text, p_first_name text, p_last_name text, p_role text, p_role_type text, p_team text, p_area text, p_region text, p_phone text, p_profile_pic_url text, p_google_user_id text, p_hire_date text, p_user_key text, p_recruiting_record_id text, p_health_dashboard text, p_salesforce_id text, p_shirt_size text DEFAULT NULL::text, p_department text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_hire_date date;
    v_user_id uuid;
BEGIN
    -- Get the user_id from auth.users based on google_user_id
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE id = p_google_user_id::uuid;

    -- Safely convert hire_date
    BEGIN
        IF p_hire_date IS NULL OR p_hire_date = '' THEN
            v_hire_date := NULL;
        ELSE
            v_hire_date := p_hire_date::date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_hire_date := NULL;
    END;

    INSERT INTO public.user_profiles (
        email,
        user_id,
        airtable_record_id,
        first_name,
        last_name,
        role,
        role_type,
        team,
        area,
        region,
        phone,
        profile_pic_url,
        google_user_id,
        hire_date,
        user_key,
        recruiting_record_id,
        health_dashboard,
        salesforce_id,
        shirt_size,
        department,
        last_airtable_sync,
        updated_at
    ) VALUES (
        p_email,
        v_user_id,
        p_airtable_record_id,
        p_first_name,
        p_last_name,
        p_role,
        p_role_type,
        p_team,
        p_area,
        p_region,
        p_phone,
        p_profile_pic_url,
        p_google_user_id,
        v_hire_date,
        p_user_key,
        p_recruiting_record_id,
        p_health_dashboard,
        p_salesforce_id,
        p_shirt_size,
        p_department,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        airtable_record_id = EXCLUDED.airtable_record_id,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        role_type = EXCLUDED.role_type,
        team = EXCLUDED.team,
        area = EXCLUDED.area,
        region = EXCLUDED.region,
        phone = EXCLUDED.phone,
        profile_pic_url = EXCLUDED.profile_pic_url,
        google_user_id = EXCLUDED.google_user_id,
        hire_date = EXCLUDED.hire_date,
        user_key = EXCLUDED.user_key,
        recruiting_record_id = EXCLUDED.recruiting_record_id,
        health_dashboard = EXCLUDED.health_dashboard,
        salesforce_id = EXCLUDED.salesforce_id,
        shirt_size = EXCLUDED.shirt_size,
        department = EXCLUDED.department,
        last_airtable_sync = EXCLUDED.last_airtable_sync,
        updated_at = EXCLUDED.updated_at;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_widget_config_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

create or replace view "public"."carousel_banners_detailed" as  SELECT cb.id,
    cb.title,
    cb.description,
    cb.file_id,
    cb.order_index,
    cb.is_active,
    cb.created_at,
    cb.updated_at,
    cb.click_behavior,
    cb.url,
    cb.open_in_iframe,
    cb.vimeo_video_id,
    cb.vimeo_video_title,
    cb.start_date,
    cb.end_date,
    f.cdn_url AS banner_url,
    f.original_filename,
    string_agg(DISTINCT cbr.role_type, ', '::text) AS visible_to_roles,
    count(cbr.id) AS role_count,
    is_banner_currently_active(cb.is_active, cb.start_date, cb.end_date) AS is_currently_active,
    array_agg(DISTINCT cbr.id) AS role_ids,
    jsonb_object_agg(COALESCE((cbr.id)::text, 'null'::text), jsonb_build_object('role_type', cbr.role_type, 'team', cbr.team, 'area', cbr.area, 'region', cbr.region)) FILTER (WHERE (cbr.id IS NOT NULL)) AS role_details
   FROM ((carousel_banners cb
     LEFT JOIN files f ON ((cb.file_id = f.id)))
     LEFT JOIN carousel_banner_roles cbr ON ((cb.id = cbr.banner_id)))
  GROUP BY cb.id, f.cdn_url, f.original_filename;


grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant references on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant trigger on table "public"."activity_logs" to "anon";

grant truncate on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant references on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant trigger on table "public"."activity_logs" to "authenticated";

grant truncate on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "local_dev_user";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant references on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant trigger on table "public"."activity_logs" to "service_role";

grant truncate on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."bulk_messages" to "anon";

grant insert on table "public"."bulk_messages" to "anon";

grant references on table "public"."bulk_messages" to "anon";

grant select on table "public"."bulk_messages" to "anon";

grant trigger on table "public"."bulk_messages" to "anon";

grant truncate on table "public"."bulk_messages" to "anon";

grant update on table "public"."bulk_messages" to "anon";

grant delete on table "public"."bulk_messages" to "authenticated";

grant insert on table "public"."bulk_messages" to "authenticated";

grant references on table "public"."bulk_messages" to "authenticated";

grant select on table "public"."bulk_messages" to "authenticated";

grant trigger on table "public"."bulk_messages" to "authenticated";

grant truncate on table "public"."bulk_messages" to "authenticated";

grant update on table "public"."bulk_messages" to "authenticated";

grant select on table "public"."bulk_messages" to "local_dev_user";

grant delete on table "public"."bulk_messages" to "service_role";

grant insert on table "public"."bulk_messages" to "service_role";

grant references on table "public"."bulk_messages" to "service_role";

grant select on table "public"."bulk_messages" to "service_role";

grant trigger on table "public"."bulk_messages" to "service_role";

grant truncate on table "public"."bulk_messages" to "service_role";

grant update on table "public"."bulk_messages" to "service_role";

grant delete on table "public"."carousel_banner_roles" to "anon";

grant insert on table "public"."carousel_banner_roles" to "anon";

grant references on table "public"."carousel_banner_roles" to "anon";

grant select on table "public"."carousel_banner_roles" to "anon";

grant trigger on table "public"."carousel_banner_roles" to "anon";

grant truncate on table "public"."carousel_banner_roles" to "anon";

grant update on table "public"."carousel_banner_roles" to "anon";

grant delete on table "public"."carousel_banner_roles" to "authenticated";

grant insert on table "public"."carousel_banner_roles" to "authenticated";

grant references on table "public"."carousel_banner_roles" to "authenticated";

grant select on table "public"."carousel_banner_roles" to "authenticated";

grant trigger on table "public"."carousel_banner_roles" to "authenticated";

grant truncate on table "public"."carousel_banner_roles" to "authenticated";

grant update on table "public"."carousel_banner_roles" to "authenticated";

grant select on table "public"."carousel_banner_roles" to "local_dev_user";

grant delete on table "public"."carousel_banner_roles" to "service_role";

grant insert on table "public"."carousel_banner_roles" to "service_role";

grant references on table "public"."carousel_banner_roles" to "service_role";

grant select on table "public"."carousel_banner_roles" to "service_role";

grant trigger on table "public"."carousel_banner_roles" to "service_role";

grant truncate on table "public"."carousel_banner_roles" to "service_role";

grant update on table "public"."carousel_banner_roles" to "service_role";

grant delete on table "public"."carousel_banners" to "anon";

grant insert on table "public"."carousel_banners" to "anon";

grant references on table "public"."carousel_banners" to "anon";

grant select on table "public"."carousel_banners" to "anon";

grant trigger on table "public"."carousel_banners" to "anon";

grant truncate on table "public"."carousel_banners" to "anon";

grant update on table "public"."carousel_banners" to "anon";

grant delete on table "public"."carousel_banners" to "authenticated";

grant insert on table "public"."carousel_banners" to "authenticated";

grant references on table "public"."carousel_banners" to "authenticated";

grant select on table "public"."carousel_banners" to "authenticated";

grant trigger on table "public"."carousel_banners" to "authenticated";

grant truncate on table "public"."carousel_banners" to "authenticated";

grant update on table "public"."carousel_banners" to "authenticated";

grant select on table "public"."carousel_banners" to "local_dev_user";

grant delete on table "public"."carousel_banners" to "service_role";

grant insert on table "public"."carousel_banners" to "service_role";

grant references on table "public"."carousel_banners" to "service_role";

grant select on table "public"."carousel_banners" to "service_role";

grant trigger on table "public"."carousel_banners" to "service_role";

grant truncate on table "public"."carousel_banners" to "service_role";

grant update on table "public"."carousel_banners" to "service_role";

grant delete on table "public"."dashboard_drafts" to "anon";

grant insert on table "public"."dashboard_drafts" to "anon";

grant references on table "public"."dashboard_drafts" to "anon";

grant select on table "public"."dashboard_drafts" to "anon";

grant trigger on table "public"."dashboard_drafts" to "anon";

grant truncate on table "public"."dashboard_drafts" to "anon";

grant update on table "public"."dashboard_drafts" to "anon";

grant delete on table "public"."dashboard_drafts" to "authenticated";

grant insert on table "public"."dashboard_drafts" to "authenticated";

grant references on table "public"."dashboard_drafts" to "authenticated";

grant select on table "public"."dashboard_drafts" to "authenticated";

grant trigger on table "public"."dashboard_drafts" to "authenticated";

grant truncate on table "public"."dashboard_drafts" to "authenticated";

grant update on table "public"."dashboard_drafts" to "authenticated";

grant select on table "public"."dashboard_drafts" to "local_dev_user";

grant delete on table "public"."dashboard_drafts" to "service_role";

grant insert on table "public"."dashboard_drafts" to "service_role";

grant references on table "public"."dashboard_drafts" to "service_role";

grant select on table "public"."dashboard_drafts" to "service_role";

grant trigger on table "public"."dashboard_drafts" to "service_role";

grant truncate on table "public"."dashboard_drafts" to "service_role";

grant update on table "public"."dashboard_drafts" to "service_role";

grant delete on table "public"."dashboard_versions" to "anon";

grant insert on table "public"."dashboard_versions" to "anon";

grant references on table "public"."dashboard_versions" to "anon";

grant select on table "public"."dashboard_versions" to "anon";

grant trigger on table "public"."dashboard_versions" to "anon";

grant truncate on table "public"."dashboard_versions" to "anon";

grant update on table "public"."dashboard_versions" to "anon";

grant delete on table "public"."dashboard_versions" to "authenticated";

grant insert on table "public"."dashboard_versions" to "authenticated";

grant references on table "public"."dashboard_versions" to "authenticated";

grant select on table "public"."dashboard_versions" to "authenticated";

grant trigger on table "public"."dashboard_versions" to "authenticated";

grant truncate on table "public"."dashboard_versions" to "authenticated";

grant update on table "public"."dashboard_versions" to "authenticated";

grant select on table "public"."dashboard_versions" to "local_dev_user";

grant delete on table "public"."dashboard_versions" to "service_role";

grant insert on table "public"."dashboard_versions" to "service_role";

grant references on table "public"."dashboard_versions" to "service_role";

grant select on table "public"."dashboard_versions" to "service_role";

grant trigger on table "public"."dashboard_versions" to "service_role";

grant truncate on table "public"."dashboard_versions" to "service_role";

grant update on table "public"."dashboard_versions" to "service_role";

grant delete on table "public"."dashboards" to "anon";

grant insert on table "public"."dashboards" to "anon";

grant references on table "public"."dashboards" to "anon";

grant select on table "public"."dashboards" to "anon";

grant trigger on table "public"."dashboards" to "anon";

grant truncate on table "public"."dashboards" to "anon";

grant update on table "public"."dashboards" to "anon";

grant delete on table "public"."dashboards" to "authenticated";

grant insert on table "public"."dashboards" to "authenticated";

grant references on table "public"."dashboards" to "authenticated";

grant select on table "public"."dashboards" to "authenticated";

grant trigger on table "public"."dashboards" to "authenticated";

grant truncate on table "public"."dashboards" to "authenticated";

grant update on table "public"."dashboards" to "authenticated";

grant select on table "public"."dashboards" to "local_dev_user";

grant delete on table "public"."dashboards" to "service_role";

grant insert on table "public"."dashboards" to "service_role";

grant references on table "public"."dashboards" to "service_role";

grant select on table "public"."dashboards" to "service_role";

grant trigger on table "public"."dashboards" to "service_role";

grant truncate on table "public"."dashboards" to "service_role";

grant update on table "public"."dashboards" to "service_role";

grant delete on table "public"."document_categories" to "anon";

grant insert on table "public"."document_categories" to "anon";

grant references on table "public"."document_categories" to "anon";

grant select on table "public"."document_categories" to "anon";

grant trigger on table "public"."document_categories" to "anon";

grant truncate on table "public"."document_categories" to "anon";

grant update on table "public"."document_categories" to "anon";

grant delete on table "public"."document_categories" to "authenticated";

grant insert on table "public"."document_categories" to "authenticated";

grant references on table "public"."document_categories" to "authenticated";

grant select on table "public"."document_categories" to "authenticated";

grant trigger on table "public"."document_categories" to "authenticated";

grant truncate on table "public"."document_categories" to "authenticated";

grant update on table "public"."document_categories" to "authenticated";

grant select on table "public"."document_categories" to "local_dev_user";

grant delete on table "public"."document_categories" to "service_role";

grant insert on table "public"."document_categories" to "service_role";

grant references on table "public"."document_categories" to "service_role";

grant select on table "public"."document_categories" to "service_role";

grant trigger on table "public"."document_categories" to "service_role";

grant truncate on table "public"."document_categories" to "service_role";

grant update on table "public"."document_categories" to "service_role";

grant delete on table "public"."document_chunks" to "anon";

grant insert on table "public"."document_chunks" to "anon";

grant references on table "public"."document_chunks" to "anon";

grant select on table "public"."document_chunks" to "anon";

grant trigger on table "public"."document_chunks" to "anon";

grant truncate on table "public"."document_chunks" to "anon";

grant update on table "public"."document_chunks" to "anon";

grant delete on table "public"."document_chunks" to "authenticated";

grant insert on table "public"."document_chunks" to "authenticated";

grant references on table "public"."document_chunks" to "authenticated";

grant select on table "public"."document_chunks" to "authenticated";

grant trigger on table "public"."document_chunks" to "authenticated";

grant truncate on table "public"."document_chunks" to "authenticated";

grant update on table "public"."document_chunks" to "authenticated";

grant select on table "public"."document_chunks" to "local_dev_user";

grant delete on table "public"."document_chunks" to "service_role";

grant insert on table "public"."document_chunks" to "service_role";

grant references on table "public"."document_chunks" to "service_role";

grant select on table "public"."document_chunks" to "service_role";

grant trigger on table "public"."document_chunks" to "service_role";

grant truncate on table "public"."document_chunks" to "service_role";

grant update on table "public"."document_chunks" to "service_role";

grant delete on table "public"."document_content" to "anon";

grant insert on table "public"."document_content" to "anon";

grant references on table "public"."document_content" to "anon";

grant select on table "public"."document_content" to "anon";

grant trigger on table "public"."document_content" to "anon";

grant truncate on table "public"."document_content" to "anon";

grant update on table "public"."document_content" to "anon";

grant delete on table "public"."document_content" to "authenticated";

grant insert on table "public"."document_content" to "authenticated";

grant references on table "public"."document_content" to "authenticated";

grant select on table "public"."document_content" to "authenticated";

grant trigger on table "public"."document_content" to "authenticated";

grant truncate on table "public"."document_content" to "authenticated";

grant update on table "public"."document_content" to "authenticated";

grant select on table "public"."document_content" to "local_dev_user";

grant delete on table "public"."document_content" to "service_role";

grant insert on table "public"."document_content" to "service_role";

grant references on table "public"."document_content" to "service_role";

grant select on table "public"."document_content" to "service_role";

grant trigger on table "public"."document_content" to "service_role";

grant truncate on table "public"."document_content" to "service_role";

grant update on table "public"."document_content" to "service_role";

grant delete on table "public"."document_embeddings" to "anon";

grant insert on table "public"."document_embeddings" to "anon";

grant references on table "public"."document_embeddings" to "anon";

grant select on table "public"."document_embeddings" to "anon";

grant trigger on table "public"."document_embeddings" to "anon";

grant truncate on table "public"."document_embeddings" to "anon";

grant update on table "public"."document_embeddings" to "anon";

grant delete on table "public"."document_embeddings" to "authenticated";

grant insert on table "public"."document_embeddings" to "authenticated";

grant references on table "public"."document_embeddings" to "authenticated";

grant select on table "public"."document_embeddings" to "authenticated";

grant trigger on table "public"."document_embeddings" to "authenticated";

grant truncate on table "public"."document_embeddings" to "authenticated";

grant update on table "public"."document_embeddings" to "authenticated";

grant select on table "public"."document_embeddings" to "local_dev_user";

grant delete on table "public"."document_embeddings" to "service_role";

grant insert on table "public"."document_embeddings" to "service_role";

grant references on table "public"."document_embeddings" to "service_role";

grant select on table "public"."document_embeddings" to "service_role";

grant trigger on table "public"."document_embeddings" to "service_role";

grant truncate on table "public"."document_embeddings" to "service_role";

grant update on table "public"."document_embeddings" to "service_role";

grant delete on table "public"."document_subcategories" to "anon";

grant insert on table "public"."document_subcategories" to "anon";

grant references on table "public"."document_subcategories" to "anon";

grant select on table "public"."document_subcategories" to "anon";

grant trigger on table "public"."document_subcategories" to "anon";

grant truncate on table "public"."document_subcategories" to "anon";

grant update on table "public"."document_subcategories" to "anon";

grant delete on table "public"."document_subcategories" to "authenticated";

grant insert on table "public"."document_subcategories" to "authenticated";

grant references on table "public"."document_subcategories" to "authenticated";

grant select on table "public"."document_subcategories" to "authenticated";

grant trigger on table "public"."document_subcategories" to "authenticated";

grant truncate on table "public"."document_subcategories" to "authenticated";

grant update on table "public"."document_subcategories" to "authenticated";

grant select on table "public"."document_subcategories" to "local_dev_user";

grant delete on table "public"."document_subcategories" to "service_role";

grant insert on table "public"."document_subcategories" to "service_role";

grant references on table "public"."document_subcategories" to "service_role";

grant select on table "public"."document_subcategories" to "service_role";

grant trigger on table "public"."document_subcategories" to "service_role";

grant truncate on table "public"."document_subcategories" to "service_role";

grant update on table "public"."document_subcategories" to "service_role";

grant delete on table "public"."document_tag_assignments" to "anon";

grant insert on table "public"."document_tag_assignments" to "anon";

grant references on table "public"."document_tag_assignments" to "anon";

grant select on table "public"."document_tag_assignments" to "anon";

grant trigger on table "public"."document_tag_assignments" to "anon";

grant truncate on table "public"."document_tag_assignments" to "anon";

grant update on table "public"."document_tag_assignments" to "anon";

grant delete on table "public"."document_tag_assignments" to "authenticated";

grant insert on table "public"."document_tag_assignments" to "authenticated";

grant references on table "public"."document_tag_assignments" to "authenticated";

grant select on table "public"."document_tag_assignments" to "authenticated";

grant trigger on table "public"."document_tag_assignments" to "authenticated";

grant truncate on table "public"."document_tag_assignments" to "authenticated";

grant update on table "public"."document_tag_assignments" to "authenticated";

grant select on table "public"."document_tag_assignments" to "local_dev_user";

grant delete on table "public"."document_tag_assignments" to "service_role";

grant insert on table "public"."document_tag_assignments" to "service_role";

grant references on table "public"."document_tag_assignments" to "service_role";

grant select on table "public"."document_tag_assignments" to "service_role";

grant trigger on table "public"."document_tag_assignments" to "service_role";

grant truncate on table "public"."document_tag_assignments" to "service_role";

grant update on table "public"."document_tag_assignments" to "service_role";

grant delete on table "public"."document_tags" to "anon";

grant insert on table "public"."document_tags" to "anon";

grant references on table "public"."document_tags" to "anon";

grant select on table "public"."document_tags" to "anon";

grant trigger on table "public"."document_tags" to "anon";

grant truncate on table "public"."document_tags" to "anon";

grant update on table "public"."document_tags" to "anon";

grant delete on table "public"."document_tags" to "authenticated";

grant insert on table "public"."document_tags" to "authenticated";

grant references on table "public"."document_tags" to "authenticated";

grant select on table "public"."document_tags" to "authenticated";

grant trigger on table "public"."document_tags" to "authenticated";

grant truncate on table "public"."document_tags" to "authenticated";

grant update on table "public"."document_tags" to "authenticated";

grant select on table "public"."document_tags" to "local_dev_user";

grant delete on table "public"."document_tags" to "service_role";

grant insert on table "public"."document_tags" to "service_role";

grant references on table "public"."document_tags" to "service_role";

grant select on table "public"."document_tags" to "service_role";

grant trigger on table "public"."document_tags" to "service_role";

grant truncate on table "public"."document_tags" to "service_role";

grant update on table "public"."document_tags" to "service_role";

grant delete on table "public"."document_versions" to "anon";

grant insert on table "public"."document_versions" to "anon";

grant references on table "public"."document_versions" to "anon";

grant select on table "public"."document_versions" to "anon";

grant trigger on table "public"."document_versions" to "anon";

grant truncate on table "public"."document_versions" to "anon";

grant update on table "public"."document_versions" to "anon";

grant delete on table "public"."document_versions" to "authenticated";

grant insert on table "public"."document_versions" to "authenticated";

grant references on table "public"."document_versions" to "authenticated";

grant select on table "public"."document_versions" to "authenticated";

grant trigger on table "public"."document_versions" to "authenticated";

grant truncate on table "public"."document_versions" to "authenticated";

grant update on table "public"."document_versions" to "authenticated";

grant select on table "public"."document_versions" to "local_dev_user";

grant delete on table "public"."document_versions" to "service_role";

grant insert on table "public"."document_versions" to "service_role";

grant references on table "public"."document_versions" to "service_role";

grant select on table "public"."document_versions" to "service_role";

grant trigger on table "public"."document_versions" to "service_role";

grant truncate on table "public"."document_versions" to "service_role";

grant update on table "public"."document_versions" to "service_role";

grant delete on table "public"."document_visibility" to "anon";

grant insert on table "public"."document_visibility" to "anon";

grant references on table "public"."document_visibility" to "anon";

grant select on table "public"."document_visibility" to "anon";

grant trigger on table "public"."document_visibility" to "anon";

grant truncate on table "public"."document_visibility" to "anon";

grant update on table "public"."document_visibility" to "anon";

grant delete on table "public"."document_visibility" to "authenticated";

grant insert on table "public"."document_visibility" to "authenticated";

grant references on table "public"."document_visibility" to "authenticated";

grant select on table "public"."document_visibility" to "authenticated";

grant trigger on table "public"."document_visibility" to "authenticated";

grant truncate on table "public"."document_visibility" to "authenticated";

grant update on table "public"."document_visibility" to "authenticated";

grant select on table "public"."document_visibility" to "local_dev_user";

grant delete on table "public"."document_visibility" to "service_role";

grant insert on table "public"."document_visibility" to "service_role";

grant references on table "public"."document_visibility" to "service_role";

grant select on table "public"."document_visibility" to "service_role";

grant trigger on table "public"."document_visibility" to "service_role";

grant truncate on table "public"."document_visibility" to "service_role";

grant update on table "public"."document_visibility" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "local_dev_user";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."draft_widget_placements" to "anon";

grant insert on table "public"."draft_widget_placements" to "anon";

grant references on table "public"."draft_widget_placements" to "anon";

grant select on table "public"."draft_widget_placements" to "anon";

grant trigger on table "public"."draft_widget_placements" to "anon";

grant truncate on table "public"."draft_widget_placements" to "anon";

grant update on table "public"."draft_widget_placements" to "anon";

grant delete on table "public"."draft_widget_placements" to "authenticated";

grant insert on table "public"."draft_widget_placements" to "authenticated";

grant references on table "public"."draft_widget_placements" to "authenticated";

grant select on table "public"."draft_widget_placements" to "authenticated";

grant trigger on table "public"."draft_widget_placements" to "authenticated";

grant truncate on table "public"."draft_widget_placements" to "authenticated";

grant update on table "public"."draft_widget_placements" to "authenticated";

grant select on table "public"."draft_widget_placements" to "local_dev_user";

grant delete on table "public"."draft_widget_placements" to "service_role";

grant insert on table "public"."draft_widget_placements" to "service_role";

grant references on table "public"."draft_widget_placements" to "service_role";

grant select on table "public"."draft_widget_placements" to "service_role";

grant trigger on table "public"."draft_widget_placements" to "service_role";

grant truncate on table "public"."draft_widget_placements" to "service_role";

grant update on table "public"."draft_widget_placements" to "service_role";

grant delete on table "public"."error_logs" to "anon";

grant insert on table "public"."error_logs" to "anon";

grant references on table "public"."error_logs" to "anon";

grant select on table "public"."error_logs" to "anon";

grant trigger on table "public"."error_logs" to "anon";

grant truncate on table "public"."error_logs" to "anon";

grant update on table "public"."error_logs" to "anon";

grant delete on table "public"."error_logs" to "authenticated";

grant insert on table "public"."error_logs" to "authenticated";

grant references on table "public"."error_logs" to "authenticated";

grant select on table "public"."error_logs" to "authenticated";

grant trigger on table "public"."error_logs" to "authenticated";

grant truncate on table "public"."error_logs" to "authenticated";

grant update on table "public"."error_logs" to "authenticated";

grant select on table "public"."error_logs" to "local_dev_user";

grant delete on table "public"."error_logs" to "service_role";

grant insert on table "public"."error_logs" to "service_role";

grant references on table "public"."error_logs" to "service_role";

grant select on table "public"."error_logs" to "service_role";

grant trigger on table "public"."error_logs" to "service_role";

grant truncate on table "public"."error_logs" to "service_role";

grant update on table "public"."error_logs" to "service_role";

grant delete on table "public"."files" to "anon";

grant insert on table "public"."files" to "anon";

grant references on table "public"."files" to "anon";

grant select on table "public"."files" to "anon";

grant trigger on table "public"."files" to "anon";

grant truncate on table "public"."files" to "anon";

grant update on table "public"."files" to "anon";

grant delete on table "public"."files" to "authenticated";

grant insert on table "public"."files" to "authenticated";

grant references on table "public"."files" to "authenticated";

grant select on table "public"."files" to "authenticated";

grant trigger on table "public"."files" to "authenticated";

grant truncate on table "public"."files" to "authenticated";

grant update on table "public"."files" to "authenticated";

grant select on table "public"."files" to "local_dev_user";

grant delete on table "public"."files" to "service_role";

grant insert on table "public"."files" to "service_role";

grant references on table "public"."files" to "service_role";

grant select on table "public"."files" to "service_role";

grant trigger on table "public"."files" to "service_role";

grant truncate on table "public"."files" to "service_role";

grant update on table "public"."files" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "local_dev_user";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."navigation_analytics" to "anon";

grant insert on table "public"."navigation_analytics" to "anon";

grant references on table "public"."navigation_analytics" to "anon";

grant select on table "public"."navigation_analytics" to "anon";

grant trigger on table "public"."navigation_analytics" to "anon";

grant truncate on table "public"."navigation_analytics" to "anon";

grant update on table "public"."navigation_analytics" to "anon";

grant delete on table "public"."navigation_analytics" to "authenticated";

grant insert on table "public"."navigation_analytics" to "authenticated";

grant references on table "public"."navigation_analytics" to "authenticated";

grant select on table "public"."navigation_analytics" to "authenticated";

grant trigger on table "public"."navigation_analytics" to "authenticated";

grant truncate on table "public"."navigation_analytics" to "authenticated";

grant update on table "public"."navigation_analytics" to "authenticated";

grant select on table "public"."navigation_analytics" to "local_dev_user";

grant delete on table "public"."navigation_analytics" to "service_role";

grant insert on table "public"."navigation_analytics" to "service_role";

grant references on table "public"."navigation_analytics" to "service_role";

grant select on table "public"."navigation_analytics" to "service_role";

grant trigger on table "public"."navigation_analytics" to "service_role";

grant truncate on table "public"."navigation_analytics" to "service_role";

grant update on table "public"."navigation_analytics" to "service_role";

grant delete on table "public"."navigation_item_roles" to "anon";

grant insert on table "public"."navigation_item_roles" to "anon";

grant references on table "public"."navigation_item_roles" to "anon";

grant select on table "public"."navigation_item_roles" to "anon";

grant trigger on table "public"."navigation_item_roles" to "anon";

grant truncate on table "public"."navigation_item_roles" to "anon";

grant update on table "public"."navigation_item_roles" to "anon";

grant delete on table "public"."navigation_item_roles" to "authenticated";

grant insert on table "public"."navigation_item_roles" to "authenticated";

grant references on table "public"."navigation_item_roles" to "authenticated";

grant select on table "public"."navigation_item_roles" to "authenticated";

grant trigger on table "public"."navigation_item_roles" to "authenticated";

grant truncate on table "public"."navigation_item_roles" to "authenticated";

grant update on table "public"."navigation_item_roles" to "authenticated";

grant select on table "public"."navigation_item_roles" to "local_dev_user";

grant delete on table "public"."navigation_item_roles" to "service_role";

grant insert on table "public"."navigation_item_roles" to "service_role";

grant references on table "public"."navigation_item_roles" to "service_role";

grant select on table "public"."navigation_item_roles" to "service_role";

grant trigger on table "public"."navigation_item_roles" to "service_role";

grant truncate on table "public"."navigation_item_roles" to "service_role";

grant update on table "public"."navigation_item_roles" to "service_role";

grant delete on table "public"."navigation_items" to "anon";

grant insert on table "public"."navigation_items" to "anon";

grant references on table "public"."navigation_items" to "anon";

grant select on table "public"."navigation_items" to "anon";

grant trigger on table "public"."navigation_items" to "anon";

grant truncate on table "public"."navigation_items" to "anon";

grant update on table "public"."navigation_items" to "anon";

grant delete on table "public"."navigation_items" to "authenticated";

grant insert on table "public"."navigation_items" to "authenticated";

grant references on table "public"."navigation_items" to "authenticated";

grant select on table "public"."navigation_items" to "authenticated";

grant trigger on table "public"."navigation_items" to "authenticated";

grant truncate on table "public"."navigation_items" to "authenticated";

grant update on table "public"."navigation_items" to "authenticated";

grant select on table "public"."navigation_items" to "local_dev_user";

grant delete on table "public"."navigation_items" to "service_role";

grant insert on table "public"."navigation_items" to "service_role";

grant references on table "public"."navigation_items" to "service_role";

grant select on table "public"."navigation_items" to "service_role";

grant trigger on table "public"."navigation_items" to "service_role";

grant truncate on table "public"."navigation_items" to "service_role";

grant update on table "public"."navigation_items" to "service_role";

grant delete on table "public"."navigation_menus" to "anon";

grant insert on table "public"."navigation_menus" to "anon";

grant references on table "public"."navigation_menus" to "anon";

grant select on table "public"."navigation_menus" to "anon";

grant trigger on table "public"."navigation_menus" to "anon";

grant truncate on table "public"."navigation_menus" to "anon";

grant update on table "public"."navigation_menus" to "anon";

grant delete on table "public"."navigation_menus" to "authenticated";

grant insert on table "public"."navigation_menus" to "authenticated";

grant references on table "public"."navigation_menus" to "authenticated";

grant select on table "public"."navigation_menus" to "authenticated";

grant trigger on table "public"."navigation_menus" to "authenticated";

grant truncate on table "public"."navigation_menus" to "authenticated";

grant update on table "public"."navigation_menus" to "authenticated";

grant select on table "public"."navigation_menus" to "local_dev_user";

grant delete on table "public"."navigation_menus" to "service_role";

grant insert on table "public"."navigation_menus" to "service_role";

grant references on table "public"."navigation_menus" to "service_role";

grant select on table "public"."navigation_menus" to "service_role";

grant trigger on table "public"."navigation_menus" to "service_role";

grant truncate on table "public"."navigation_menus" to "service_role";

grant update on table "public"."navigation_menus" to "service_role";

grant delete on table "public"."thumbnails" to "anon";

grant insert on table "public"."thumbnails" to "anon";

grant references on table "public"."thumbnails" to "anon";

grant select on table "public"."thumbnails" to "anon";

grant trigger on table "public"."thumbnails" to "anon";

grant truncate on table "public"."thumbnails" to "anon";

grant update on table "public"."thumbnails" to "anon";

grant delete on table "public"."thumbnails" to "authenticated";

grant insert on table "public"."thumbnails" to "authenticated";

grant references on table "public"."thumbnails" to "authenticated";

grant select on table "public"."thumbnails" to "authenticated";

grant trigger on table "public"."thumbnails" to "authenticated";

grant truncate on table "public"."thumbnails" to "authenticated";

grant update on table "public"."thumbnails" to "authenticated";

grant select on table "public"."thumbnails" to "local_dev_user";

grant delete on table "public"."thumbnails" to "service_role";

grant insert on table "public"."thumbnails" to "service_role";

grant references on table "public"."thumbnails" to "service_role";

grant select on table "public"."thumbnails" to "service_role";

grant trigger on table "public"."thumbnails" to "service_role";

grant truncate on table "public"."thumbnails" to "service_role";

grant update on table "public"."thumbnails" to "service_role";

grant delete on table "public"."user_message_preferences" to "anon";

grant insert on table "public"."user_message_preferences" to "anon";

grant references on table "public"."user_message_preferences" to "anon";

grant select on table "public"."user_message_preferences" to "anon";

grant trigger on table "public"."user_message_preferences" to "anon";

grant truncate on table "public"."user_message_preferences" to "anon";

grant update on table "public"."user_message_preferences" to "anon";

grant delete on table "public"."user_message_preferences" to "authenticated";

grant insert on table "public"."user_message_preferences" to "authenticated";

grant references on table "public"."user_message_preferences" to "authenticated";

grant select on table "public"."user_message_preferences" to "authenticated";

grant trigger on table "public"."user_message_preferences" to "authenticated";

grant truncate on table "public"."user_message_preferences" to "authenticated";

grant update on table "public"."user_message_preferences" to "authenticated";

grant select on table "public"."user_message_preferences" to "local_dev_user";

grant delete on table "public"."user_message_preferences" to "service_role";

grant insert on table "public"."user_message_preferences" to "service_role";

grant references on table "public"."user_message_preferences" to "service_role";

grant select on table "public"."user_message_preferences" to "service_role";

grant trigger on table "public"."user_message_preferences" to "service_role";

grant truncate on table "public"."user_message_preferences" to "service_role";

grant update on table "public"."user_message_preferences" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "local_dev_user";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

grant delete on table "public"."user_recruiters" to "anon";

grant insert on table "public"."user_recruiters" to "anon";

grant references on table "public"."user_recruiters" to "anon";

grant select on table "public"."user_recruiters" to "anon";

grant trigger on table "public"."user_recruiters" to "anon";

grant truncate on table "public"."user_recruiters" to "anon";

grant update on table "public"."user_recruiters" to "anon";

grant delete on table "public"."user_recruiters" to "authenticated";

grant insert on table "public"."user_recruiters" to "authenticated";

grant references on table "public"."user_recruiters" to "authenticated";

grant select on table "public"."user_recruiters" to "authenticated";

grant trigger on table "public"."user_recruiters" to "authenticated";

grant truncate on table "public"."user_recruiters" to "authenticated";

grant update on table "public"."user_recruiters" to "authenticated";

grant select on table "public"."user_recruiters" to "local_dev_user";

grant delete on table "public"."user_recruiters" to "service_role";

grant insert on table "public"."user_recruiters" to "service_role";

grant references on table "public"."user_recruiters" to "service_role";

grant select on table "public"."user_recruiters" to "service_role";

grant trigger on table "public"."user_recruiters" to "service_role";

grant truncate on table "public"."user_recruiters" to "service_role";

grant update on table "public"."user_recruiters" to "service_role";

grant delete on table "public"."user_supervisors" to "anon";

grant insert on table "public"."user_supervisors" to "anon";

grant references on table "public"."user_supervisors" to "anon";

grant select on table "public"."user_supervisors" to "anon";

grant trigger on table "public"."user_supervisors" to "anon";

grant truncate on table "public"."user_supervisors" to "anon";

grant update on table "public"."user_supervisors" to "anon";

grant delete on table "public"."user_supervisors" to "authenticated";

grant insert on table "public"."user_supervisors" to "authenticated";

grant references on table "public"."user_supervisors" to "authenticated";

grant select on table "public"."user_supervisors" to "authenticated";

grant trigger on table "public"."user_supervisors" to "authenticated";

grant truncate on table "public"."user_supervisors" to "authenticated";

grant update on table "public"."user_supervisors" to "authenticated";

grant select on table "public"."user_supervisors" to "local_dev_user";

grant delete on table "public"."user_supervisors" to "service_role";

grant insert on table "public"."user_supervisors" to "service_role";

grant references on table "public"."user_supervisors" to "service_role";

grant select on table "public"."user_supervisors" to "service_role";

grant trigger on table "public"."user_supervisors" to "service_role";

grant truncate on table "public"."user_supervisors" to "service_role";

grant update on table "public"."user_supervisors" to "service_role";

grant delete on table "public"."widget_analytics" to "anon";

grant insert on table "public"."widget_analytics" to "anon";

grant references on table "public"."widget_analytics" to "anon";

grant select on table "public"."widget_analytics" to "anon";

grant trigger on table "public"."widget_analytics" to "anon";

grant truncate on table "public"."widget_analytics" to "anon";

grant update on table "public"."widget_analytics" to "anon";

grant delete on table "public"."widget_analytics" to "authenticated";

grant insert on table "public"."widget_analytics" to "authenticated";

grant references on table "public"."widget_analytics" to "authenticated";

grant select on table "public"."widget_analytics" to "authenticated";

grant trigger on table "public"."widget_analytics" to "authenticated";

grant truncate on table "public"."widget_analytics" to "authenticated";

grant update on table "public"."widget_analytics" to "authenticated";

grant select on table "public"."widget_analytics" to "local_dev_user";

grant delete on table "public"."widget_analytics" to "service_role";

grant insert on table "public"."widget_analytics" to "service_role";

grant references on table "public"."widget_analytics" to "service_role";

grant select on table "public"."widget_analytics" to "service_role";

grant trigger on table "public"."widget_analytics" to "service_role";

grant truncate on table "public"."widget_analytics" to "service_role";

grant update on table "public"."widget_analytics" to "service_role";

grant delete on table "public"."widget_categories" to "anon";

grant insert on table "public"."widget_categories" to "anon";

grant references on table "public"."widget_categories" to "anon";

grant select on table "public"."widget_categories" to "anon";

grant trigger on table "public"."widget_categories" to "anon";

grant truncate on table "public"."widget_categories" to "anon";

grant update on table "public"."widget_categories" to "anon";

grant delete on table "public"."widget_categories" to "authenticated";

grant insert on table "public"."widget_categories" to "authenticated";

grant references on table "public"."widget_categories" to "authenticated";

grant select on table "public"."widget_categories" to "authenticated";

grant trigger on table "public"."widget_categories" to "authenticated";

grant truncate on table "public"."widget_categories" to "authenticated";

grant update on table "public"."widget_categories" to "authenticated";

grant select on table "public"."widget_categories" to "local_dev_user";

grant delete on table "public"."widget_categories" to "service_role";

grant insert on table "public"."widget_categories" to "service_role";

grant references on table "public"."widget_categories" to "service_role";

grant select on table "public"."widget_categories" to "service_role";

grant trigger on table "public"."widget_categories" to "service_role";

grant truncate on table "public"."widget_categories" to "service_role";

grant update on table "public"."widget_categories" to "service_role";

grant delete on table "public"."widget_configurations" to "anon";

grant insert on table "public"."widget_configurations" to "anon";

grant references on table "public"."widget_configurations" to "anon";

grant select on table "public"."widget_configurations" to "anon";

grant trigger on table "public"."widget_configurations" to "anon";

grant truncate on table "public"."widget_configurations" to "anon";

grant update on table "public"."widget_configurations" to "anon";

grant delete on table "public"."widget_configurations" to "authenticated";

grant insert on table "public"."widget_configurations" to "authenticated";

grant references on table "public"."widget_configurations" to "authenticated";

grant select on table "public"."widget_configurations" to "authenticated";

grant trigger on table "public"."widget_configurations" to "authenticated";

grant truncate on table "public"."widget_configurations" to "authenticated";

grant update on table "public"."widget_configurations" to "authenticated";

grant select on table "public"."widget_configurations" to "local_dev_user";

grant delete on table "public"."widget_configurations" to "service_role";

grant insert on table "public"."widget_configurations" to "service_role";

grant references on table "public"."widget_configurations" to "service_role";

grant select on table "public"."widget_configurations" to "service_role";

grant trigger on table "public"."widget_configurations" to "service_role";

grant truncate on table "public"."widget_configurations" to "service_role";

grant update on table "public"."widget_configurations" to "service_role";

grant delete on table "public"."widget_placements" to "anon";

grant insert on table "public"."widget_placements" to "anon";

grant references on table "public"."widget_placements" to "anon";

grant select on table "public"."widget_placements" to "anon";

grant trigger on table "public"."widget_placements" to "anon";

grant truncate on table "public"."widget_placements" to "anon";

grant update on table "public"."widget_placements" to "anon";

grant delete on table "public"."widget_placements" to "authenticated";

grant insert on table "public"."widget_placements" to "authenticated";

grant references on table "public"."widget_placements" to "authenticated";

grant select on table "public"."widget_placements" to "authenticated";

grant trigger on table "public"."widget_placements" to "authenticated";

grant truncate on table "public"."widget_placements" to "authenticated";

grant update on table "public"."widget_placements" to "authenticated";

grant select on table "public"."widget_placements" to "local_dev_user";

grant delete on table "public"."widget_placements" to "service_role";

grant insert on table "public"."widget_placements" to "service_role";

grant references on table "public"."widget_placements" to "service_role";

grant select on table "public"."widget_placements" to "service_role";

grant trigger on table "public"."widget_placements" to "service_role";

grant truncate on table "public"."widget_placements" to "service_role";

grant update on table "public"."widget_placements" to "service_role";

grant delete on table "public"."widgets" to "anon";

grant insert on table "public"."widgets" to "anon";

grant references on table "public"."widgets" to "anon";

grant select on table "public"."widgets" to "anon";

grant trigger on table "public"."widgets" to "anon";

grant truncate on table "public"."widgets" to "anon";

grant update on table "public"."widgets" to "anon";

grant delete on table "public"."widgets" to "authenticated";

grant insert on table "public"."widgets" to "authenticated";

grant references on table "public"."widgets" to "authenticated";

grant select on table "public"."widgets" to "authenticated";

grant trigger on table "public"."widgets" to "authenticated";

grant truncate on table "public"."widgets" to "authenticated";

grant update on table "public"."widgets" to "authenticated";

grant select on table "public"."widgets" to "local_dev_user";

grant delete on table "public"."widgets" to "service_role";

grant insert on table "public"."widgets" to "service_role";

grant references on table "public"."widgets" to "service_role";

grant select on table "public"."widgets" to "service_role";

grant trigger on table "public"."widgets" to "service_role";

grant truncate on table "public"."widgets" to "service_role";

grant update on table "public"."widgets" to "service_role";

create policy "Allow authenticated users to read activity logs"
on "public"."activity_logs"
as permissive
for select
to authenticated
using (true);


create policy "Allow service role to write activity logs"
on "public"."activity_logs"
as permissive
for insert
to service_role
with check (true);


create policy "Allow admins to create categories"
on "public"."document_categories"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to delete categories"
on "public"."document_categories"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to update categories"
on "public"."document_categories"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow authenticated users to view categories"
on "public"."document_categories"
as permissive
for select
to authenticated
using (true);


create policy "Allow authenticated users to delete document chunks"
on "public"."document_chunks"
as permissive
for delete
to authenticated
using (true);


create policy "Allow authenticated users to insert document chunks"
on "public"."document_chunks"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow authenticated users to view document chunks"
on "public"."document_chunks"
as permissive
for select
to authenticated
using (true);


create policy "Allow service role to manage document chunks"
on "public"."document_chunks"
as permissive
for all
to service_role
using (true);


create policy "Allow authenticated users to insert document content"
on "public"."document_content"
as permissive
for insert
to authenticated
with check (true);


create policy "Allow authenticated users to update document content"
on "public"."document_content"
as permissive
for update
to authenticated
using (true);


create policy "Allow authenticated users to view document content"
on "public"."document_content"
as permissive
for select
to authenticated
using (true);


create policy "Allow service role to manage document content"
on "public"."document_content"
as permissive
for all
to service_role
using (true);


create policy "Allow admins to create subcategories"
on "public"."document_subcategories"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to delete subcategories"
on "public"."document_subcategories"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to update subcategories"
on "public"."document_subcategories"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow authenticated users to view subcategories"
on "public"."document_subcategories"
as permissive
for select
to authenticated
using (true);


create policy "Admins can delete documents"
on "public"."documents"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND ((user_profiles.role_type)::text = 'Admin'::text)))));


create policy "Admins can insert documents"
on "public"."documents"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND ((user_profiles.role_type)::text = 'Admin'::text)))));


create policy "Admins can update documents"
on "public"."documents"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.user_id = auth.uid()) AND ((user_profiles.role_type)::text = 'Admin'::text)))));


create policy "Anyone can view documents"
on "public"."documents"
as permissive
for select
to public
using (true);


create policy "Allow authenticated users to read error logs"
on "public"."error_logs"
as permissive
for select
to authenticated
using (true);


create policy "Allow service role to write error logs"
on "public"."error_logs"
as permissive
for insert
to service_role
with check (true);


create policy "Allow authenticated users to insert files"
on "public"."files"
as permissive
for insert
to authenticated
with check ((auth.role() = 'authenticated'::text));


create policy "Allow users to view files"
on "public"."files"
as permissive
for select
to public
using (true);


create policy "Users can insert their own files"
on "public"."files"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own files"
on "public"."files"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Enable insert for authenticated users"
on "public"."navigation_analytics"
as permissive
for insert
to authenticated
with check (true);


create policy "Enable read access for admin users"
on "public"."navigation_analytics"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to create navigation item roles"
on "public"."navigation_item_roles"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to delete navigation item roles"
on "public"."navigation_item_roles"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to update navigation item roles"
on "public"."navigation_item_roles"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow authenticated users to view navigation item roles"
on "public"."navigation_item_roles"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for authenticated users"
on "public"."navigation_item_roles"
as permissive
for select
to authenticated
using (true);


create policy "Enable write access for admin users"
on "public"."navigation_item_roles"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to create navigation items"
on "public"."navigation_items"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to delete navigation items"
on "public"."navigation_items"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow admins to update navigation items"
on "public"."navigation_items"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow authenticated users to view navigation items"
on "public"."navigation_items"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for authenticated users"
on "public"."navigation_items"
as permissive
for select
to authenticated
using (true);


create policy "Enable write access for admin users"
on "public"."navigation_items"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Enable delete access for admin users"
on "public"."navigation_menus"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Enable insert access for admin users"
on "public"."navigation_menus"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Enable read access for all authenticated users"
on "public"."navigation_menus"
as permissive
for select
to authenticated
using (true);


create policy "Enable read access for authenticated users"
on "public"."navigation_menus"
as permissive
for select
to authenticated
using (true);


create policy "Enable update access for admin users"
on "public"."navigation_menus"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Enable write access for admin users"
on "public"."navigation_menus"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.user_id = auth.uid()) AND ((up.role_type)::text = 'Admin'::text)))));


create policy "Allow public read access"
on "public"."thumbnails"
as permissive
for select
to public
using (true);


create policy "Admins can view all profiles"
on "public"."user_profiles"
as permissive
for select
to public
using ((((auth.jwt() ->> 'email'::text) ~~ '%@purelightpower.com'::text) AND ((auth.jwt() ->> 'email'::text) = 'james.younger@purelightpower.com'::text)));


create policy "Allow sync service to manage profiles"
on "public"."user_profiles"
as permissive
for all
to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));


create policy "Users can create own profile"
on "public"."user_profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can read own profile"
on "public"."user_profiles"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update own profile"
on "public"."user_profiles"
as permissive
for update
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_widget_configurations_timestamp BEFORE UPDATE ON public.widget_configurations FOR EACH ROW EXECUTE FUNCTION update_widget_config_timestamp();


