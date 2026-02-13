"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AchievementProps {
    title: string;
    description: string;
    icon: string;
    onClose: () => void;
}

export default function AchievementCard({ title, description, icon, onClose }: AchievementProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-12 right-12 z-[100] w-80 bg-gradient-to-br from-indigo-600 to-purple-700 p-1 rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.5)]"
        >
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-[22px] p-6 flex items-start gap-4">
                <div className="text-4xl">{icon}</div>
                <div className="flex-1">
                    <h4 className="text-white font-black text-lg tracking-tight">ACHIEVEMENT UNLOCKED</h4>
                    <div className="h-1 w-12 bg-indigo-500 rounded-full my-2" />
                    <p className="text-indigo-100 font-bold text-sm tracking-wide">{title}</p>
                    <p className="text-indigo-200/60 text-[10px] mt-1 uppercase tracking-widest">{description}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-white/20 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>
        </motion.div>
    );
}
