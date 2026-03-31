'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

const MAX_REACTIONS = 50;

export default function ReactionLayer({ socket, eventId }: ReactionLayerProps) {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const timeoutRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    // Clear all pending timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current.clear();
        };
    }, []);

    const addReaction = useCallback((emoji: string) => {
        const x = Math.floor(Math.random() * 5) + 90;
        const y = Math.floor(Math.random() * 5) + 80;
        const id = Math.random().toString(36).substring(2, 9);

        setReactions((prev) => {
            const next = [...prev, { id, emoji, x, y }];
            // Cap to avoid unbounded growth on high-activity events
            return next.length > MAX_REACTIONS ? next.slice(-MAX_REACTIONS) : next;
        });

        const t = setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
            timeoutRefs.current.delete(t);
        }, 11000);
        timeoutRefs.current.add(t);
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
                            duration: 10,
                            ease: "easeOut",
                            times: [0, 0.05, 0.5, 1]
                        }}
                        className="absolute text-xl md:text-2xl select-none"
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
