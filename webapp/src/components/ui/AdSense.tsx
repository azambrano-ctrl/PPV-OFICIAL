'use client';

import { useEffect, useRef } from 'react';

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
    const adRef = useRef<HTMLModElement>(null);
    const isAdPushed = useRef(false);

    useEffect(() => {
        // Only push once per component instance to avoid duplicate ad requests
        if (isAdPushed.current) return;

        // Small delay to ensure the DOM element is fully rendered before pushing
        const timer = setTimeout(() => {
            try {
                if (adRef.current && adRef.current.childElementCount === 0) {
                    // @ts-ignore
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                    isAdPushed.current = true;
                }
            } catch (err) {
                console.error('AdSense error:', err);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [slot]);

    return (
        <div className={`adsense-container overflow-hidden my-4 ${className}`}>
            <ins
                ref={adRef}
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
