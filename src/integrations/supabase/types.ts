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
      clientes: {
        Row: {
          bairro: string | null
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
      materiais_servicos: {
        Row: {
          categoria_id: string | null
          codigo: string | null
          created_at: string | null
          descricao: string | null
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
          fabricante_id?: string | null
          id?: string
          tipo?: string | null
          unidade_medida?: string | null
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
          historico_status: Json | null
          id: string
          interno_externo: string | null
          jornada: string | null
          matricula: string | null
          motivo_outros: string | null
          nome_substituido: string | null
          numero: number
          origem_vaga: string | null
          salario_substituido: string | null
          salario_vaga: string | null
          status: string | null
          tipo_contratacao: Json | null
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
          historico_status?: Json | null
          id?: string
          interno_externo?: string | null
          jornada?: string | null
          matricula?: string | null
          motivo_outros?: string | null
          nome_substituido?: string | null
          numero?: number
          origem_vaga?: string | null
          salario_substituido?: string | null
          salario_vaga?: string | null
          status?: string | null
          tipo_contratacao?: Json | null
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
          historico_status?: Json | null
          id?: string
          interno_externo?: string | null
          jornada?: string | null
          matricula?: string | null
          motivo_outros?: string | null
          nome_substituido?: string | null
          numero?: number
          origem_vaga?: string | null
          salario_substituido?: string | null
          salario_vaga?: string | null
          status?: string | null
          tipo_contratacao?: Json | null
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
      usuarios: {
        Row: {
          cargo_id: string | null
          clientes_permitidos: Json | null
          created_at: string | null
          email: string
          id: string
          nome: string
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
