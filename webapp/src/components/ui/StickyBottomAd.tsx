'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdSense from './AdSense';

export default function StickyBottomAd() {
    const [isMinimized, setIsMinimized] = useState(false);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-center pointer-events-none">
            {/* The actual visible box that holds the ad */}
            <div
                className={`relative bg-white border border-gray-200 border-b-0 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] pointer-events-auto w-full max-w-[728px] mx-auto rounded-t-lg transition-all duration-300 ease-in-out ${isMinimized ? 'translate-y-[90px]' : 'translate-y-0'}`}
            >

                {/* Close/Minimize Button - Google AdSense style */}
                <div className="absolute top-0 right-0 -translate-y-full bg-white border border-gray-200 border-b-0 rounded-t-lg shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="px-3 py-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center rounded-t-lg"
                        aria-label={isMinimized ? "Mostrar anuncio" : "Ocultar anuncio"}
                    >
                        {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Ad Container */}
                <div className="w-full text-center relative h-[90px] overflow-hidden flex items-center justify-center bg-gray-50">
                    <span className="text-[9px] text-gray-400 absolute left-2 top-0.5 z-10 text-left bg-gray-50 px-1 font-sans rounded">Anuncio</span>
                    {/* Constraining AdSense div strictly */}
                    <div className="w-full h-full flex items-center justify-center overflow-hidden pt-3">
                        <AdSense
                            slot="5992307942"
                            format="horizontal"
                            className="!my-0 !p-0"
                            style={{ display: 'flex', justifyContent: 'center', width: '100%', height: '90px' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
