'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';

interface Reaction {
    id: string;
    emoji: string;
    x: number; // Random horizontal position (0-100%)
    y: number; // Random vertical position (0-100%)
}

interface ReactionLayerProps {
    socket: Socket | null;
    eventId: string;
}

export default function ReactionLayer({ socket, eventId }: ReactionLayerProps) {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    const addReaction = useCallback((emoji: string) => {
        const x = Math.floor(Math.random() * 5) + 90; // Rango 90-95% del ancho total
        const y = Math.floor(Math.random() * 5) + 80; // Rango 80-85% del alto (Un poco más arriba)
        const id = Math.random().toString(36).substring(2, 9);

        setReactions((prev) => [...prev, { id, emoji, x, y }]);

        // Remove reaction after animation completes (approx 6s + buffer)
        setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
        }, 7000);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewReaction = (data: { emoji: string; eventId: string }) => {
            // Only show reactions for this event
            addReaction(data.emoji);
        };

        socket.on('new_reaction', handleNewReaction);

        return () => {
            socket.off('new_reaction', handleNewReaction);
        };
    }, [socket, addReaction]);

    return (
        <div className="absolute inset-x-0 bottom-16 top-0 pointer-events-none overflow-hidden z-20">

            <AnimatePresence>
                {reactions.map((reaction) => (
                    <motion.div
                        key={reaction.id}
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        style={{ left: `${reaction.x}%`, top: `${reaction.y}%` }}
                        animate={{
                            opacity: [0, 1, 0, 0],
                            y: -800,
                            scale: [0.5, 1.2, 1, 0.8],
                            rotate: [0, -10, 10, 0]
                        }}
                        transition={{
                            duration: 6,
                            ease: "easeOut",
                            times: [0, 0.05, 0.5, 1]
                        }}
                        className="absolute text-3xl md:text-5xl select-none"
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
