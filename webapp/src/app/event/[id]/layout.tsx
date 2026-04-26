import type { Metadata } from 'next';

interface Props {
    params: { id: string };
    children: React.ReactNode;
}

async function fetchEvent(id: string) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/events/${id}`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const event = await fetchEvent(params.id);
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Arena Fight Pass';
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://arenafightpass.com';

    if (!event) {
        return {
            title: `Evento | ${siteName}`,
            description: 'Streaming de deportes de combate en vivo.',
        };
    }

    const title = `${event.title} | ${siteName}`;
    const description = event.description
        ? event.description.slice(0, 155)
        : `Mira ${event.title} en vivo en ${siteName}. ¡Compra tu acceso ahora!`;
    const image = event.banner_url || event.thumbnail_url
        ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${event.banner_url || event.thumbnail_url}`
        : `${webUrl}/og-image.png`;
    const url = `${webUrl}/event/${event.id}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            images: [{ url: image, width: 1200, height: 630, alt: event.title }],
            siteName,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
        alternates: { canonical: url },
    };
}

export default function EventLayout({ children }: Props) {
    return <>{children}</>;
}
