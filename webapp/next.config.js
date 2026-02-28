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
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    experimental: {
        workerThreads: false,
        cpus: 1
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://ppv-backend.onrender.com/api/:path*',
            },
            {
                source: '/uploads/:path*',
                destination: 'https://ppv-backend.onrender.com/uploads/:path*',
            },
            {
                source: '/socket.io/:path*',
                destination: 'https://ppv-backend.onrender.com/socket.io/:path*',
            },
            {
                source: '/socket.io',
                destination: 'https://ppv-backend.onrender.com/socket.io/',
            },
        ]
    },
}

module.exports = nextConfig
