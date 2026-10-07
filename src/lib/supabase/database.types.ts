// Generated from the sofiivkawater-dev schema (Supabase "generate TypeScript types").
// Regenerate after migrations: `supabase gen types typescript --project-id <ref>`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type FK = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      admin_users: {
        Row: { created_at: string; email: string; name: string; role: string; user_id: string };
        Insert: { created_at?: string; email: string; name?: string; role?: string; user_id: string };
        Update: { created_at?: string; email?: string; name?: string; role?: string; user_id?: string };
        Relationships: [];
      };
      audit_log: {
        Row: { action: string; actor: string | null; created_at: string; diff: Json; entity: string; entity_id: string; id: number };
        Insert: { action: string; actor?: string | null; created_at?: string; diff?: Json; entity: string; entity_id: string; id?: never };
        Update: { action?: string; actor?: string | null; created_at?: string; diff?: Json; entity?: string; entity_id?: string; id?: never };
        Relationships: [FK];
      };
      banners: {
        Row: {
          created_at: string; cta_label: string; ends_at: string | null; eyebrow: string; href: string; id: string;
          image_desktop: string | null; image_mobile: string | null; is_active: boolean; placement: string; sort: number;
          starts_at: string | null; subtitle: string; theme: string; title: string; updated_at: string;
        };
        Insert: {
          created_at?: string; cta_label?: string; ends_at?: string | null; eyebrow?: string; href?: string; id?: string;
          image_desktop?: string | null; image_mobile?: string | null; is_active?: boolean; placement?: string; sort?: number;
          starts_at?: string | null; subtitle?: string; theme?: string; title: string; updated_at?: string;
        };
        Update: {
          created_at?: string; cta_label?: string; ends_at?: string | null; eyebrow?: string; href?: string; id?: string;
          image_desktop?: string | null; image_mobile?: string | null; is_active?: boolean; placement?: string; sort?: number;
          starts_at?: string | null; subtitle?: string; theme?: string; title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          group_key: string; image: string | null; is_hidden: boolean; key: string; meta_description: string; seo_text: string;
          seo_title: string; short_title: string; sort: number; subtitle: string; title: string; updated_at: string;
        };
        Insert: {
          group_key?: string; image?: string | null; is_hidden?: boolean; key: string; meta_description?: string; seo_text?: string;
          seo_title?: string; short_title?: string; sort?: number; subtitle?: string; title: string; updated_at?: string;
        };
        Update: {
          group_key?: string; image?: string | null; is_hidden?: boolean; key?: string; meta_description?: string; seo_text?: string;
          seo_title?: string; short_title?: string; sort?: number; subtitle?: string; title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      collection_items: {
        Row: { collection_id: string; product_id: string; sort: number };
        Insert: { collection_id: string; product_id: string; sort?: number };
        Update: { collection_id?: string; product_id?: string; sort?: number };
        Relationships: [FK, FK];
      };
      collections: {
        Row: {
          created_at: string; eyebrow: string; id: string; link_href: string; link_label: string; show_on_home: boolean;
          slug: string; sort: number; title: string; updated_at: string;
        };
        Insert: {
          created_at?: string; eyebrow?: string; id?: string; link_href?: string; link_label?: string; show_on_home?: boolean;
          slug: string; sort?: number; title: string; updated_at?: string;
        };
        Update: {
          created_at?: string; eyebrow?: string; id?: string; link_href?: string; link_label?: string; show_on_home?: boolean;
          slug?: string; sort?: number; title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      lead_events: {
        Row: { actor: string | null; created_at: string; data: Json; id: number; lead_id: string; type: string };
        Insert: { actor?: string | null; created_at?: string; data?: Json; id?: never; lead_id: string; type: string };
        Update: { actor?: string | null; created_at?: string; data?: Json; id?: never; lead_id?: string; type?: string };
        Relationships: [FK, FK];
      };
      leads: {
        Row: {
          address: string | null; assigned_to: string | null; client_ip: string | null; comment: string | null;
          completed_at: string | null; created_at: string; currency: string; customer_name: string; email: string | null;
          external_id: string; fbc: string | null; fbclid: string | null; fbp: string | null; ga_client_id: string | null;
          gclid: string | null; id: string; items: Json; kind: string; landing_page: string | null; lead_event_id: string | null;
          manager_note: string | null; message: string | null; number: number; payment_method: string; payment_status: string;
          phone: string; referrer: string | null; source: string; source_detail: string | null; status: string;
          telegram_sent: boolean; total: number; tracking: Json; updated_at: string; user_agent: string | null;
          utm_campaign: string | null; utm_content: string | null; utm_medium: string | null; utm_source: string | null;
          utm_term: string | null;
        };
        Insert: {
          address?: string | null; assigned_to?: string | null; client_ip?: string | null; comment?: string | null;
          completed_at?: string | null; created_at?: string; currency?: string; customer_name?: string; email?: string | null;
          external_id: string; fbc?: string | null; fbclid?: string | null; fbp?: string | null; ga_client_id?: string | null;
          gclid?: string | null; id?: string; items?: Json; kind: string; landing_page?: string | null; lead_event_id?: string | null;
          manager_note?: string | null; message?: string | null; number?: never; payment_method?: string; payment_status?: string;
          phone?: string; referrer?: string | null; source?: string; source_detail?: string | null; status?: string;
          telegram_sent?: boolean; total?: number; tracking?: Json; updated_at?: string; user_agent?: string | null;
          utm_campaign?: string | null; utm_content?: string | null; utm_medium?: string | null; utm_source?: string | null;
          utm_term?: string | null;
        };
        Update: {
          address?: string | null; assigned_to?: string | null; client_ip?: string | null; comment?: string | null;
          completed_at?: string | null; created_at?: string; currency?: string; customer_name?: string; email?: string | null;
          external_id?: string; fbc?: string | null; fbclid?: string | null; fbp?: string | null; ga_client_id?: string | null;
          gclid?: string | null; id?: string; items?: Json; kind?: string; landing_page?: string | null; lead_event_id?: string | null;
          manager_note?: string | null; message?: string | null; number?: never; payment_method?: string; payment_status?: string;
          phone?: string; referrer?: string | null; source?: string; source_detail?: string | null; status?: string;
          telegram_sent?: boolean; total?: number; tracking?: Json; updated_at?: string; user_agent?: string | null;
          utm_campaign?: string | null; utm_content?: string | null; utm_medium?: string | null; utm_source?: string | null;
          utm_term?: string | null;
        };
        Relationships: [FK];
      };
      media_assets: {
        Row: {
          alt: string; created_at: string; created_by: string | null; folder: string; height: number | null; id: string;
          mime_type: string; path: string; size_bytes: number; url: string; width: number | null;
        };
        Insert: {
          alt?: string; created_at?: string; created_by?: string | null; folder?: string; height?: number | null; id?: string;
          mime_type: string; path: string; size_bytes?: number; url: string; width?: number | null;
        };
        Update: {
          alt?: string; created_at?: string; created_by?: string | null; folder?: string; height?: number | null; id?: string;
          mime_type?: string; path?: string; size_bytes?: number; url?: string; width?: number | null;
        };
        Relationships: [FK];
      };
      posts: {
        Row: {
          body: string; cover_image: string | null; created_at: string; excerpt: string; gallery: Json; id: string;
          is_published: boolean; kind: string; location: string; meta_description: string; published_at: string;
          related_href: string; related_label: string; seo_title: string; slug: string; title: string; updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body?: string; cover_image?: string | null; created_at?: string; excerpt?: string; gallery?: Json; id?: string;
          is_published?: boolean; kind?: string; location?: string; meta_description?: string; published_at?: string;
          related_href?: string; related_label?: string; seo_title?: string; slug: string; title: string; updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string; cover_image?: string | null; created_at?: string; excerpt?: string; gallery?: Json; id?: string;
          is_published?: boolean; kind?: string; location?: string; meta_description?: string; published_at?: string;
          related_href?: string; related_label?: string; seo_title?: string; slug?: string; title?: string; updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [FK];
      };
      products: {
        Row: {
          attributes: Json; category: string; created_at: string; cta_type: string; description: string; details: Json;
          id: string; image: string | null; images: Json; in_stock: boolean; is_hidden: boolean; is_hit: boolean;
          is_promo: boolean; name: string; old_price: number | null; old_price_usd: number | null; price: number;
          price_usd: number | null; sku: string; slug: string; sort: number; updated_at: string;
        };
        Insert: {
          attributes?: Json; category: string; created_at?: string; cta_type?: string; description?: string; details?: Json;
          id?: string; image?: string | null; images?: Json; in_stock?: boolean; is_hidden?: boolean; is_hit?: boolean;
          is_promo?: boolean; name: string; old_price?: number | null; old_price_usd?: number | null; price?: number;
          price_usd?: number | null; sku: string; slug: string; sort?: number; updated_at?: string;
        };
        Update: {
          attributes?: Json; category?: string; created_at?: string; cta_type?: string; description?: string; details?: Json;
          id?: string; image?: string | null; images?: Json; in_stock?: boolean; is_hidden?: boolean; is_hit?: boolean;
          is_promo?: boolean; name?: string; old_price?: number | null; old_price_usd?: number | null; price?: number;
          price_usd?: number | null; sku?: string; slug?: string; sort?: number; updated_at?: string;
        };
        Relationships: [FK];
      };
      site_menus: {
        Row: { items: Json; key: string; updated_at: string; updated_by: string | null };
        Insert: { items?: Json; key: string; updated_at?: string; updated_by?: string | null };
        Update: { items?: Json; key?: string; updated_at?: string; updated_by?: string | null };
        Relationships: [FK];
      };
      site_pages: {
        Row: { content: Json; key: string; updated_at: string; updated_by: string | null };
        Insert: { content: Json; key: string; updated_at?: string; updated_by?: string | null };
        Update: { content?: Json; key?: string; updated_at?: string; updated_by?: string | null };
        Relationships: [FK];
      };
      site_settings: {
        Row: { is_public: boolean; key: string; updated_at: string; updated_by: string | null; value: Json };
        Insert: { is_public?: boolean; key: string; updated_at?: string; updated_by?: string | null; value?: Json };
        Update: { is_public?: boolean; key?: string; updated_at?: string; updated_by?: string | null; value?: Json };
        Relationships: [FK];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      reorder_categories: { Args: { keys: string[] }; Returns: undefined };
      reorder_collections: { Args: { ids: string[] }; Returns: undefined };
      reorder_collection_items: { Args: { collection: string; product_ids: string[] }; Returns: undefined };
      refresh_usd_rate: { Args: Record<string, never>; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Update payload of a public table. */
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

/** Row type of a public table, e.g. `Tables<"products">`. */
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
