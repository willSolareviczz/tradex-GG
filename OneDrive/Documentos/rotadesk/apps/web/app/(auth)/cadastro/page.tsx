import { cadastrar } from './actions'

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rotadesk</h1>
        <p className="text-gray-500 mb-8">Cadastre sua transportadora</p>

        <form className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da transportadora
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transportadora XYZ"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="sua@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            formAction={cadastrar as unknown as (formData: FormData) => void}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar conta
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
