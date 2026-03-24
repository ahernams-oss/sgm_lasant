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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cotacao_convites: {
        Row: {
          comprador: string
          cotacao_id: string
          cotacao_numero: number
          created_at: string | null
          expires_at: string | null
          fornecedor_email: string
          fornecedor_id: string
          fornecedor_nome: string
          id: string
          itens: Json
          status: string
          token: string
        }
        Insert: {
          comprador: string
          cotacao_id: string
          cotacao_numero: number
          created_at?: string | null
          expires_at?: string | null
          fornecedor_email?: string
          fornecedor_id: string
          fornecedor_nome: string
          id?: string
          itens?: Json
          status?: string
          token?: string
        }
        Update: {
          comprador?: string
          cotacao_id?: string
          cotacao_numero?: number
          created_at?: string | null
          expires_at?: string | null
          fornecedor_email?: string
          fornecedor_id?: string
          fornecedor_nome?: string
          id?: string
          itens?: Json
          status?: string
          token?: string
        }
        Relationships: []
      }
      cotacao_propostas_externas: {
        Row: {
          condicao_pagamento: string | null
          convite_id: string
          created_at: string | null
          id: string
          itens: Json
          observacao: string | null
          prazo_entrega: string | null
          validade_proposta: string | null
          valor_total: number
        }
        Insert: {
          condicao_pagamento?: string | null
          convite_id: string
          created_at?: string | null
          id?: string
          itens?: Json
          observacao?: string | null
          prazo_entrega?: string | null
          validade_proposta?: string | null
          valor_total?: number
        }
        Update: {
          condicao_pagamento?: string | null
          convite_id?: string
          created_at?: string | null
          id?: string
          itens?: Json
          observacao?: string | null
          prazo_entrega?: string | null
          validade_proposta?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacao_propostas_externas_convite_id_fkey"
            columns: ["convite_id"]
            isOneToOne: false
            referencedRelation: "cotacao_convites"
            referencedColumns: ["id"]
          },
        ]
      }
      exames_periodicos: {
        Row: {
          anexo_aso_url: string | null
          clinica: string | null
          created_at: string
          data_realizacao: string | null
          data_vencimento: string
          funcionario_email: string | null
          funcionario_id: string
          funcionario_nome: string
          funcionario_telefone: string | null
          id: string
          notificado_10d: boolean
          notificado_20d: boolean
          notificado_30d: boolean
          observacoes: string | null
          resultado: string | null
          tipo_exame: string
        }
        Insert: {
          anexo_aso_url?: string | null
          clinica?: string | null
          created_at?: string
          data_realizacao?: string | null
          data_vencimento: string
          funcionario_email?: string | null
          funcionario_id: string
          funcionario_nome: string
          funcionario_telefone?: string | null
          id?: string
          notificado_10d?: boolean
          notificado_20d?: boolean
          notificado_30d?: boolean
          observacoes?: string | null
          resultado?: string | null
          tipo_exame: string
        }
        Update: {
          anexo_aso_url?: string | null
          clinica?: string | null
          created_at?: string
          data_realizacao?: string | null
          data_vencimento?: string
          funcionario_email?: string | null
          funcionario_id?: string
          funcionario_nome?: string
          funcionario_telefone?: string | null
          id?: string
          notificado_10d?: boolean
          notificado_20d?: boolean
          notificado_30d?: boolean
          observacoes?: string | null
          resultado?: string | null
          tipo_exame?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          agencia: string | null
          altura: string | null
          bairro: string | null
          banco: string | null
          cargo_id: string | null
          categoria_cnh: string | null
          cep: string | null
          certificado_reservista: string | null
          chave_pix: string | null
          cidade: string | null
          cliente_id: string | null
          cnh: string | null
          complemento: string | null
          conta: string | null
          cpf: string
          created_at: string | null
          ctps: string | null
          data_admissao: string | null
          data_demissao: string | null
          data_nascimento: string | null
          dependentes: Json | null
          email: string | null
          epis: Json | null
          estado_civil: string | null
          id: string
          jornada_trabalho: string | null
          logradouro: string | null
          nacionalidade: string | null
          naturalidade: string | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          nrs: Json | null
          numero: string | null
          observacoes: string | null
          orgao_emissor: string | null
          passagens: Json | null
          pcd: boolean | null
          peso: string | null
          pis: string | null
          rg: string | null
          salario: string | null
          secao_eleitoral: string | null
          serie_ctps: string | null
          sexo: string | null
          status: string | null
          tamanho_calca: string | null
          tamanho_calcado: string | null
          tamanho_camisa: string | null
          telefone: string | null
          tipo_conta: string | null
          tipo_contrato: string | null
          tipo_pcd: string | null
          titulo_eleitor: string | null
          uf: string | null
          validade_cnh: string | null
          zona_eleitoral: string | null
        }
        Insert: {
          agencia?: string | null
          altura?: string | null
          bairro?: string | null
          banco?: string | null
          cargo_id?: string | null
          categoria_cnh?: string | null
          cep?: string | null
          certificado_reservista?: string | null
          chave_pix?: string | null
          cidade?: string | null
          cliente_id?: string | null
          cnh?: string | null
          complemento?: string | null
          conta?: string | null
          cpf: string
          created_at?: string | null
          ctps?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          email?: string | null
          epis?: Json | null
          estado_civil?: string | null
          id?: string
          jornada_trabalho?: string | null
          logradouro?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          nrs?: Json | null
          numero?: string | null
          observacoes?: string | null
          orgao_emissor?: string | null
          passagens?: Json | null
          pcd?: boolean | null
          peso?: string | null
          pis?: string | null
          rg?: string | null
          salario?: string | null
          secao_eleitoral?: string | null
          serie_ctps?: string | null
          sexo?: string | null
          status?: string | null
          tamanho_calca?: string | null
          tamanho_calcado?: string | null
          tamanho_camisa?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          tipo_contrato?: string | null
          tipo_pcd?: string | null
          titulo_eleitor?: string | null
          uf?: string | null
          validade_cnh?: string | null
          zona_eleitoral?: string | null
        }
        Update: {
          agencia?: string | null
          altura?: string | null
          bairro?: string | null
          banco?: string | null
          cargo_id?: string | null
          categoria_cnh?: string | null
          cep?: string | null
          certificado_reservista?: string | null
          chave_pix?: string | null
          cidade?: string | null
          cliente_id?: string | null
          cnh?: string | null
          complemento?: string | null
          conta?: string | null
          cpf?: string
          created_at?: string | null
          ctps?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          data_nascimento?: string | null
          dependentes?: Json | null
          email?: string | null
          epis?: Json | null
          estado_civil?: string | null
          id?: string
          jornada_trabalho?: string | null
          logradouro?: string | null
          nacionalidade?: string | null
          naturalidade?: string | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          nrs?: Json | null
          numero?: string | null
          observacoes?: string | null
          orgao_emissor?: string | null
          passagens?: Json | null
          pcd?: boolean | null
          peso?: string | null
          pis?: string | null
          rg?: string | null
          salario?: string | null
          secao_eleitoral?: string | null
          serie_ctps?: string | null
          sexo?: string | null
          status?: string | null
          tamanho_calca?: string | null
          tamanho_calcado?: string | null
          tamanho_camisa?: string | null
          telefone?: string | null
          tipo_conta?: string | null
          tipo_contrato?: string | null
          tipo_pcd?: string | null
          titulo_eleitor?: string | null
          uf?: string | null
          validade_cnh?: string | null
          zona_eleitoral?: string | null
        }
        Relationships: []
      }
      promocoes: {
        Row: {
          cargo_anterior_id: string | null
          cargo_anterior_nome: string | null
          cargo_novo_id: string
          cargo_novo_nome: string
          cliente_anterior_id: string | null
          cliente_anterior_nome: string | null
          cliente_novo_id: string | null
          cliente_novo_nome: string | null
          created_at: string
          data_promocao: string
          funcionario_id: string
          id: string
          motivo: string | null
          observacoes: string | null
          salario_anterior: string | null
          salario_novo: string | null
        }
        Insert: {
          cargo_anterior_id?: string | null
          cargo_anterior_nome?: string | null
          cargo_novo_id: string
          cargo_novo_nome: string
          cliente_anterior_id?: string | null
          cliente_anterior_nome?: string | null
          cliente_novo_id?: string | null
          cliente_novo_nome?: string | null
          created_at?: string
          data_promocao?: string
          funcionario_id: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          salario_anterior?: string | null
          salario_novo?: string | null
        }
        Update: {
          cargo_anterior_id?: string | null
          cargo_anterior_nome?: string | null
          cargo_novo_id?: string
          cargo_novo_nome?: string
          cliente_anterior_id?: string | null
          cliente_anterior_nome?: string | null
          cliente_novo_id?: string | null
          cliente_novo_nome?: string | null
          created_at?: string
          data_promocao?: string
          funcionario_id?: string
          id?: string
          motivo?: string | null
          observacoes?: string | null
          salario_anterior?: string | null
          salario_novo?: string | null
        }
        Relationships: []
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
