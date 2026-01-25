import type { Metadata } from 'next';
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

export const metadata: Metadata = {
    title: 'PPV Streaming - Peleas en Vivo',
    description: 'Transmisión en vivo de las mejores peleas. Compra acceso y disfruta del mejor entretenimiento deportivo.',
    keywords: 'peleas, streaming, ppv, en vivo, deportes, boxeo, mma',
    authors: [{ name: 'PPV Streaming' }],
    openGraph: {
        title: 'PPV Streaming - Peleas en Vivo',
        description: 'Las mejores peleas en vivo',
        type: 'website',
    },
};

import Navbar from '@/components/ui/Navbar';

// ... imports ...

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-sans">
                <Navbar />
                {children}
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
