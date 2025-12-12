export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_concepts: {
        Row: {
          aspect_ratio: string | null
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          shot_list: string[] | null
          structured_prompt: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          shot_list?: string[] | null
          structured_prompt: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          shot_list?: string[] | null
          structured_prompt?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_concepts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_name: string
          category: string | null
          color_scheme: string | null
          created_at: string
          id: string
          key_values: string[] | null
          mood: string | null
          product_description: string | null
          recommended_palette: string | null
          target_audience: string | null
          tone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand_name: string
          category?: string | null
          color_scheme?: string | null
          created_at?: string
          id?: string
          key_values?: string[] | null
          mood?: string | null
          product_description?: string | null
          recommended_palette?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand_name?: string
          category?: string | null
          color_scheme?: string | null
          created_at?: string
          id?: string
          key_values?: string[] | null
          mood?: string | null
          product_description?: string | null
          recommended_palette?: string | null
          target_audience?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          aspect_ratio: string | null
          camera_settings: Json | null
          campaign_id: string | null
          concept_id: string | null
          created_at: string
          generation_type: string | null
          id: string
          image_url: string
          is_public: boolean
          parent_image_id: string | null
          seed: number | null
          structured_prompt: Json
          user_id: string | null
          version: number
          visual_settings: Json | null
        }
        Insert: {
          aspect_ratio?: string | null
          camera_settings?: Json | null
          campaign_id?: string | null
          concept_id?: string | null
          created_at?: string
          generation_type?: string | null
          id?: string
          image_url: string
          is_public?: boolean
          parent_image_id?: string | null
          seed?: number | null
          structured_prompt: Json
          user_id?: string | null
          version?: number
          visual_settings?: Json | null
        }
        Update: {
          aspect_ratio?: string | null
          camera_settings?: Json | null
          campaign_id?: string | null
          concept_id?: string | null
          created_at?: string
          generation_type?: string | null
          id?: string
          image_url?: string
          is_public?: boolean
          parent_image_id?: string | null
          seed?: number | null
          structured_prompt?: Json
          user_id?: string | null
          version?: number
          visual_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "ad_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_parent_image_id_fkey"
            columns: ["parent_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
