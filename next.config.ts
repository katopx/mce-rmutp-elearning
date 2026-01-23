import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true, // หรือ false ถ้าอนาคตจะกลับมาใช้หน้า /
      },
    ]
  },
}

export default nextConfig
