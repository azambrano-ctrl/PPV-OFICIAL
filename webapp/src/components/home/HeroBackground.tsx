'use client';

import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/utils';

interface HeroBackgroundProps {
    videoUrl?: string | null;
    sliderImages?: string[];
    staticImage?: string | null;
    fallbackImage?: string | null;
    overlayClassName?: string;
    isFixed?: boolean;
    opacity?: number;
}

export default function HeroBackground({
    videoUrl,
    sliderImages = [],
    staticImage,
    fallbackImage,
    overlayClassName = "absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent",
    isFixed = false,
    opacity = 1
}: HeroBackgroundProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (sliderImages.length > 1 && !videoUrl) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [sliderImages, videoUrl]);

    const wrapperClass = isFixed ? "fixed inset-0 z-0" : "absolute inset-0 z-0";

    const renderContent = () => {
        // Priority 1: Video
        if (videoUrl) {
            return (
                <video
                    src={getImageUrl(videoUrl)}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            );
        }

        // Priority 2: Slider
        if (sliderImages && sliderImages.length > 0) {
            return (
                <div className="absolute inset-0 overflow-hidden">
                    {sliderImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <img
                                src={getImageUrl(img)}
                                alt={`Slide ${idx}`}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            );
        }

        // Priority 3: Static Image
        const finalImage = staticImage || fallbackImage;
        if (finalImage) {
            return (
                <img
                    src={getImageUrl(finalImage)}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            );
        }

        // Final Fallback: Gradient
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-black via-dark-950 to-red-950/20" />
        );
    };

    return (
        <div className={wrapperClass} style={{ opacity }}>
            {renderContent()}
            <div className={overlayClassName} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>
    );
}
