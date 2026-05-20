import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/context/ThemeContext'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kubik — Oficina Virtual',
  description: 'La oficina virtual gamificada para equipos remotos',
}

// Layout raíz: ClerkProvider (auth) + ThemeProvider (dark/light persistence)
//
// Redirects de Clerk se configuran vía variables de entorno (ver .env.local):
//   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL  → destino tras sign-in (sin ?redirect_url)
//   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL  → destino tras sign-up (sin ?redirect_url)
//   afterSignOutUrl aquí → destino tras signOut() (no tiene var de entorno en v5.7)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">

      <html lang="es" className="dark" suppressHydrationWarning>
        <body>
          <ThemeProvider>
            <TooltipProvider delayDuration={400}>
              {children}
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
