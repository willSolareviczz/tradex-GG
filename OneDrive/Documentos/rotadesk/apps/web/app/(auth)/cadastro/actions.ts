'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
export async function cadastrar(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const nome = (formData.get('nome') as string)?.trim()

  if (!email || !password || !nome) {
    return { error: 'Todos os campos são obrigatórios.' }
  }
  if (email.length > 255 || nome.length > 255) {
    return { error: 'Entrada inválida.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    return { error: error?.message ?? 'Erro ao criar conta.' }
  }

  const { error: insertError } = await supabase
    .from('operadoras')
    .insert({ user_id: data.user.id, nome, email })

  if (insertError) {
    // Note: auth user is created but operadora insert failed.
    // In production, use a DB trigger to create operadora on user signup.
    return { error: 'Erro ao salvar dados da transportadora. Tente novamente.' }
  }

  redirect('/dashboard')
}
