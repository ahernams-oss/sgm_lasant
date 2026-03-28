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
      cargos: {
        Row: {
          anexos: Json | null
          cbo: string | null
          created_at: string | null
          data_base_salario: string | null
          descricao: string | null
          id: string
          missao: string | null
          nivel: string | null
          nome: string
          nrs: Json | null
          perfil_competencias: string | null
          responsabilidades: string | null
          salario: string | null
          salarios: Json | null
        }
        Insert: {
          anexos?: Json | null
          cbo?: string | null
          created_at?: string | null
          data_base_salario?: string | null
          descricao?: string | null
          id?: string
          missao?: string | null
          nivel?: string | null
          nome?: string
          nrs?: Json | null
          perfil_competencias?: string | null
          responsabilidades?: string | null
          salario?: string | null
          salarios?: Json | null
        }
        Update: {
          anexos?: Json | null
          cbo?: string | null
          created_at?: string | null
          data_base_salario?: string | null
          descricao?: string | null
          id?: string
          missao?: string | null
          nivel?: string | null
          nome?: string
          nrs?: Json | null
          perfil_competencias?: string | null
          responsabilidades?: string | null
          salario?: string | null
          salarios?: Json | null
        }
        Relationships: []
      }
      categorias_compras_classes: {
        Row: {
          codigo: string | null
          created_at: string | null
          id: string
          nome: string
          sub_grupo_id: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          sub_grupo_id?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          sub_grupo_id?: string
        }
        Relationships: []
      }
      categorias_compras_grupos: {
        Row: {
          codigo: string | null
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      categorias_compras_subgrupos: {
        Row: {
          codigo: string | null
          created_at: string | null
          grupo_id: string
          id: string
          nome: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string | null
          grupo_id?: string
          id?: string
          nome?: string
        }
        Update: {
          codigo?: string | null
          created_at?: string | null
          grupo_id?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      checklist_preenchimentos: {
        Row: {
          checklist_id: string
          checklist_titulo: string | null
          created_at: string | null
          data_preenchimento: string | null
          evidencia_id: string | null
          evidencia_titulo: string | null
          id: string
          itens: Json | null
          observacoes: string | null
          percentual_conformidade: number | null
          responsavel: string | null
          status: string | null
        }
        Insert: {
          checklist_id: string
          checklist_titulo?: string | null
          created_at?: string | null
          data_preenchimento?: string | null
          evidencia_id?: string | null
          evidencia_titulo?: string | null
          id?: string
          itens?: Json | null
          observacoes?: string | null
          percentual_conformidade?: number | null
          responsavel?: string | null
          status?: string | null
        }
        Update: {
          checklist_id?: string
          checklist_titulo?: string | null
          created_at?: string | null
          data_preenchimento?: string | null
          evidencia_id?: string | null
          evidencia_titulo?: string | null
          id?: string
          itens?: Json | null
          observacoes?: string | null
          percentual_conformidade?: number | null
          responsavel?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_preenchimentos_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_preenchimentos_evidencia_id_fkey"
            columns: ["evidencia_id"]
            isOneToOne: false
            referencedRelation: "evidencias"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          id: string
          itens: Json | null
          titulo: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          itens?: Json | null
          titulo?: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          itens?: Json | null
          titulo?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cap: string | null
          celulares: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          contato: string | null
          contratos: Json | null
          created_at: string | null
          data_inicio_contrato: string | null
          descricao: string | null
          email: string | null
          email_compras: string | null
          email_engenharia: string | null
          email_os_bcc: string | null
          email_os_cc: string | null
          email_ss_bcc: string | null
          email_ss_cc: string | null
          endereco: string | null
          esfera: string | null
          grupo_whatsapp: string | null
          id: string
          informacoes_financeiras: Json | null
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          locais: Json | null
          locais_entrega: Json | null
          logradouro: string | null
          nome: string
          nome_fantasia: string | null
          numero: string | null
          rel_linha1: string | null
          rel_linha2: string | null
          rel_linha3: string | null
          rel_linha4: string | null
          telefone_celular: string | null
          telefones: Json | null
          telefones_whatsapp: string | null
          tipo: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          cap?: string | null
          celulares?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato?: string | null
          contratos?: Json | null
          created_at?: string | null
          data_inicio_contrato?: string | null
          descricao?: string | null
          email?: string | null
          email_compras?: string | null
          email_engenharia?: string | null
          email_os_bcc?: string | null
          email_os_cc?: string | null
          email_ss_bcc?: string | null
          email_ss_cc?: string | null
          endereco?: string | null
          esfera?: string | null
          grupo_whatsapp?: string | null
          id?: string
          informacoes_financeiras?: Json | null
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          locais?: Json | null
          locais_entrega?: Json | null
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          rel_linha1?: string | null
          rel_linha2?: string | null
          rel_linha3?: string | null
          rel_linha4?: string | null
          telefone_celular?: string | null
          telefones?: Json | null
          telefones_whatsapp?: string | null
          tipo?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          cap?: string | null
          celulares?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato?: string | null
          contratos?: Json | null
          created_at?: string | null
          data_inicio_contrato?: string | null
          descricao?: string | null
          email?: string | null
          email_compras?: string | null
          email_engenharia?: string | null
          email_os_bcc?: string | null
          email_os_cc?: string | null
          email_ss_bcc?: string | null
          email_ss_cc?: string | null
          endereco?: string | null
          esfera?: string | null
          grupo_whatsapp?: string | null
          id?: string
          informacoes_financeiras?: Json | null
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          locais?: Json | null
          locais_entrega?: Json | null
          logradouro?: string | null
          nome?: string
          nome_fantasia?: string | null
          numero?: string | null
          rel_linha1?: string | null
          rel_linha2?: string | null
          rel_linha3?: string | null
          rel_linha4?: string | null
          telefone_celular?: string | null
          telefones?: Json | null
          telefones_whatsapp?: string | null
          tipo?: string | null
          uf?: string | null
        }
        Relationships: []
      }
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
      cotacoes_compras: {
        Row: {
          comprador: string | null
          created_at: string | null
          data_criacao: string | null
          fornecedor_vencedor_id: string | null
          id: string
          itens_vencedores: Json | null
          justificativa_escolha: string | null
          numero: number
          propostas: Json | null
          requisicao_id: string | null
          requisicao_numero: number | null
          status: string | null
        }
        Insert: {
          comprador?: string | null
          created_at?: string | null
          data_criacao?: string | null
          fornecedor_vencedor_id?: string | null
          id?: string
          itens_vencedores?: Json | null
          justificativa_escolha?: string | null
          numero?: number
          propostas?: Json | null
          requisicao_id?: string | null
          requisicao_numero?: number | null
          status?: string | null
        }
        Update: {
          comprador?: string | null
          created_at?: string | null
          data_criacao?: string | null
          fornecedor_vencedor_id?: string | null
          id?: string
          itens_vencedores?: Json | null
          justificativa_escolha?: string | null
          numero?: number
          propostas?: Json | null
          requisicao_id?: string | null
          requisicao_numero?: number | null
          status?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      empresa: {
        Row: {
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          complemento: string | null
          contato: string | null
          created_at: string | null
          email: string | null
          email_compras: string | null
          email_engenharia: string | null
          email_estoque: string | null
          email_relatorios: string | null
          email_rh: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo_url: string | null
          logradouro: string | null
          nome_fantasia: string | null
          numero: string | null
          razao_social: string
          site: string | null
          telefone: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          email_compras?: string | null
          email_engenharia?: string | null
          email_estoque?: string | null
          email_relatorios?: string | null
          email_rh?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string
          site?: string | null
          telefone?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato?: string | null
          created_at?: string | null
          email?: string | null
          email_compras?: string | null
          email_engenharia?: string | null
          email_estoque?: string | null
          email_relatorios?: string | null
          email_rh?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          logradouro?: string | null
          nome_fantasia?: string | null
          numero?: string | null
          razao_social?: string
          site?: string | null
          telefone?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      estoque_inventarios: {
        Row: {
          created_at: string | null
          data_inventario: string | null
          id: string
          itens: Json | null
          local: string
          observacao: string | null
          status: string | null
          usuario: string | null
        }
        Insert: {
          created_at?: string | null
          data_inventario?: string | null
          id?: string
          itens?: Json | null
          local?: string
          observacao?: string | null
          status?: string | null
          usuario?: string | null
        }
        Update: {
          created_at?: string | null
          data_inventario?: string | null
          id?: string
          itens?: Json | null
          local?: string
          observacao?: string | null
          status?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string | null
          data_movimentacao: string | null
          deposito_destino: string | null
          deposito_origem: string | null
          documento_ref: string | null
          fornecedor_nome: string | null
          id: string
          local: string
          lote: string | null
          material_codigo: string
          material_descricao: string
          material_id: string
          observacao: string | null
          quantidade: number
          tipo: string
          usuario: string | null
          validade: string | null
        }
        Insert: {
          created_at?: string | null
          data_movimentacao?: string | null
          deposito_destino?: string | null
          deposito_origem?: string | null
          documento_ref?: string | null
          fornecedor_nome?: string | null
          id?: string
          local?: string
          lote?: string | null
          material_codigo?: string
          material_descricao?: string
          material_id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
          usuario?: string | null
          validade?: string | null
        }
        Update: {
          created_at?: string | null
          data_movimentacao?: string | null
          deposito_destino?: string | null
          deposito_origem?: string | null
          documento_ref?: string | null
          fornecedor_nome?: string | null
          id?: string
          local?: string
          lote?: string | null
          material_codigo?: string
          material_descricao?: string
          material_id?: string
          observacao?: string | null
          quantidade?: number
          tipo?: string
          usuario?: string | null
          validade?: string | null
        }
        Relationships: []
      }
      evidencias: {
        Row: {
          anexos: Json | null
          centro_custo_id: string | null
          centro_custo_nome: string | null
          created_at: string | null
          data_fato_gerador: string | null
          data_registro: string | null
          descricao: string | null
          historico: Json | null
          id: string
          numero: number
          observacoes: string | null
          palavras_chave: string | null
          processo_vinculado: string | null
          responsavel_registro: string | null
          setor: string | null
          status: string | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          anexos?: Json | null
          centro_custo_id?: string | null
          centro_custo_nome?: string | null
          created_at?: string | null
          data_fato_gerador?: string | null
          data_registro?: string | null
          descricao?: string | null
          historico?: Json | null
          id?: string
          numero?: number
          observacoes?: string | null
          palavras_chave?: string | null
          processo_vinculado?: string | null
          responsavel_registro?: string | null
          setor?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
        }
        Update: {
          anexos?: Json | null
          centro_custo_id?: string | null
          centro_custo_nome?: string | null
          created_at?: string | null
          data_fato_gerador?: string | null
          data_registro?: string | null
          descricao?: string | null
          historico?: Json | null
          id?: string
          numero?: number
          observacoes?: string | null
          palavras_chave?: string | null
          processo_vinculado?: string | null
          responsavel_registro?: string | null
          setor?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: []
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
      fabricantes: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      ferramentas: {
        Row: {
          centro_custo_atual_id: string | null
          centro_custo_atual_nome: string | null
          certificado_calibracao_url: string | null
          codigo: string
          created_at: string | null
          data_aquisicao: string | null
          data_calibracao: string | null
          descricao: string
          estado_conservacao: string | null
          foto_url: string | null
          id: string
          marca: string | null
          modelo: string | null
          nota_fiscal: string | null
          numero_serie: string | null
          observacoes: string | null
          patrimonio: string | null
          status: string | null
          validade_calibracao: string | null
          valor_aquisicao: number | null
        }
        Insert: {
          centro_custo_atual_id?: string | null
          centro_custo_atual_nome?: string | null
          certificado_calibracao_url?: string | null
          codigo?: string
          created_at?: string | null
          data_aquisicao?: string | null
          data_calibracao?: string | null
          descricao?: string
          estado_conservacao?: string | null
          foto_url?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          status?: string | null
          validade_calibracao?: string | null
          valor_aquisicao?: number | null
        }
        Update: {
          centro_custo_atual_id?: string | null
          centro_custo_atual_nome?: string | null
          certificado_calibracao_url?: string | null
          codigo?: string
          created_at?: string | null
          data_aquisicao?: string | null
          data_calibracao?: string | null
          descricao?: string
          estado_conservacao?: string | null
          foto_url?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nota_fiscal?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          patrimonio?: string | null
          status?: string | null
          validade_calibracao?: string | null
          valor_aquisicao?: number | null
        }
        Relationships: []
      }
      ferramentas_emprestimos: {
        Row: {
          aprovado_por: string | null
          centro_custo_destino_id: string | null
          centro_custo_destino_nome: string | null
          centro_custo_origem_id: string | null
          centro_custo_origem_nome: string | null
          created_at: string | null
          data_aprovacao: string | null
          data_devolucao_prevista: string | null
          data_devolucao_real: string | null
          data_solicitacao: string | null
          ferramenta_descricao: string | null
          ferramenta_id: string
          id: string
          observacoes: string | null
          solicitante: string | null
          status: string | null
        }
        Insert: {
          aprovado_por?: string | null
          centro_custo_destino_id?: string | null
          centro_custo_destino_nome?: string | null
          centro_custo_origem_id?: string | null
          centro_custo_origem_nome?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_devolucao_prevista?: string | null
          data_devolucao_real?: string | null
          data_solicitacao?: string | null
          ferramenta_descricao?: string | null
          ferramenta_id?: string
          id?: string
          observacoes?: string | null
          solicitante?: string | null
          status?: string | null
        }
        Update: {
          aprovado_por?: string | null
          centro_custo_destino_id?: string | null
          centro_custo_destino_nome?: string | null
          centro_custo_origem_id?: string | null
          centro_custo_origem_nome?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          data_devolucao_prevista?: string | null
          data_devolucao_real?: string | null
          data_solicitacao?: string | null
          ferramenta_descricao?: string | null
          ferramenta_id?: string
          id?: string
          observacoes?: string | null
          solicitante?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ferramentas_historico: {
        Row: {
          created_at: string | null
          data_evento: string | null
          descricao: string | null
          ferramenta_descricao: string | null
          ferramenta_id: string
          id: string
          tipo: string | null
          usuario: string | null
        }
        Insert: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string | null
          ferramenta_descricao?: string | null
          ferramenta_id?: string
          id?: string
          tipo?: string | null
          usuario?: string | null
        }
        Update: {
          created_at?: string | null
          data_evento?: string | null
          descricao?: string | null
          ferramenta_descricao?: string | null
          ferramenta_id?: string
          id?: string
          tipo?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      ferramentas_vinculos: {
        Row: {
          created_at: string | null
          data_devolucao: string | null
          data_vinculo: string | null
          ferramenta_descricao: string | null
          ferramenta_id: string
          ferramentas_descricoes: Json | null
          ferramentas_ids: Json | null
          funcionario_id: string
          funcionario_nome: string | null
          id: string
          observacoes: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data_devolucao?: string | null
          data_vinculo?: string | null
          ferramenta_descricao?: string | null
          ferramenta_id?: string
          ferramentas_descricoes?: Json | null
          ferramentas_ids?: Json | null
          funcionario_id?: string
          funcionario_nome?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data_devolucao?: string | null
          data_vinculo?: string | null
          ferramenta_descricao?: string | null
          ferramenta_id?: string
          ferramentas_descricoes?: Json | null
          ferramentas_ids?: Json | null
          funcionario_id?: string
          funcionario_nome?: string | null
          id?: string
          observacoes?: string | null
          status?: string | null
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
          experiencia_fim: string | null
          experiencia_inicio: string | null
          experiencia_notificado_10d_final: boolean | null
          experiencia_notificado_10d_primeira: boolean | null
          experiencia_primeira_etapa: string | null
          experiencia_renovado: boolean | null
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
          experiencia_fim?: string | null
          experiencia_inicio?: string | null
          experiencia_notificado_10d_final?: boolean | null
          experiencia_notificado_10d_primeira?: boolean | null
          experiencia_primeira_etapa?: string | null
          experiencia_renovado?: boolean | null
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
          experiencia_fim?: string | null
          experiencia_inicio?: string | null
          experiencia_notificado_10d_final?: boolean | null
          experiencia_notificado_10d_primeira?: boolean | null
          experiencia_primeira_etapa?: string | null
          experiencia_renovado?: boolean | null
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
      i0_items: {
        Row: {
          ano: number
          cod_sco: string | null
          created_at: string | null
          id: string
          mes: number
          valor: number | null
        }
        Insert: {
          ano?: number
          cod_sco?: string | null
          created_at?: string | null
          id?: string
          mes?: number
          valor?: number | null
        }
        Update: {
          ano?: number
          cod_sco?: string | null
          created_at?: string | null
          id?: string
          mes?: number
          valor?: number | null
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          anexos: Json | null
          created_at: string | null
          criado_em: string | null
          data: string | null
          dias_falta: number | null
          funcionario_id: string
          horas_extras: number | null
          id: string
          observacao: string | null
          percentual: number | null
          tipo: string | null
          tipo_falta: string | null
        }
        Insert: {
          anexos?: Json | null
          created_at?: string | null
          criado_em?: string | null
          data?: string | null
          dias_falta?: number | null
          funcionario_id?: string
          horas_extras?: number | null
          id?: string
          observacao?: string | null
          percentual?: number | null
          tipo?: string | null
          tipo_falta?: string | null
        }
        Update: {
          anexos?: Json | null
          created_at?: string | null
          criado_em?: string | null
          data?: string | null
          dias_falta?: number | null
          funcionario_id?: string
          horas_extras?: number | null
          id?: string
          observacao?: string | null
          percentual?: number | null
          tipo?: string | null
          tipo_falta?: string | null
        }
        Relationships: []
      }
      licitacoes: {
        Row: {
          cidade: string | null
          created_at: string | null
          criterio_julgamento: string | null
          data_publicacao: string | null
          data_sessao: string | null
          estado: string | null
          exigencia_garantia: boolean | null
          exigencia_visita_tecnica: boolean | null
          grau_interesse: string | null
          id: string
          link_edital: string | null
          modalidade: string | null
          numero_edital: string | null
          numero_processo: string | null
          objeto_detalhado: string | null
          objeto_resumido: string | null
          observacoes: string | null
          orgao_licitante: string | null
          portal_disputa: string | null
          possibilidade_prorrogacao: boolean | null
          prazo_contratual: string | null
          prazo_esclarecimento: string | null
          prazo_impugnacao: string | null
          probabilidade_exito: string | null
          regime_execucao: string | null
          responsavel_interno: string | null
          status: string | null
          uasg: string | null
          valor_estimado: number | null
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          criterio_julgamento?: string | null
          data_publicacao?: string | null
          data_sessao?: string | null
          estado?: string | null
          exigencia_garantia?: boolean | null
          exigencia_visita_tecnica?: boolean | null
          grau_interesse?: string | null
          id?: string
          link_edital?: string | null
          modalidade?: string | null
          numero_edital?: string | null
          numero_processo?: string | null
          objeto_detalhado?: string | null
          objeto_resumido?: string | null
          observacoes?: string | null
          orgao_licitante?: string | null
          portal_disputa?: string | null
          possibilidade_prorrogacao?: boolean | null
          prazo_contratual?: string | null
          prazo_esclarecimento?: string | null
          prazo_impugnacao?: string | null
          probabilidade_exito?: string | null
          regime_execucao?: string | null
          responsavel_interno?: string | null
          status?: string | null
          uasg?: string | null
          valor_estimado?: number | null
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          criterio_julgamento?: string | null
          data_publicacao?: string | null
          data_sessao?: string | null
          estado?: string | null
          exigencia_garantia?: boolean | null
          exigencia_visita_tecnica?: boolean | null
          grau_interesse?: string | null
          id?: string
          link_edital?: string | null
          modalidade?: string | null
          numero_edital?: string | null
          numero_processo?: string | null
          objeto_detalhado?: string | null
          objeto_resumido?: string | null
          observacoes?: string | null
          orgao_licitante?: string | null
          portal_disputa?: string | null
          possibilidade_prorrogacao?: boolean | null
          prazo_contratual?: string | null
          prazo_esclarecimento?: string | null
          prazo_impugnacao?: string | null
          probabilidade_exito?: string | null
          regime_execucao?: string | null
          responsavel_interno?: string | null
          status?: string | null
          uasg?: string | null
          valor_estimado?: number | null
        }
        Relationships: []
      }
      licitacoes_analises: {
        Row: {
          analista: string | null
          created_at: string | null
          data_analise: string | null
          decisao_participar: string | null
          documentos_obrigatorios: string | null
          exigencia_garantia_proposta: string | null
          exigencia_vistoria: string | null
          exigencias_economicas: string | null
          exigencias_equipe: string | null
          exigencias_tecnicas: string | null
          id: string
          licitacao_id: string
          necessidade_cat_crea_cau: string | null
          necessidade_certidoes: string | null
          observacoes: string | null
          oportunidades_impugnacao: string | null
          pontos_restritivos: string | null
          resumo_objeto: string | null
          riscos_juridicos: string | null
        }
        Insert: {
          analista?: string | null
          created_at?: string | null
          data_analise?: string | null
          decisao_participar?: string | null
          documentos_obrigatorios?: string | null
          exigencia_garantia_proposta?: string | null
          exigencia_vistoria?: string | null
          exigencias_economicas?: string | null
          exigencias_equipe?: string | null
          exigencias_tecnicas?: string | null
          id?: string
          licitacao_id: string
          necessidade_cat_crea_cau?: string | null
          necessidade_certidoes?: string | null
          observacoes?: string | null
          oportunidades_impugnacao?: string | null
          pontos_restritivos?: string | null
          resumo_objeto?: string | null
          riscos_juridicos?: string | null
        }
        Update: {
          analista?: string | null
          created_at?: string | null
          data_analise?: string | null
          decisao_participar?: string | null
          documentos_obrigatorios?: string | null
          exigencia_garantia_proposta?: string | null
          exigencia_vistoria?: string | null
          exigencias_economicas?: string | null
          exigencias_equipe?: string | null
          exigencias_tecnicas?: string | null
          id?: string
          licitacao_id?: string
          necessidade_cat_crea_cau?: string | null
          necessidade_certidoes?: string | null
          observacoes?: string | null
          oportunidades_impugnacao?: string | null
          pontos_restritivos?: string | null
          resumo_objeto?: string | null
          riscos_juridicos?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licitacoes_analises_licitacao_id_fkey"
            columns: ["licitacao_id"]
            isOneToOne: false
            referencedRelation: "licitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      licitacoes_documentos: {
        Row: {
          arquivo_nome: string | null
          arquivo_url: string | null
          categoria: string | null
          created_at: string | null
          data_emissao: string | null
          data_validade: string | null
          id: string
          licitacoes_vinculadas: Json | null
          nome: string
          observacoes: string | null
          orgao_emissor: string | null
          status: string | null
          tipo_documental: string | null
          versao: number | null
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          id?: string
          licitacoes_vinculadas?: Json | null
          nome?: string
          observacoes?: string | null
          orgao_emissor?: string | null
          status?: string | null
          tipo_documental?: string | null
          versao?: number | null
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_url?: string | null
          categoria?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          id?: string
          licitacoes_vinculadas?: Json | null
          nome?: string
          observacoes?: string | null
          orgao_emissor?: string | null
          status?: string | null
          tipo_documental?: string | null
          versao?: number | null
        }
        Relationships: []
      }
      licitacoes_telefones_notificacao: {
        Row: {
          created_at: string | null
          id: string
          nome_contato: string
          telefone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome_contato?: string
          telefone?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_contato?: string
          telefone?: string
        }
        Relationships: []
      }
      materiais_servicos: {
        Row: {
          categoria_id: string | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
          estoque_minimo: number | null
          fabricante_id: string | null
          id: string
          tipo: string | null
          unidade_medida: string | null
        }
        Insert: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_minimo?: number | null
          fabricante_id?: string | null
          id?: string
          tipo?: string | null
          unidade_medida?: string | null
        }
        Update: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string | null
          descricao?: string | null
          estoque_minimo?: number | null
          fabricante_id?: string | null
          id?: string
          tipo?: string | null
          unidade_medida?: string | null
        }
        Relationships: []
      }
      medicoes_servicos: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          contrato: string | null
          created_at: string | null
          data_pagamento: string | null
          descricao: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          itens: Json | null
          medicoes: Json | null
          numero: number
          observacoes: string | null
          percentual_medido: number | null
          status: string | null
          valor_total_contratado: number | null
          valor_total_medido: number | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          contrato?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          itens?: Json | null
          medicoes?: Json | null
          numero?: number
          observacoes?: string | null
          percentual_medido?: number | null
          status?: string | null
          valor_total_contratado?: number | null
          valor_total_medido?: number | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          contrato?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          descricao?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          itens?: Json | null
          medicoes?: Json | null
          numero?: number
          observacoes?: string | null
          percentual_medido?: number | null
          status?: string | null
          valor_total_contratado?: number | null
          valor_total_medido?: number | null
        }
        Relationships: []
      }
      pedidos_compra: {
        Row: {
          comprador: string | null
          condicao_pagamento: string | null
          cotacao_id: string | null
          created_at: string | null
          data_criacao: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          historico_status: Json | null
          id: string
          itens: Json | null
          local_entrega: string | null
          numero: number
          observacoes: string | null
          prazo_entrega: string | null
          requisicao_id: string | null
          requisicao_numero: number | null
          status: string | null
          valor_total: number | null
        }
        Insert: {
          comprador?: string | null
          condicao_pagamento?: string | null
          cotacao_id?: string | null
          created_at?: string | null
          data_criacao?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          historico_status?: Json | null
          id?: string
          itens?: Json | null
          local_entrega?: string | null
          numero?: number
          observacoes?: string | null
          prazo_entrega?: string | null
          requisicao_id?: string | null
          requisicao_numero?: number | null
          status?: string | null
          valor_total?: number | null
        }
        Update: {
          comprador?: string | null
          condicao_pagamento?: string | null
          cotacao_id?: string | null
          created_at?: string | null
          data_criacao?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          historico_status?: Json | null
          id?: string
          itens?: Json | null
          local_entrega?: string | null
          numero?: number
          observacoes?: string | null
          prazo_entrega?: string | null
          requisicao_id?: string | null
          requisicao_numero?: number | null
          status?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      perfis_acesso: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          permissoes: Json
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          permissoes?: Json
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          permissoes?: Json
        }
        Relationships: []
      }
      processos_seletivos: {
        Row: {
          candidatos: Json | null
          created_at: string | null
          data_criacao: string | null
          id: string
          requisicao_id: string
        }
        Insert: {
          candidatos?: Json | null
          created_at?: string | null
          data_criacao?: string | null
          id?: string
          requisicao_id?: string
        }
        Update: {
          candidatos?: Json | null
          created_at?: string | null
          data_criacao?: string | null
          id?: string
          requisicao_id?: string
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
      recebimentos: {
        Row: {
          anexos_nf: Json | null
          created_at: string | null
          data_recebimento: string | null
          fornecedor_nome: string | null
          id: string
          itens: Json | null
          local_entrega: string | null
          nota_fiscal: string | null
          observacao_geral: string | null
          pedido_id: string | null
          pedido_numero: number | null
          requisicao_id: string | null
          requisicao_numero: number | null
          tipo: string | null
          usuario: string | null
        }
        Insert: {
          anexos_nf?: Json | null
          created_at?: string | null
          data_recebimento?: string | null
          fornecedor_nome?: string | null
          id?: string
          itens?: Json | null
          local_entrega?: string | null
          nota_fiscal?: string | null
          observacao_geral?: string | null
          pedido_id?: string | null
          pedido_numero?: number | null
          requisicao_id?: string | null
          requisicao_numero?: number | null
          tipo?: string | null
          usuario?: string | null
        }
        Update: {
          anexos_nf?: Json | null
          created_at?: string | null
          data_recebimento?: string | null
          fornecedor_nome?: string | null
          id?: string
          itens?: Json | null
          local_entrega?: string | null
          nota_fiscal?: string | null
          observacao_geral?: string | null
          pedido_id?: string | null
          pedido_numero?: number | null
          requisicao_id?: string | null
          requisicao_numero?: number | null
          tipo?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      requisicoes: {
        Row: {
          aprovado_por: string | null
          atividades_cargo: string | null
          carga_horaria: string | null
          cargo_id: string | null
          cargo_nome: string | null
          cargo_substituido: string | null
          conhecimento_informatica: string | null
          created_at: string | null
          data_criacao: string | null
          data_desligamento: string | null
          experiencia: string | null
          formacao: Json | null
          formacao_detalhe: string | null
          headcount: string | null
          historico_status: Json | null
          id: string
          interno_externo: string | null
          jornada: string | null
          matricula: string | null
          motivo_outros: string | null
          nome_substituido: string | null
          numero: number
          orcamento: string | null
          origem_vaga: string | null
          salario_substituido: string | null
          salario_vaga: string | null
          status: string | null
          tipo_contratacao: Json | null
          tipo_vaga: string | null
          unidade: string | null
        }
        Insert: {
          aprovado_por?: string | null
          atividades_cargo?: string | null
          carga_horaria?: string | null
          cargo_id?: string | null
          cargo_nome?: string | null
          cargo_substituido?: string | null
          conhecimento_informatica?: string | null
          created_at?: string | null
          data_criacao?: string | null
          data_desligamento?: string | null
          experiencia?: string | null
          formacao?: Json | null
          formacao_detalhe?: string | null
          headcount?: string | null
          historico_status?: Json | null
          id?: string
          interno_externo?: string | null
          jornada?: string | null
          matricula?: string | null
          motivo_outros?: string | null
          nome_substituido?: string | null
          numero?: number
          orcamento?: string | null
          origem_vaga?: string | null
          salario_substituido?: string | null
          salario_vaga?: string | null
          status?: string | null
          tipo_contratacao?: Json | null
          tipo_vaga?: string | null
          unidade?: string | null
        }
        Update: {
          aprovado_por?: string | null
          atividades_cargo?: string | null
          carga_horaria?: string | null
          cargo_id?: string | null
          cargo_nome?: string | null
          cargo_substituido?: string | null
          conhecimento_informatica?: string | null
          created_at?: string | null
          data_criacao?: string | null
          data_desligamento?: string | null
          experiencia?: string | null
          formacao?: Json | null
          formacao_detalhe?: string | null
          headcount?: string | null
          historico_status?: Json | null
          id?: string
          interno_externo?: string | null
          jornada?: string | null
          matricula?: string | null
          motivo_outros?: string | null
          nome_substituido?: string | null
          numero?: number
          orcamento?: string | null
          origem_vaga?: string | null
          salario_substituido?: string | null
          salario_vaga?: string | null
          status?: string | null
          tipo_contratacao?: Json | null
          tipo_vaga?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      requisicoes_compras: {
        Row: {
          anexos: Json | null
          centro_custo: string | null
          centro_custo_nome: string | null
          created_at: string | null
          data_criacao: string | null
          historico_status: Json | null
          id: string
          itens: Json | null
          justificativa: string | null
          local_entrega: string | null
          numero: number
          prazo_desejado: string | null
          solicitante: string | null
          status: string | null
          urgencia: string | null
        }
        Insert: {
          anexos?: Json | null
          centro_custo?: string | null
          centro_custo_nome?: string | null
          created_at?: string | null
          data_criacao?: string | null
          historico_status?: Json | null
          id?: string
          itens?: Json | null
          justificativa?: string | null
          local_entrega?: string | null
          numero?: number
          prazo_desejado?: string | null
          solicitante?: string | null
          status?: string | null
          urgencia?: string | null
        }
        Update: {
          anexos?: Json | null
          centro_custo?: string | null
          centro_custo_nome?: string | null
          created_at?: string | null
          data_criacao?: string | null
          historico_status?: Json | null
          id?: string
          itens?: Json | null
          justificativa?: string | null
          local_entrega?: string | null
          numero?: number
          prazo_desejado?: string | null
          solicitante?: string | null
          status?: string | null
          urgencia?: string | null
        }
        Relationships: []
      }
      scos: {
        Row: {
          cod_sco: string | null
          created_at: string | null
          descricao_sco: string | null
          id: string
          tipo: string | null
          unidade: string | null
        }
        Insert: {
          cod_sco?: string | null
          created_at?: string | null
          descricao_sco?: string | null
          id?: string
          tipo?: string | null
          unidade?: string | null
        }
        Update: {
          cod_sco?: string | null
          created_at?: string | null
          descricao_sco?: string | null
          id?: string
          tipo?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cargo_id: string | null
          clientes_permitidos: Json | null
          created_at: string | null
          email: string
          id: string
          nome: string
          perfil_acesso_id: string | null
          senha: string
          telefone: string | null
        }
        Insert: {
          cargo_id?: string | null
          clientes_permitidos?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          perfil_acesso_id?: string | null
          senha?: string
          telefone?: string | null
        }
        Update: {
          cargo_id?: string | null
          clientes_permitidos?: Json | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          perfil_acesso_id?: string | null
          senha?: string
          telefone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
