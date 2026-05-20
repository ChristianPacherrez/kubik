/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Exponer variables de entorno al cliente (solo las NEXT_PUBLIC_*)
  // Las privadas (sin prefijo) solo están disponibles en el servidor
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  images: {
    // Permitir imágenes de Clerk (avatars) y otras fuentes comunes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },

  // Alias @ → src/ explícito para webpack
  // Necesario para que el bundler resuelva correctamente @/store/*, @/components/*, etc.
  // tsconfig paths solos no son suficientes en todos los entornos de build.
  webpack(config) {
    config.resolve.alias['@'] = path.join(__dirname, 'src')
    return config
  },
}

module.exports = nextConfig
