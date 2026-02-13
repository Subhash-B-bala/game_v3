"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const TARGETS = [
    { label: "₹99 DATA COURSE", color: "#fb7185", type: "noise" },
    { label: "PAY ₹5K FOR JOB", color: "#f43f5e", type: "scam" },
    { label: "GURU CHEAT SHEET", color: "#a855f7", type: "noise" },
    { label: "EARN 1L/HR SCAM", color: "#ec4899", type: "scam" },
    { label: "BOT RESUME SPAM", color: "#f97316", type: "noise" }
];

const BOOSTERS = [
    { label: "REAL INTERNSHIP", color: "#10b981", type: "booster" },
    { label: "OPEN SOURCE PR", color: "#3b82f8", type: "booster" },
    { label: "PORTFOLIO WORK", color: "#818cf8", type: "booster" },
    { label: "RECRUITER CHAT", color: "#f472b6", type: "booster" }
];

const BOMBS = [
    { label: "BURNOUT NODE", color: "#ffffff", type: "bomb" }
];

interface NoiseObject {
    id: number;
    label: string;
    color: string;
    type: string;
    x: number;
    duration: number;
    delay: number;
    curve: number;
    isSlashed?: boolean;
}

export default function NoiseSlasher({ onComplete, updateStats }: { onComplete: () => void, updateStats: (s: any) => void }) {
    const slasherChances = useGameStore(state => state.getRefilledSlasherChances());
    const slasherLastRefill = useGameStore(state => state.slasherLastRefill);
    const useSlasherChance = useGameStore(state => state.useSlasherChance);

    const [gameState, setGameState] = useState<'intro' | 'playing' | 'result'>('intro');
    const [timeLeft, setTimeLeft] = useState(25);
    const [energyGained, setEnergyGained] = useState(0);
    const [spawnedObjects, setSpawnedObjects] = useState<NoiseObject[]>([]);
    const [combo, setCombo] = useState(0);
    const [bladeTrail, setBladeTrail] = useState<{ x: number, y: number }[]>([]);

    const [scamsSpawned, setScamsSpawned] = useState(0);
    const [scamsSliced, setScamsSliced] = useState(0);

    const energyRef = useRef(0);
    const nextId = useRef(0);
    const lastSliceTime = useRef(0);
    const comboRef = useRef(0);

    const VIDEO_LINK = "https://codebasics.io/courses/scam-awareness-course";

    // 1. Spawning Logic
    useEffect(() => {
        if (gameState !== 'playing') return;
        const interval = setInterval(() => {
            if (timeLeft <= 0) return;
            const seed = Math.random();
            let source;
            if (seed < 0.1) source = BOMBS[0];
            else if (seed < 0.35) source = BOOSTERS[Math.floor(Math.random() * BOOSTERS.length)];
            else {
                source = TARGETS[Math.floor(Math.random() * TARGETS.length)];
                setScamsSpawned(prev => prev + 1);
            }

            const newObj: NoiseObject = {
                id: ++nextId.current,
                label: source.label,
                color: source.color,
                type: source.type,
                x: 10 + Math.random() * 80,
                duration: 5 + Math.random() * 2,
                delay: Math.random() * 0.1,
                curve: (Math.random() - 0.5) * 300,
            };
            setSpawnedObjects(prev => [...prev, newObj]);

            setTimeout(() => {
                setSpawnedObjects(prev => prev.filter(o => o.id !== newObj.id));
            }, 8000);
        }, 550);
        return () => clearInterval(interval);
    }, [timeLeft, gameState]);

    // 2. Timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (gameState !== 'playing') return;
            setTimeLeft(t => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    // 2.5 Game Over Handler
    useEffect(() => {
        if (gameState === 'playing' && timeLeft <= 0) {
            setGameState('result');
            updateStats({ energy: Math.max(0, energyRef.current / 100) });
        }
    }, [timeLeft, gameState, updateStats]);

    // 3. Audio
    const playSlashSound = (pitch = 1000) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(pitch * 2, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(pitch / 2, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.12);
        } catch (e) { }
    };

    const handleSlashed = (obj: NoiseObject) => {
        if (obj.isSlashed || gameState !== 'playing') return;
        const now = Date.now();
        const timeSinceLast = now - lastSliceTime.current;
        lastSliceTime.current = now;

        if (obj.type !== 'booster' && timeSinceLast < 500) {
            comboRef.current++;
            if (comboRef.current >= 2) setCombo(comboRef.current);
        } else {
            comboRef.current = 1;
            setCombo(0);
        }

        playSlashSound(800 + (comboRef.current * 100));

        if (obj.type === 'bomb') energyRef.current = Math.max(0, energyRef.current - 20);
        else if (obj.type !== 'booster') {
            setScamsSliced(prev => prev + 1);
            energyRef.current = Math.min(100, energyRef.current + (comboRef.current >= 3 ? 5 : 3.5));
        }

        setEnergyGained(Math.round(energyRef.current));
        setSpawnedObjects(prev => prev.map(o => o.id === obj.id ? { ...o, isSlashed: true } : o));
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const x = e.clientX, y = e.clientY;
        setBladeTrail(prev => [...prev, { x, y }].slice(-12));
    };

    const awarenessScore = scamsSpawned > 0 ? Math.round((scamsSliced / scamsSpawned) * 100) : 0;
    const isAware = awarenessScore >= 70;

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] overflow-hidden cursor-none select-none touch-none" onMouseMove={handleMouseMove}>

            {/* Background */}
            <div className="absolute inset-0 bg-blue-900/5" />

            {/* Header */}
            <div className="absolute top-10 left-10 pointer-events-none z-[10010]">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2">Tactical Intelligence</h3>
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Clear the Noise</h2>
            </div>

            <div className="absolute top-10 right-10 flex gap-8 pointer-events-none z-[10010]">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attempts Left</p>
                    <div className="flex gap-1 justify-end">
                        {[...Array(3)].map((_, i) => (
                            <motion.span
                                key={i}
                                animate={i < slasherChances ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0.3 }}
                                className="text-xl"
                            >
                                {i < slasherChances ? '⚡' : '�'}
                            </motion.span>
                        ))}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timer</p>
                    <p className="text-2xl font-black text-white">{timeLeft}s</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Energy</p>
                    <p className="text-2xl font-black text-emerald-400">+{energyGained}%</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {gameState === 'intro' ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-[10050] bg-slate-950/80 backdrop-blur-lg"
                    >
                        <div className="max-w-md w-full mx-6 p-10 bg-slate-900 border border-white/10 rounded-[3rem] text-center shadow-2xl">
                            <h2 className="text-4xl font-black italic tracking-tighter mb-4 text-white">RECOVERY PROTOCOL</h2>
                            <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-[10px]">
                                Use 1 Energy Token to start session
                            </p>

                            {slasherChances > 0 ? (
                                <button
                                    onClick={() => {
                                        if (useSlasherChance()) setGameState('playing');
                                    }}
                                    className="w-full py-5 bg-emerald-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span>START MISSION</span>
                                    <span className="text-sm">⚡</span>
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                        <p className="text-rose-400 font-black uppercase text-[10px] mb-2">OUT OF CHANCES</p>
                                        <p className="text-slate-400 text-xs font-mono">
                                            Refill in: {(() => {
                                                if (!slasherLastRefill) return "0:00";
                                                const waitTime = (2 * 60 * 60 * 1000) - (Date.now() - slasherLastRefill);
                                                const hours = Math.floor(waitTime / (1000 * 60 * 60));
                                                const mins = Math.floor((waitTime % (1000 * 60 * 60)) / (1000 * 60));
                                                return `${hours}h ${mins}m`;
                                            })()}
                                        </p>
                                    </div>
                                    <button onClick={onComplete} className="w-full py-4 bg-white/10 text-white font-bold uppercase text-[10px] rounded-xl">
                                        BACK TO PATH
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : gameState === 'playing' ? (
                    <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {/* Blade Trail */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[10020]">
                            <defs>
                                <linearGradient id="bladeTrail" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="transparent" /><stop offset="100%" stopColor="#60a5fa" />
                                </linearGradient>
                            </defs>
                            {bladeTrail.length > 2 && (
                                <path d={`M ${bladeTrail.map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="url(#bladeTrail)" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
                            )}
                        </svg>

                        {/* Objects */}
                        {spawnedObjects.map((obj) => (
                            <motion.div
                                key={obj.id}
                                initial={{ y: "110vh", x: `${obj.x}vw` }}
                                animate={obj.isSlashed ? { opacity: 0, scale: 1.2 } : {
                                    y: "-20vh",
                                    x: `${obj.x + (obj.curve / 40)}vw`,
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ y: { duration: obj.duration, ease: "linear" }, rotate: { repeat: Infinity, duration: 4 } }}
                                onMouseEnter={() => handleSlashed(obj)}
                                onTouchStart={(e) => handleSlashed(obj)}
                                className="absolute perspective-1000"
                                style={{ left: 0, top: 0 }}
                            >
                                <div className="relative">
                                    {/* Main Token */}
                                    <motion.div
                                        animate={obj.isSlashed ? { x: -60, y: -30, rotate: -25, opacity: 0 } : {}}
                                        className="relative w-36 h-36 flex items-center justify-center p-4 border-2 rounded-full shadow-2xl backdrop-blur-md overflow-hidden"
                                        style={{
                                            borderColor: `${obj.color}80`,
                                            background: `radial-gradient(circle at center, ${obj.color}30 0%, rgba(15, 23, 42, 0.7) 100%)`,
                                            boxShadow: `0 0 40px ${obj.color}20`,
                                            clipPath: obj.isSlashed ? 'polygon(0 0, 100% 0, 0 100%)' : 'none'
                                        }}
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1 text-center">
                                            <span className="text-4xl mb-1">
                                                {obj.type === 'noise' || obj.type === 'scam' ? '⚠️' :
                                                    obj.type === 'booster' ? '📈' : '🔥'}
                                            </span>
                                            <span className="text-[11px] font-black uppercase text-white drop-shadow-md leading-tight max-w-[100px] break-words">
                                                {obj.label}
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Slashed Half */}
                                    {obj.isSlashed && (
                                        <motion.div
                                            initial={{ x: 0, y: 0, opacity: 1 }}
                                            animate={{ x: 60, y: 30, rotate: 25, opacity: 0 }}
                                            className="absolute inset-0 w-36 h-36 flex items-center justify-center p-4 border-2 rounded-full shadow-2xl backdrop-blur-md overflow-hidden"
                                            style={{
                                                borderColor: `${obj.color}80`,
                                                background: `radial-gradient(circle at center, ${obj.color}30 0%, rgba(15, 23, 42, 0.7) 100%)`,
                                                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)'
                                            }}
                                        >
                                            <span className="text-4xl opacity-50">💡</span>
                                        </motion.div>
                                    )}

                                    {/* Flash */}
                                    {obj.isSlashed && (
                                        <motion.div
                                            initial={{ scaleX: 0, opacity: 1 }}
                                            animate={{ scaleX: 1.5, opacity: 0 }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-white shadow-[0_0_20px_white] z-20"
                                            style={{ rotate: '45deg' }}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-[10050] bg-slate-950/80 backdrop-blur-lg"
                    >
                        <div className="max-w-md w-full mx-6 p-10 bg-slate-900 border border-white/10 rounded-[3rem] text-center shadow-2xl">
                            <h2 className={`text-5xl font-black italic tracking-tighter mb-4 ${isAware ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {isAware ? 'SCAM AWARE' : 'SCAM VULNERABLE'}
                            </h2>
                            <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-[10px]">
                                Identification Index: {awarenessScore}%
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 mb-1 uppercase text-center">Traps Destroyed</p>
                                    <p className="text-3xl font-black text-white text-center">{scamsSliced}/{scamsSpawned}</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 mb-2" />
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Analysis Complete</p>
                                </div>
                            </div>

                            {!isAware && (
                                <div className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                                    <p className="text-xs font-bold text-rose-300 mb-4 uppercase">Course Recommended:</p>
                                    <a href={VIDEO_LINK} target="_blank" className="inline-block px-8 py-4 bg-white text-black font-black uppercase text-[10px] rounded-xl hover:bg-slate-200 transition-colors">
                                        Enroll in Awareness Training
                                    </a>
                                </div>
                            )}

                            <button onClick={onComplete} className="w-full py-5 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                                Return to Career Path
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cursor */}
            <motion.div className="fixed w-4 h-4 bg-white rounded-full z-[10030] pointer-events-none shadow-[0_0_15px_white]" animate={{ x: (bladeTrail.slice(-1)[0]?.x || -20) - 8, y: (bladeTrail.slice(-1)[0]?.y || -20) - 8 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }} />
        </div>
    );
}
