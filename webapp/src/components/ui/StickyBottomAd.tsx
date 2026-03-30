'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdSense from './AdSense';

export default function StickyBottomAd() {
    const [isMinimized, setIsMinimized] = useState(true);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 hidden md:flex flex-col items-center justify-center pointer-events-none">
            {/* The actual visible box that holds the ad */}
            <div
                className={`relative bg-white border border-gray-200 border-b-0 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] pointer-events-auto w-full max-w-[728px] mx-auto rounded-t-lg transition-all duration-300 ease-in-out ${isMinimized ? 'translate-y-full' : 'translate-y-0'}`}
            >
                {/* Toggle Button */}
                <div className="absolute top-0 right-0 -translate-y-full bg-white border border-gray-200 border-b-0 rounded-t-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="px-3 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-t-lg"
                        aria-label={isMinimized ? "Mostrar anuncio" : "Ocultar anuncio"}
                    >
                        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Ad Container — Google manages size automatically */}
                <div className="w-full block text-center relative bg-gray-50 rounded-b-lg overflow-hidden">
                    <span className="text-[9px] text-gray-400 absolute left-2 top-0.5 z-10 px-1 font-sans">Anuncio</span>
                    <div className="w-full max-w-[728px] mx-auto block pt-3">
                        <AdSense
                            slot="5992307942"
                            format="auto"
                            responsive="true"
                            className="!my-0 !p-0 mx-auto w-full"
                            style={{ display: 'block' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
