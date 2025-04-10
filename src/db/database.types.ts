export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      assessment_processes: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string;
          id: string;
          is_active: boolean;
          start_date: string;
          status: Database["public"]["Enums"]["assessment_process_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_date: string;
          id?: string;
          is_active?: boolean;
          start_date: string;
          status?: Database["public"]["Enums"]["assessment_process_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_date?: string;
          id?: string;
          is_active?: boolean;
          start_date?: string;
          status?: Database["public"]["Enums"]["assessment_process_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goal_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          assessment_process_id: string;
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
          weight: number;
        };
        Insert: {
          assessment_process_id: string;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          weight: number;
        };
        Update: {
          assessment_process_id?: string;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "goals_assessment_process_id_fkey";
            columns: ["assessment_process_id"];
            isOneToOne: false;
            referencedRelation: "assessment_processes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "goal_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      manager_assessments: {
        Row: {
          comments: string | null;
          created_at: string;
          goal_id: string;
          id: string;
          rating: number;
          updated_at: string;
        };
        Insert: {
          comments?: string | null;
          created_at?: string;
          goal_id: string;
          id?: string;
          rating: number;
          updated_at?: string;
        };
        Update: {
          comments?: string | null;
          created_at?: string;
          goal_id?: string;
          id?: string;
          rating?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manager_assessments_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: true;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      self_assessments: {
        Row: {
          comments: string | null;
          created_at: string;
          goal_id: string;
          id: string;
          rating: number;
          updated_at: string;
        };
        Insert: {
          comments?: string | null;
          created_at?: string;
          goal_id: string;
          id?: string;
          rating: number;
          updated_at?: string;
        };
        Update: {
          comments?: string | null;
          created_at?: string;
          goal_id?: string;
          id?: string;
          rating?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "self_assessments_goal_id_fkey";
            columns: ["goal_id"];
            isOneToOne: true;
            referencedRelation: "goals";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          manager_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          manager_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          manager_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>; // this means: intentionally empty
    Functions: Record<string, never>;
    Enums: {
      assessment_process_status:
        | "in_definition"
        | "awaiting_self_assessment"
        | "in_self_assessment"
        | "awaiting_manager_assessment"
        | "completed";
    };
    CompositeTypes: Record<string, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      assessment_process_status: [
        "in_definition",
        "awaiting_self_assessment",
        "in_self_assessment",
        "awaiting_manager_assessment",
        "completed",
      ],
    },
  },
} as const;
