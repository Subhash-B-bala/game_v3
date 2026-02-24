"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement } from '@/engine/types';

interface Props {
    achievement: Achievement;
    onComplete: () => void;
}

export default function AchievementToast({ achievement, onComplete }: Props) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 500);
        }, 4000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    const tierColors = {
        bronze: 'from-amber-700 to-amber-900',
        silver: 'from-gray-400 to-gray-600',
        gold: 'from-yellow-400 to-yellow-600',
        platinum: 'from-purple-400 to-purple-600'
    };

    const tierBorders = {
        bronze: 'border-amber-500',
        silver: 'border-gray-400',
        gold: 'border-yellow-400',
        platinum: 'border-purple-400'
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.8 }}
                    transition={{ type: "spring", damping: 15, stiffness: 300 }}
                    className="fixed top-20 right-6 z-[100] max-w-sm"
                >
                    <div className={`bg-gradient-to-br ${tierColors[achievement.tier]} p-1 rounded-2xl shadow-2xl`}>
                        <div className="bg-gray-900 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <motion.div
                                    initial={{ rotate: -180, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="text-5xl"
                                >
                                    {achievement.icon}
                                </motion.div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">
                                        {achievement.hidden ? '🎁 SECRET' : achievement.tier} Achievement
                                    </div>
                                    <div className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                                        {achievement.name}
                                    </div>
                                    <div className="text-xs text-white/70 mt-1">
                                        {achievement.description}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Particle effects for platinum/gold */}
                    {(achievement.tier === 'platinum' || achievement.tier === 'gold') && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={`absolute w-2 h-2 rounded-full ${
                                        achievement.tier === 'platinum' ? 'bg-purple-400' : 'bg-yellow-400'
                                    }`}
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                    }}
                                    animate={{
                                        x: [0, Math.cos(i * Math.PI / 4) * 60],
                                        y: [0, Math.sin(i * Math.PI / 4) * 60],
                                        opacity: [1, 0],
                                        scale: [1, 0]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        delay: 0.3,
                                        repeat: Infinity,
                                        repeatDelay: 2
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
