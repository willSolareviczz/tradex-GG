export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      operadoras: {
        Row: {
          id: string
          user_id: string
          nome: string
          email: string
          plano: 'free' | 'starter' | 'pro'
          pacotes_mes: number
          stripe_customer_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          email: string
          plano?: 'free' | 'starter' | 'pro'
          pacotes_mes?: number
          stripe_customer_id?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          nome?: string
          email?: string
          plano?: 'free' | 'starter' | 'pro'
          pacotes_mes?: number
          stripe_customer_id?: string | null
        }
      }
      entregadores: {
        Row: {
          id: string
          user_id: string | null
          operadora_id: string
          nome: string
          telefone: string
          ativo: boolean
          criado_em: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          operadora_id: string
          nome: string
          telefone: string
          ativo?: boolean
          criado_em?: string
        }
        Update: {
          nome?: string
          telefone?: string
          ativo?: boolean
        }
      }
      rotas: {
        Row: {
          id: string
          operadora_id: string
          entregador_id: string | null
          data: string
          status: 'ativa' | 'concluida'
          criado_em: string
        }
        Insert: {
          id?: string
          operadora_id: string
          entregador_id?: string | null
          data: string
          status?: 'ativa' | 'concluida'
          criado_em?: string
        }
        Update: {
          entregador_id?: string | null
          status?: 'ativa' | 'concluida'
        }
      }
      pacotes: {
        Row: {
          id: string
          operadora_id: string
          rota_id: string | null
          entregador_id: string | null
          codigo_rastreio: string | null
          destinatario_nome: string
          destinatario_telefone: string | null
          destinatario_endereco: string
          destinatario_lat: number | null
          destinatario_lng: number | null
          status: 'pendente' | 'em_rota' | 'entregue' | 'falhou'
          motivo_falha: string | null
          foto_comprovante_url: string | null
          ordem_rota: number | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          operadora_id: string
          rota_id?: string | null
          entregador_id?: string | null
          codigo_rastreio?: string | null
          destinatario_nome: string
          destinatario_telefone?: string | null
          destinatario_endereco: string
          destinatario_lat?: number | null
          destinatario_lng?: number | null
          status?: 'pendente' | 'em_rota' | 'entregue' | 'falhou'
          motivo_falha?: string | null
          foto_comprovante_url?: string | null
          ordem_rota?: number | null
        }
        Update: {
          rota_id?: string | null
          entregador_id?: string | null
          status?: 'pendente' | 'em_rota' | 'entregue' | 'falhou'
          motivo_falha?: string | null
          foto_comprovante_url?: string | null
          ordem_rota?: number | null
        }
      }
    }
  }
}

export type Operadora = Database['public']['Tables']['operadoras']['Row']
export type Entregador = Database['public']['Tables']['entregadores']['Row']
export type Rota = Database['public']['Tables']['rotas']['Row']
export type Pacote = Database['public']['Tables']['pacotes']['Row']
export type PacoteInsert = Database['public']['Tables']['pacotes']['Insert']
export type StatusPacote = Pacote['status']
