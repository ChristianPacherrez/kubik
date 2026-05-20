import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-kubik-950 via-kubik-900 to-kubik-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-kubik-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-white font-bold text-2xl">Kubik</span>
        </div>

        {/* Clerk maneja todo el formulario de sign-up */}
        <SignUp />
      </div>
    </div>
  )
}
