export default function MissingConfig() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm border border-yellow-100 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 text-3xl">
          ⚙️
        </div>

        <h1 className="text-xl font-semibold text-gray-800">
          Configure o Supabase
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          As variáveis de ambiente estão faltando. O app não consegue se conectar.
        </p>

        <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 px-5 py-4 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Como resolver
          </p>
          <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
            <li>Copie <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">.env.example</code> para <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">.env.local</code></li>
            <li>Preencha <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code></li>
            <li>Preencha <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code></li>
            <li>Reinicie o servidor com <code className="rounded bg-gray-200 px-1 py-0.5 text-xs">npm run dev</code></li>
          </ol>
        </div>

        <p className="mt-5 text-xs text-gray-400">
          Encontre os valores em{' '}
          <span className="font-medium text-gray-500">
            Supabase → Project Settings → API
          </span>
        </p>
      </div>
    </div>
  )
}
