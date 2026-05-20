import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

// Landing page / página de marketing
// Si el usuario ya está autenticado, redirigir directamente a la oficina
export default async function HomePage() {
  const { userId } = await auth()

  // Redirigir a la oficina si ya está logueado
  if (userId) {
    redirect('/office')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-kubik-950 via-kubik-900 to-kubik-800">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-kubik-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="text-white font-bold text-xl">Kubik</span>
        </div>
        <Link
          href="/sign-in"
          className="px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-kubik-500/20 border border-kubik-500/30 rounded-full mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-kubik-300 text-sm font-medium">12 personas en la oficina ahora</span>
        </div>

        {/* Título */}
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight max-w-4xl">
          Tu equipo remoto,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-kubik-400 to-purple-400">
            en el mismo espacio
          </span>
        </h1>

        <p className="text-lg md:text-xl text-kubik-300 mb-12 max-w-2xl leading-relaxed">
          Kubik es la oficina virtual gamificada donde tu equipo puede colaborar, reunirse y conectar —
          como si estuvieran en el mismo lugar.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/sign-up"
            className="px-8 py-4 bg-kubik-500 hover:bg-kubik-400 text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-kubik-500/25"
          >
            Empezar gratis →
          </Link>
          <Link
            href="/sign-in"
            className="px-8 py-4 text-kubik-300 hover:text-white font-medium text-lg transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full">
          {[
            {
              icon: '🗺️',
              title: 'Mapa virtual',
              desc: 'Mueve tu avatar por la oficina y entra a salas de reunión con un clic.',
            },
            {
              icon: '⚡',
              title: 'Presencia en tiempo real',
              desc: 'Ve al instante quién está disponible, ocupado o en una reunión.',
            },
            {
              icon: '🎮',
              title: 'Gamificación',
              desc: 'Gana XP, desbloquea logros y personaliza tu avatar mientras trabajas.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-kubik-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
