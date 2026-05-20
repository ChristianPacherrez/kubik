import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

// Layout protegido para todas las rutas de la oficina
// La verificación en el servidor evita cualquier flash de contenido no autorizado
export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
