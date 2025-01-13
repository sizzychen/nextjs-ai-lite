/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '3000-fe237633c482-web.staging.clackypaas.com'
      ]
    }
  }
}

export default nextConfig