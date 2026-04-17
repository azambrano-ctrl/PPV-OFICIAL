'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';

interface Reaction {
    id: string;
    emoji: string;
    x: number;       // horizontal position 65–96%
    size: number;     // font size in px: 20–40
    duration: number; // animation duration 4–8s
    delay: number;    // stagger delay 0–0.5s
}

interface ReactionLayerProps {
    socket: Socket | null;
    eventId: string;
}

const MAX_REACTIONS = 60;

export default function ReactionLayer({ socket, eventId }: ReactionLayerProps) {
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const timeoutRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    useEffect(() => {
        return () => {
            timeoutRefs.current.forEach(clearTimeout);
            timeoutRefs.current.clear();
        };
    }, []);

    const addReaction = useCallback((emoji: string) => {
        // Spread across right third of the screen
        const x = Math.random() * 28 + 68; // 68–96%
        const size = Math.floor(Math.random() * 20) + 20; // 20–40px
        const duration = Math.random() * 3 + 4.5; // 4.5–7.5s
        const delay = Math.random() * 0.4; // 0–0.4s stagger
        const id = Math.random().toString(36).substring(2, 9);

        setReactions((prev) => {
            const next = [...prev, { id, emoji, x, size, duration, delay }];
            return next.length > MAX_REACTIONS ? next.slice(-MAX_REACTIONS) : next;
        });

        const t = setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== id));
            timeoutRefs.current.delete(t);
        }, (duration + delay + 1) * 1000);
        timeoutRefs.current.add(t);
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewReaction = (data: { emoji: string; eventId: string }) => {
            addReaction(data.emoji);
        };

        socket.on('new_reaction', handleNewReaction);
        return () => { socket.off('new_reaction', handleNewReaction); };
    }, [socket, addReaction]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            <AnimatePresence>
                {reactions.map((reaction) => (
                    <motion.div
                        key={reaction.id}
                        className="absolute bottom-20 select-none"
                        style={{
                            left: `${reaction.x}%`,
                            fontSize: `${reaction.size}px`,
                            lineHeight: 1,
                        }}
                        initial={{ opacity: 0, y: 0, scale: 0.3 }}
                        animate={{
                            opacity: [0, 1, 1, 0.8, 0],
                            y: -(window.innerHeight * 0.75),
                            scale: [0.3, 1.2, 1.0, 0.9, 0.7],
                            x: [0, Math.random() * 30 - 15, Math.random() * 30 - 15, 0],
                        }}
                        transition={{
                            duration: reaction.duration,
                            delay: reaction.delay,
                            ease: 'easeOut',
                            times: [0, 0.1, 0.4, 0.7, 1],
                        }}
                        exit={{ opacity: 0 }}
                    >
                        {reaction.emoji}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
