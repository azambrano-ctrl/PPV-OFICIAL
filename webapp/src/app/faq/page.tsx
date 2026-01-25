'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
    const faqs = [
        {
            q: "¿Cómo compro un evento?",
            a: "Selecciona el evento que deseas ver, haz clic en 'Comprar Ticket' y elige tu método de pago preferido (PayPal o Tarjeta)."
        },
        {
            q: "¿Puedo ver los eventos desde mi celular?",
            a: "Sí, nuestra plataforma es totalmente compatible con dispositivos móviles, tablets y computadoras."
        },
        {
            q: "El video se detiene, ¿qué hago?",
            a: "Verifica tu conexión a internet. Recomendamos una velocidad mínima de 10 Mbps para una experiencia fluida en HD."
        },
        {
            q: "¿Cómo accedo a las repeticiones?",
            a: "Una vez comprado el ticket, puedes acceder a la repetición del evento en cualquier momento desde tu perfil o la página del evento."
        }
    ];

    return (
        <div className="min-h-screen bg-dark-950 pt-24 pb-12 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 gradient-text text-center">Preguntas Frecuentes</h1>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <FAQItem key={i} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-dark-800 rounded-lg overflow-hidden bg-dark-900/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 flex justify-between items-center text-left hover:bg-dark-800 transition-colors"
            >
                <span className="font-medium">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-dark-900 text-dark-400 border-t border-dark-800">
                    {answer}
                </div>
            )}
        </div>
    );
}
