import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
});

export const viewport: Viewport = {
    themeColor: '#020617',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'),
    title: 'Arena Fight Pass - Peleas en Vivo',
    description: 'La plataforma oficial de streaming de deportes de combate. Compra tu acceso y disfruta de los mejores eventos en vivo.',
    keywords: 'boxeo, mma, kickboxing, streaming, ppv, en vivo, peleas, arena fight pass',
    authors: [{ name: 'Arena Fight Pass' }],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Arena PPV',
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
    openGraph: {
        title: 'Arena Fight Pass - Streaming de Combate',
        description: 'Disfruta de las mejores peleas en vivo y en alta definición.',
        type: 'website',
        images: ['/og-image.png'],
    },
};

// Client Component wrapper for Dynamic Favicon
import Favicon from '@/components/ui/Favicon';

import Navbar from '@/components/ui/Navbar';
import SettingsProvider from '@/components/providers/SettingsProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import SessionWatcher from '@/components/providers/SessionWatcher';
import CookieBanner from '@/components/ui/CookieBanner';
import PayPalProvider from '@/components/providers/PayPalProvider';
import Script from 'next/script';

import SponsorSplash from '@/components/SponsorSplash';
import PageViewTracker from '@/components/PageViewTracker';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
            <head>
                <Favicon />
                <meta name="google-adsense-account" content="ca-pub-3458573665593188" />
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3458573665593188"
                    crossOrigin="anonymous"
                ></script>
            </head>
            <body className="font-sans">
                {/* Google Analytics GA4 */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-6VRSVRWWL7"
                    strategy="afterInteractive"
                />
                <Script
                    id="ga4-init"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-6VRSVRWWL7');
                        `,
                    }}
                />

                {/* Meta Pixel */}
                {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
                    <Script
                        id="meta-pixel"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                                n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
                                document,'script','https://connect.facebook.net/en_US/fbevents.js');
                                fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                                fbq('track', 'PageView');
                            `,
                        }}
                    />
                )}

                <Script
                    src="https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
                    strategy="afterInteractive"
                />
                <Script
                    id="register-sw"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function() {
                                    navigator.serviceWorker.register('/sw.js');
                                });
                            }
                        `,
                    }}
                />
                <LanguageProvider>
                    <SettingsProvider>
                        <PayPalProvider>
                            <SessionWatcher />
                            <PageViewTracker />
                            <SponsorSplash />
                            <Navbar />
                            {children}
                            <CookieBanner />
                        </PayPalProvider>
                    </SettingsProvider>
                </LanguageProvider>

                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b',
                            color: '#f8fafc',
                            border: '1px solid #334155',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#f8fafc',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444',
                                secondary: '#f8fafc',
                            },
                        },
                    }}
                />
            </body>
        </html>
    );
}
