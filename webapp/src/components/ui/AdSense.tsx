'use client';

import { useEffect } from 'react';

interface AdSenseProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
    responsive?: 'true' | 'false';
    className?: string;
    style?: React.CSSProperties;
}

const AdSense = ({
    slot,
    format = 'auto',
    responsive = 'true',
    className = '',
    style = { display: 'block' }
}: AdSenseProps) => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    return (
        <div className={`adsense-container overflow-hidden my-4 ${className}`}>
            <ins
                className="adsbygoogle"
                style={style}
                data-ad-client="ca-pub-3458573665593188"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />
        </div>
    );
};

export default AdSense;
