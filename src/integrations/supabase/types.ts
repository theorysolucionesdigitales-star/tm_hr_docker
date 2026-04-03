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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          ciudad: string | null
          created_at: string
          created_by: string | null
          id: string
          industria: Database["public"]["Enums"]["industria"] | null
          logo_url: string | null
          nombre: string
          pais: string | null
          personas_contacto: string | null
          rut: string | null
          updated_at: string
        }
        Insert: {
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industria?: Database["public"]["Enums"]["industria"] | null
          logo_url?: string | null
          nombre: string
          pais?: string | null
          personas_contacto?: string | null
          rut?: string | null
          updated_at?: string
        }
        Update: {
          ciudad?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industria?: Database["public"]["Enums"]["industria"] | null
          logo_url?: string | null
          nombre?: string
          pais?: string | null
          personas_contacto?: string | null
          rut?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      perfiles_cargo: {
        Row: {
          created_at: string
          descripcion: string
          id: string
          orden: number
          proceso_id: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          id?: string
          orden?: number
          proceso_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          id?: string
          orden?: number
          proceso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_cargo_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos"
            referencedColumns: ["id"]
          },
        ]
      }
      postulantes: {
        Row: {
          cargo_2: string | null
          cargo_3: string | null
          cargo_actual: string | null
          created_at: string
          created_by: string | null
          cv_url: string | null
          edad: number | null
          email: string | null
          empresa: string | null
          empresa_2: string | null
          empresa_3: string | null
          fecha_inicio_1: string | null
          fecha_fin_1: string | null
          fecha_inicio_2: string | null
          fecha_fin_2: string | null
          fecha_inicio_3: string | null
          fecha_fin_3: string | null
          cargo_4: string | null
          empresa_4: string | null
          fecha_inicio_4: string | null
          fecha_fin_4: string | null
          cargo_5: string | null
          empresa_5: string | null
          fecha_inicio_5: string | null
          fecha_fin_5: string | null
          cargo_6: string | null
          empresa_6: string | null
          fecha_inicio_6: string | null
          fecha_fin_6: string | null
          estudios: string | null
          institucion: string | null
          estudios_2: string | null
          institucion_2: string | null
          estudios_3: string | null
          institucion_3: string | null
          foto_url: string | null
          genero: Database["public"]["Enums"]["genero"] | null
          id: string
          linkedin: string | null
          motivacion: string | null
          nombre: string
          observaciones: string | null
          pretension_renta: number | null
          proceso_id: string
          renta_actual: number | null
          status: Database["public"]["Enums"]["status_postulante"]
          estado_proceso_postulante: Database["public"]["Enums"]["estado_proceso"]
          telefono: string | null
          benef_act: string | null
          updated_at: string
        }
        Insert: {
          cargo_2?: string | null
          cargo_3?: string | null
          cargo_actual?: string | null
          created_at?: string
          created_by?: string | null
          cv_url?: string | null
          edad?: number | null
          email?: string | null
          empresa?: string | null
          empresa_2?: string | null
          empresa_3?: string | null
          fecha_inicio_1?: string | null
          fecha_fin_1?: string | null
          fecha_inicio_2?: string | null
          fecha_fin_2?: string | null
          fecha_inicio_3?: string | null
          fecha_fin_3?: string | null
          cargo_4?: string | null
          empresa_4?: string | null
          fecha_inicio_4?: string | null
          fecha_fin_4?: string | null
          cargo_5?: string | null
          empresa_5?: string | null
          fecha_inicio_5?: string | null
          fecha_fin_5?: string | null
          cargo_6?: string | null
          empresa_6?: string | null
          fecha_inicio_6?: string | null
          fecha_fin_6?: string | null
          estudios?: string | null
          institucion?: string | null
          estudios_2?: string | null
          institucion_2?: string | null
          estudios_3?: string | null
          institucion_3?: string | null
          foto_url?: string | null
          genero?: Database["public"]["Enums"]["genero"] | null
          id?: string
          linkedin?: string | null
          motivacion?: string | null
          nombre: string
          observaciones?: string | null
          pretension_renta?: number | null
          proceso_id: string
          renta_actual?: number | null
          status?: Database["public"]["Enums"]["status_postulante"]
          estado_proceso_postulante?: Database["public"]["Enums"]["estado_proceso"]
          telefono?: string | null
          benef_act?: string | null
          updated_at?: string
        }
        Update: {
          cargo_2?: string | null
          cargo_3?: string | null
          cargo_actual?: string | null
          created_at?: string
          created_by?: string | null
          cv_url?: string | null
          edad?: number | null
          email?: string | null
          empresa?: string | null
          empresa_2?: string | null
          empresa_3?: string | null
          fecha_inicio_1?: string | null
          fecha_fin_1?: string | null
          fecha_inicio_2?: string | null
          fecha_fin_2?: string | null
          fecha_inicio_3?: string | null
          fecha_fin_3?: string | null
          cargo_4?: string | null
          empresa_4?: string | null
          fecha_inicio_4?: string | null
          fecha_fin_4?: string | null
          cargo_5?: string | null
          empresa_5?: string | null
          fecha_inicio_5?: string | null
          fecha_fin_5?: string | null
          cargo_6?: string | null
          empresa_6?: string | null
          fecha_inicio_6?: string | null
          fecha_fin_6?: string | null
          estudios?: string | null
          institucion?: string | null
          estudios_2?: string | null
          institucion_2?: string | null
          estudios_3?: string | null
          institucion_3?: string | null
          foto_url?: string | null
          genero?: Database["public"]["Enums"]["genero"] | null
          id?: string
          linkedin?: string | null
          motivacion?: string | null
          nombre?: string
          observaciones?: string | null
          pretension_renta?: number | null
          proceso_id?: string
          renta_actual?: number | null
          status?: Database["public"]["Enums"]["status_postulante"]
          estado_proceso_postulante?: Database["public"]["Enums"]["estado_proceso"]
          telefono?: string | null
          benef_act?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "postulantes_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos"
            referencedColumns: ["id"]
          },
        ]
      }
      procesos: {
        Row: {
          cliente_id: string
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["estado_proceso"]
          id: string
          mision: string | null
          perfil: string | null
          mision_cargo: string | null
          nombre_cargo: string
          renta_obj: number | null
          renta_var_def: number | null
          benef_def: string | null
          carta_gantt_url: string | null
          sharing_code: string | null
          sharing_token: string | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato"] | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_proceso"]
          id?: string
          mision?: string | null
          perfil?: string | null
          mision_cargo?: string | null
          nombre_cargo: string
          renta_obj?: number | null
          renta_var_def?: number | null
          benef_def?: string | null
          carta_gantt_url?: string | null
          sharing_code?: string | null
          sharing_token?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"] | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_proceso"]
          id?: string
          mision?: string | null
          perfil?: string | null
          mision_cargo?: string | null
          nombre_cargo?: string
          renta_obj?: number | null
          renta_var_def?: number | null
          benef_def?: string | null
          carta_gantt_url?: string | null
          sharing_code?: string | null
          sharing_token?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procesos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      observaciones_research: {
        Row: {
          id: string
          proceso_id: string
          tipo: "no_interesado" | "no_responde_perfil"
          descripcion: string
          orden: number
          created_at: string
        }
        Insert: {
          id?: string
          proceso_id: string
          tipo: "no_interesado" | "no_responde_perfil"
          descripcion: string
          orden?: number
          created_at?: string
        }
        Update: {
          id?: string
          proceso_id?: string
          tipo?: "no_interesado" | "no_responde_perfil"
          descripcion?: string
          orden?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_research_proceso_id_fkey"
            columns: ["proceso_id"]
            isOneToOne: false
            referencedRelation: "procesos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_client_assignments: {
        Row: {
          id: string
          user_id: string
          cliente_id: string
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cliente_id: string
          assigned_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cliente_id?: string
          assigned_by?: string | null
          created_at?: string
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
      app_role: "admin" | "consultor" | "junior"
      estado_proceso:
      | "Research"
      | "Reunión Cliente"
      | "Entrevista Consultor"
      | "Entrevista Cliente"
      | "Evaluación Psicológica"
      | "Chequeo Referencias"
      | "Carta Oferta"
      | "Terminado"
      genero: "Masculino" | "Femenino" | "Otro" | "Prefiero no decir"
      industria:
      | "Agroindustria"
      | "Asesoría y Servicios jurídicos"
      | "Bienes de consumo"
      | "Cadena logística y de suministro"
      | "Compañías aéreas"
      | "Construcción"
      | "Consultoría"
      | "Educación"
      | "Energía"
      | "Entrenamiento, viajes y turismo"
      | "Fabricación y producción"
      | "Gobierno, gestión pública o servicios públicos"
      | "Medios de comunicación, publicidad y marketing"
      | "Minería"
      | "Retail, ventas minoristas y mayoristas"
      | "Salud"
      | "Sector farmaceútico"
      | "Servicios financieros"
      | "Servicios generales o industriales"
      | "Servicios profesionales"
      | "Tecnología"
      | "Telecomunicaciones"
      status_postulante:
      | "Llamar - Pendiente Contacto"
      | "No responde al perfil"
      | "Perfila"
      | "No interesado"
      | "Plan B"
      | "Excede Renta"
      | "CO Entregada"
      | "CO Aceptada"
      | "CO Rechazada"
      | "Placed"
      tipo_contrato:
      | "Indefinido Fulltime - Presencial"
      | "Indefinido Fulltime - Híbrido"
      | "Indefinido Fulltime - Remoto"
      | "Contrato a Plazo por Proyecto"
      | "Contrato a Plazo por Reemplazo"
      | "Part-time"
      | "Práctica Profesional / Pasantía"
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
      app_role: ["admin", "consultor", "junior"],
      estado_proceso: [
        "Research",
        "Descartado",
        "Reunión Cliente",
        "Entrevista Consultor",
        "Entrevista Cliente",
        "Evaluación Psicológica",
        "Chequeo Referencias",
        "Carta Oferta",
        "Terminado",
      ],
      genero: ["Masculino", "Femenino", "Otro", "Prefiero no decir"],
      industria: [
        "Agroindustria",
        "Asesoría y Servicios jurídicos",
        "Bienes de consumo",
        "Cadena logística y de suministro",
        "Compañías aéreas",
        "Construcción",
        "Consultoría",
        "Educación",
        "Energía",
        "Entrenamiento, viajes y turismo",
        "Fabricación y producción",
        "Gobierno, gestión pública o servicios públicos",
        "Medios de comunicación, publicidad y marketing",
        "Minería",
        "Retail, ventas minoristas y mayoristas",
        "Salud",
        "Sector farmaceútico",
        "Servicios financieros",
        "Servicios generales o industriales",
        "Servicios profesionales",
        "Tecnología",
        "Telecomunicaciones",
      ],
      status_postulante: [
        "LinkedIn",
        "Llamar - Pendiente Contacto",
        "No responde Perfil",
        "Perfila",
        "No interesado",
        "Plan B",
        "Excede Renta",
      ],
      tipo_contrato: [
        "Indefinido Fulltime - Presencial",
        "Indefinido Fulltime - Híbrido",
        "Indefinido Fulltime - Remoto",
        "Contrato a Plazo por Proyecto",
        "Contrato a Plazo por Reemplazo",
        "Part-time",
        "Práctica Profesional / Pasantía",
      ],
    },
  },
} as const
