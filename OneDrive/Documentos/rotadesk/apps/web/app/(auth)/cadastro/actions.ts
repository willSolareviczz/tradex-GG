'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@rotadesk/supabase'

type OperadoraInsert = Database['public']['Tables']['operadoras']['Insert']

export async function cadastrar(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nome = formData.get('nome') as string

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    return { error: error?.message ?? 'Erro ao criar conta.' }
  }

  const payload: OperadoraInsert = { user_id: data.user.id, nome, email }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await supabase
    .from('operadoras')
    .insert(payload as any)

  if (insertError) {
    return { error: 'Erro ao salvar dados da transportadora.' }
  }

  redirect('/dashboard')
}
