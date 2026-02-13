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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
            <head>
                <Favicon />
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3458573665593188"
                    crossOrigin="anonymous"></script>
            </head>
            <body className="font-sans">
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
