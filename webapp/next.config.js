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
}

module.exports = nextConfig
