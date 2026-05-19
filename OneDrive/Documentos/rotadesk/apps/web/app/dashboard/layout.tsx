import { logout } from '@/app/(auth)/login/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Operadora } from '@rotadesk/supabase'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: operadora } = await supabase
    .from('operadoras')
    .select('nome, plano, pacotes_mes')
    .eq('user_id', user!.id)
    .single() as { data: Pick<Operadora, 'nome' | 'plano' | 'pacotes_mes'> | null }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-blue-600">Rotadesk</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {operadora?.nome} · {operadora?.plano}
          </span>
          <form>
            <button
              formAction={logout}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Sair
            </button>
          </form>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
