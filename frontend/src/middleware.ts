import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return

  const { userId } = auth()

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    return Response.redirect(signInUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
}