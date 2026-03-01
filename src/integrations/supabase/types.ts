export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      communes: {
        Row: {
          id: string
          name: string
          wilaya_id: string
        }
        Insert: {
          id?: string
          name: string
          wilaya_id: string
        }
        Update: {
          id?: string
          name?: string
          wilaya_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communes_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          active: boolean | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          active?: boolean | null
          id?: string
          label?: string
          slug?: string
        }
        Relationships: []
      }
      provider_beauty: {
        Row: {
          provider_id: string
          services_included: string[] | null
        }
        Insert: {
          provider_id: string
          services_included?: string[] | null
        }
        Update: {
          provider_id?: string
          services_included?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_beauty_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_catering: {
        Row: {
          delivery_options: string[] | null
          product_types: string[] | null
          provider_id: string
        }
        Insert: {
          delivery_options?: string[] | null
          product_types?: string[] | null
          provider_id: string
        }
        Update: {
          delivery_options?: string[] | null
          product_types?: string[] | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_catering_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_leads: {
        Row: {
          contact_type: string
          created_at: string
          id: string
          provider_id: string
          viewer_id: string | null
        }
        Insert: {
          contact_type: string
          created_at?: string
          id?: string
          provider_id: string
          viewer_id?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string
          id?: string
          provider_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_leads_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_media: {
        Row: {
          created_at: string
          id: string
          is_main: boolean | null
          media_url: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_main?: boolean | null
          media_url: string
          provider_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_main?: boolean | null
          media_url?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_media_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_music: {
        Row: {
          equipment_provided: string[] | null
          music_styles: string[] | null
          provider_id: string
        }
        Insert: {
          equipment_provided?: string[] | null
          music_styles?: string[] | null
          provider_id: string
        }
        Update: {
          equipment_provided?: string[] | null
          music_styles?: string[] | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_music_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_rentals: {
        Row: {
          caution_amount: number | null
          provider_id: string
          vehicle_types: string[] | null
          with_chauffeur: boolean | null
        }
        Insert: {
          caution_amount?: number | null
          provider_id: string
          vehicle_types?: string[] | null
          with_chauffeur?: boolean | null
        }
        Update: {
          caution_amount?: number | null
          provider_id?: string
          vehicle_types?: string[] | null
          with_chauffeur?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_rentals_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_venues: {
        Row: {
          acces_pmr: boolean | null
          acompte_pourcentage: number | null
          animateur_inclus: boolean | null
          cafe_inclus: boolean | null
          cameras_incluses: boolean | null
          capacity_max: number | null
          capacity_min: number | null
          chauffage: boolean | null
          climatisation: boolean | null
          contraintes_regles: string | null
          couverts_par_service: number | null
          cuisine_equipee: boolean | null
          dj_inclus: boolean | null
          eau_incluse: boolean | null
          horaires_journee: boolean | null
          horaires_nuit: boolean | null
          horaires_soiree: boolean | null
          jardin: boolean | null
          jeux_lumiere: boolean | null
          jus_inclus: boolean | null
          loge_invites_nb: number | null
          loge_maries_nb: number | null
          mobilier_inclus: boolean | null
          nappes_incluses: boolean | null
          nettoyage_inclus: boolean | null
          parking_places: number | null
          piscine: boolean | null
          piste_danse: boolean | null
          politique_annulation: string | null
          provider_id: string
          salle_attente: boolean | null
          salle_dinatoire: boolean | null
          salle_femmes_cap: number | null
          salle_hommes_cap: number | null
          salle_mixte_cap: number | null
          securite_incluse: boolean | null
          separated_spaces: boolean | null
          serveurs_mixte: boolean | null
          serveuses_femmes: boolean | null
          sonorisation_base: boolean | null
          surface_m2: number | null
          terrasse: boolean | null
          the_inclus: boolean | null
          traiteur_type: string | null
          vaisselle_incluse: boolean | null
          valet_inclus: boolean | null
          ventilation: boolean | null
          videoprojecteur: boolean | null
        }
        Insert: {
          acces_pmr?: boolean | null
          acompte_pourcentage?: number | null
          animateur_inclus?: boolean | null
          cafe_inclus?: boolean | null
          cameras_incluses?: boolean | null
          capacity_max?: number | null
          capacity_min?: number | null
          chauffage?: boolean | null
          climatisation?: boolean | null
          contraintes_regles?: string | null
          couverts_par_service?: number | null
          cuisine_equipee?: boolean | null
          dj_inclus?: boolean | null
          eau_incluse?: boolean | null
          horaires_journee?: boolean | null
          horaires_nuit?: boolean | null
          horaires_soiree?: boolean | null
          jardin?: boolean | null
          jeux_lumiere?: boolean | null
          jus_inclus?: boolean | null
          loge_invites_nb?: number | null
          loge_maries_nb?: number | null
          mobilier_inclus?: boolean | null
          nappes_incluses?: boolean | null
          nettoyage_inclus?: boolean | null
          parking_places?: number | null
          piscine?: boolean | null
          piste_danse?: boolean | null
          politique_annulation?: string | null
          provider_id: string
          salle_attente?: boolean | null
          salle_dinatoire?: boolean | null
          salle_femmes_cap?: number | null
          salle_hommes_cap?: number | null
          salle_mixte_cap?: number | null
          securite_incluse?: boolean | null
          separated_spaces?: boolean | null
          serveurs_mixte?: boolean | null
          serveuses_femmes?: boolean | null
          sonorisation_base?: boolean | null
          surface_m2?: number | null
          terrasse?: boolean | null
          the_inclus?: boolean | null
          traiteur_type?: string | null
          vaisselle_incluse?: boolean | null
          valet_inclus?: boolean | null
          ventilation?: boolean | null
          videoprojecteur?: boolean | null
        }
        Update: {
          acces_pmr?: boolean | null
          acompte_pourcentage?: number | null
          animateur_inclus?: boolean | null
          cafe_inclus?: boolean | null
          cameras_incluses?: boolean | null
          capacity_max?: number | null
          capacity_min?: number | null
          chauffage?: boolean | null
          climatisation?: boolean | null
          contraintes_regles?: string | null
          couverts_par_service?: number | null
          cuisine_equipee?: boolean | null
          dj_inclus?: boolean | null
          eau_incluse?: boolean | null
          horaires_journee?: boolean | null
          horaires_nuit?: boolean | null
          horaires_soiree?: boolean | null
          jardin?: boolean | null
          jeux_lumiere?: boolean | null
          jus_inclus?: boolean | null
          loge_invites_nb?: number | null
          loge_maries_nb?: number | null
          mobilier_inclus?: boolean | null
          nappes_incluses?: boolean | null
          nettoyage_inclus?: boolean | null
          parking_places?: number | null
          piscine?: boolean | null
          piste_danse?: boolean | null
          politique_annulation?: string | null
          provider_id?: string
          salle_attente?: boolean | null
          salle_dinatoire?: boolean | null
          salle_femmes_cap?: number | null
          salle_hommes_cap?: number | null
          salle_mixte_cap?: number | null
          securite_incluse?: boolean | null
          separated_spaces?: boolean | null
          serveurs_mixte?: boolean | null
          serveuses_femmes?: boolean | null
          sonorisation_base?: boolean | null
          surface_m2?: number | null
          terrasse?: boolean | null
          the_inclus?: boolean | null
          traiteur_type?: string | null
          vaisselle_incluse?: boolean | null
          valet_inclus?: boolean | null
          ventilation?: boolean | null
          videoprojecteur?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_venues_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_views: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          viewer_id: string | null
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_views_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          base_price: number | null
          bio: string | null
          category_slug: string | null
          commercial_name: string
          created_at: string
          events_accepted: string[] | null
          id: string
          is_whatsapp_active: boolean | null
          moderation_status: string | null
          pending_changes: Json | null
          phone_number: string
          price_factors: string[] | null
          profile_picture_url: string | null
          provider_type: Database["public"]["Enums"]["provider_type"]
          social_link: string | null
          travel_wilayas: string[] | null
          updated_at: string
          user_id: string
          wilaya_id: string | null
        }
        Insert: {
          address?: string | null
          base_price?: number | null
          bio?: string | null
          category_slug?: string | null
          commercial_name: string
          created_at?: string
          events_accepted?: string[] | null
          id?: string
          is_whatsapp_active?: boolean | null
          moderation_status?: string | null
          pending_changes?: Json | null
          phone_number: string
          price_factors?: string[] | null
          profile_picture_url?: string | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          social_link?: string | null
          travel_wilayas?: string[] | null
          updated_at?: string
          user_id: string
          wilaya_id?: string | null
        }
        Update: {
          address?: string | null
          base_price?: number | null
          bio?: string | null
          category_slug?: string | null
          commercial_name?: string
          created_at?: string
          events_accepted?: string[] | null
          id?: string
          is_whatsapp_active?: boolean | null
          moderation_status?: string | null
          pending_changes?: Json | null
          phone_number?: string
          price_factors?: string[] | null
          profile_picture_url?: string | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          social_link?: string | null
          travel_wilayas?: string[] | null
          updated_at?: string
          user_id?: string
          wilaya_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_wilaya_id_fkey"
            columns: ["wilaya_id"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string | null
          client_name: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          status: string | null
        }
        Insert: {
          client_id?: string | null
          client_name: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          status?: string | null
        }
        Update: {
          client_id?: string | null
          client_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          active: boolean | null
          id: string
          label: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          id?: string
          label: string
          slug: string
        }
        Update: {
          active?: boolean | null
          id?: string
          label?: string
          slug?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          active: boolean | null
          code: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          code: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_provider_dashboard_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "provider" | "client"
      provider_type: "individual" | "agency"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "provider", "client"],
      provider_type: ["individual", "agency"],
    },
  },
} as const

