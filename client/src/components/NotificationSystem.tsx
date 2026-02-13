"use client";

import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function NotificationSystem() {
    const { notifications } = useGameStore();
    const [visibleToasts, setVisibleToasts] = useState<string[]>([]);

    // Sync store notifications to local state for handling dismissal
    useEffect(() => {
        if (notifications.length > 0) {
            // Get the latest notification (simplified for now)
            const latest = notifications[notifications.length - 1];
            if (!visibleToasts.includes(latest)) {
                setVisibleToasts((prev) => [...prev, latest]);

                // Auto dismiss
                setTimeout(() => {
                    setVisibleToasts((prev) => prev.filter(t => t !== latest));
                }, 4000);
            }
        }
    }, [notifications, visibleToasts]);

    return (
        <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {visibleToasts.map((note, idx) => (
                    <motion.div
                        key={`${note}-${idx}`}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className="bg-surface/90 backdrop-blur-md border border-surface-highlight p-4 rounded-xl shadow-2xl flex items-center gap-3 w-80 pointer-events-auto"
                    >
                        <div className="p-2 bg-primary/20 rounded-lg text-primary font-bold flex items-center justify-center w-8 h-8 font-display">
                            !
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wide">Update</h4>
                            <p className="text-xs text-foreground-muted font-sans font-medium">{note}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
