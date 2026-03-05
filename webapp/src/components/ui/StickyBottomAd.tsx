'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import AdSense from './AdSense';

export default function StickyBottomAd() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center">
            {/* Close Button - Google AdSense style */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-white border border-gray-200 border-b-0 rounded-t-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-t-lg"
                    aria-label="Cerrar anuncio"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
            </div>

            {/* Ad Container */}
            <div className="w-full max-w-screen-xl mx-auto flex justify-center py-0">
                <div className="w-full text-center relative h-[90px] overflow-hidden flex items-center justify-center bg-gray-50">
                    <span className="text-[9px] text-gray-400 absolute left-2 top-0.5 z-10 w-full text-left bg-gradient-to-r from-gray-50/80 to-transparent pl-1">Anuncio</span>
                    {/* Constraining AdSense div strictly */}
                    <div className="w-full h-full flex items-center justify-center overflow-hidden pt-3">
                        <AdSense
                            slot="5992307942"
                            format="horizontal"
                            className="!my-0 !p-0"
                            style={{ display: 'inline-block', width: '100%', height: '90px' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
