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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string
          created_at: string
          description_en: string | null
          description_pt: string | null
          icon: string
          id: string
          name_en: string
          name_pt: string
          order: number
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description_en?: string | null
          description_pt?: string | null
          icon?: string
          id?: string
          name_en: string
          name_pt: string
          order?: number
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description_en?: string | null
          description_pt?: string | null
          icon?: string
          id?: string
          name_en?: string
          name_pt?: string
          order?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          author_id: string | null
          body_en: string | null
          body_pt: string | null
          category_id: string
          cover_image_url: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["content_difficulty"]
          external_url: string | null
          featured: boolean
          file_url: string | null
          id: string
          published: boolean
          reading_time_min: number
          summary_en: string | null
          summary_pt: string | null
          tags: string[]
          title_en: string
          title_pt: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body_en?: string | null
          body_pt?: string | null
          category_id: string
          cover_image_url?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["content_difficulty"]
          external_url?: string | null
          featured?: boolean
          file_url?: string | null
          id?: string
          published?: boolean
          reading_time_min?: number
          summary_en?: string | null
          summary_pt?: string | null
          tags?: string[]
          title_en: string
          title_pt: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body_en?: string | null
          body_pt?: string | null
          category_id?: string
          cover_image_url?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["content_difficulty"]
          external_url?: string | null
          featured?: boolean
          file_url?: string | null
          id?: string
          published?: boolean
          reading_time_min?: number
          summary_en?: string | null
          summary_pt?: string | null
          tags?: string[]
          title_en?: string
          title_pt?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          content_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["reaction_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["reaction_target"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["reaction_type"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["reaction_target"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          edited_at: string | null
          flagged: boolean
          id: string
          parent_reply_id: string | null
          topic_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          edited_at?: string | null
          flagged?: boolean
          id?: string
          parent_reply_id?: string | null
          topic_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          flagged?: boolean
          id?: string
          parent_reply_id?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          author_id: string
          body: string
          category: string
          created_at: string
          flagged: boolean
          id: string
          last_reply_at: string
          locked: boolean
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id: string
          body: string
          category?: string
          created_at?: string
          flagged?: boolean
          id?: string
          last_reply_at?: string
          locked?: boolean
          pinned?: boolean
          tags?: string[]
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string
          body?: string
          category?: string
          created_at?: string
          flagged?: boolean
          id?: string
          last_reply_at?: string
          locked?: boolean
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "member" | "admin"
      content_difficulty: "beginner" | "intermediate" | "advanced"
      content_type: "article" | "pdf" | "link" | "video" | "guide"
      reaction_target: "topic" | "reply"
      reaction_type: "like" | "insightful" | "agree"
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
    Enums: {
      app_role: ["member", "admin"],
      content_difficulty: ["beginner", "intermediate", "advanced"],
      content_type: ["article", "pdf", "link", "video", "guide"],
      reaction_target: ["topic", "reply"],
      reaction_type: ["like", "insightful", "agree"],
    },
  },
} as const
