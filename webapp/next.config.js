/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'via.placeholder.com'],
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
        dangerouslyAllowSVG: true,
    },
    reactStrictMode: true,
    swcMinify: true,
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://ppv-backend.onrender.com/api/:path*',
            },
        ]
    },
}

module.exports = nextConfig
