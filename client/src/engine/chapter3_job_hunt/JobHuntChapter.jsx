"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { pickNextHuntScenario, checkStageAdvance } from '@/engine/JobHuntResolver';
import dynamic from 'next/dynamic';
const NoiseSlasher = dynamic(() => import('@/components/NoiseSlasher'), { ssr: false });

export default function JobHuntChapter() {
    const {
        stats: globalStats,
        updateStats,
        months,
        setMonths,
        setUiPhase,
        huntStage,
        huntProgress,
        history,
        flags
    } = useGameStore();

    const [scenarios, setScenarios] = useState([]);
    const [currentScenario, setCurrentScenario] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadingError, setLoadingError] = useState(null);
    const [toast, setToast] = useState(null);
    const [showSlasher, setShowSlasher] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadContent = async () => {
            try {
                const localData = await import('./job_hunt_scenarios.json');
                const scenariosArray = Array.isArray(localData) ? localData : (localData.default || localData);
                if (Array.isArray(scenariosArray)) {
                    setScenarios(scenariosArray);
                    const first = pickNextHuntScenario(scenariosArray, { history, huntStage, months, stats: globalStats, flags }, globalStats.role);
                    setCurrentScenario(first);
                }
            } catch (err) {
                console.error("Failed to load scenarios:", err);
                setLoadingError("Career Database Offline.");
            }
        };
        loadContent();
    }, []);

    const handleChoice = (choice) => {
        if (isTransitioning || flags.has_job) return;

        const energyCost = (choice.energyCost || 10) / 100;
        if (globalStats.energy < energyCost) {
            setToast("⚠️ INSUFFICIENT ENERGY - RECOVER TO PROCEED");
            return;
        }

        setIsTransitioning(true);

        // 1. Prepare Updates
        const updates = { ...globalStats };
        if (choice.fx) {
            Object.entries(choice.fx).forEach(([key, value]) => {
                const k = key;
                if (k === 'energy') return;
                if (k === 'stress') {
                    updates.stress = Math.min(1.0, (updates.stress || 0) + (value / 100));
                } else {
                    updates[k] = (updates[k] || 0) + value;
                }
            });
        }

        updates.energy = Math.max(0, globalStats.energy - energyCost);
        const timeDelta = choice.time || 0.1;
        const newMonths = months + timeDelta;

        const nextStatePatch = {
            stats: updates,
            months: newMonths,
            history: [...history, currentScenario.id],
            huntProgress: Math.min(100, (huntProgress || 0) + (choice.huntProgress || 5))
        };

        // 2. Check for stage advance
        const stageUpdate = checkStageAdvance({ ...useGameStore.getState(), ...nextStatePatch });
        if (stageUpdate) Object.assign(nextStatePatch, stageUpdate);

        // Commit and Transition
        useGameStore.setState(nextStatePatch);

        setTimeout(() => {
            if (choice.flag === "job" || flags.has_job) {
                setUiPhase('end');
            } else {
                const next = pickNextHuntScenario(scenarios, { ...useGameStore.getState() }, globalStats.role);
                setCurrentScenario(next);
                setIsTransitioning(false);
                setToast(null);
            }
        }, 800);
    };

    if (loadingError) return <div className="h-full flex items-center justify-center text-rose-500 font-bold">{loadingError}</div>;
    if (!currentScenario) return null;

    const pipelineStages = [
        { id: 1, label: 'GATED', status: huntStage >= 1 ? 'passed' : 'locked' },
        { id: 2, label: 'SCAN', status: huntStage >= 2 ? (huntStage == 2 ? 'active' : 'passed') : 'locked' },
        { id: 3, label: 'REACH', status: huntStage >= 3 ? (huntStage == 3 ? 'active' : 'passed') : 'locked' },
        { id: 4, label: 'INTERVIEW', status: huntStage >= 4 ? (huntStage == 4 ? 'active' : 'passed') : 'locked' },
        { id: 5, label: 'OFFER', status: huntStage >= 5 ? 'active' : 'locked' }
    ];

    if (showSlasher) {
        return <NoiseSlasher onComplete={() => setShowSlasher(false)} updateStats={updateStats} />;
    }

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-2 relative overflow-hidden font-sans bg-background text-foreground">
            {/* Ambient Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] pointer-events-none" />

            {/* HUB CONTROL: Energy Recovery Trigger */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={() => setShowSlasher(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-surface/60 backdrop-blur-md border border-warning/20 rounded-full hover:bg-surface-highlight transition-all group"
                >
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-warning/80 uppercase tracking-widest group-hover:text-warning font-sans">Recover Energy</span>
                </button>
            </div>

            {/* MAIN STAGE: Pipeline & Tactical Alert */}
            <div className="flex-1 flex flex-col gap-4 z-10 min-h-0">

                {/* 1. PIPELINE RADAR */}
                <div className="bg-surface/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] font-display">Market Access Pipeline</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-foreground-muted italic">INTEGRITY:</span>
                            <span className="text-xs font-black text-white italic">{Math.round(huntProgress)}%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between relative px-4">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2" />

                        {pipelineStages.map((s, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center gap-3 group">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                    ${s.status === 'passed' ? 'bg-success/20 border-success shadow-[0_0_15px_rgba(32,201,151,0.3)]' :
                                        s.status === 'active' ? 'bg-primary/20 border-primary animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.5)]' :
                                            'bg-surface border-white/10 opacity-40'}
                                `}>
                                    {s.status === 'passed' ? (
                                        <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    ) : (
                                        <span className={`text-[10px] font-black ${s.status === 'active' ? 'text-primary' : 'text-foreground-muted'}`}>{s.id}</span>
                                    )}
                                </div>
                                <span className={`text-[8px] font-black tracking-widest uppercase transition-colors font-display ${s.status === 'active' ? 'text-primary' : 'text-foreground-muted'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. CENTRAL ALERT TERMINAL */}
                <div className="flex-1 min-h-0 relative">
                    <AnimatePresence mode="wait">
                        {!isTransitioning && currentScenario && (
                            <motion.div
                                key={currentScenario.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full flex flex-col"
                            >
                                <div className="bg-surface/20 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                                    {/* Scanline Effect */}
                                    <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-lg text-[10px] font-black text-primary uppercase tracking-widest font-display">
                                            Incoming Alert
                                        </div>
                                        <div className="text-[10px] font-mono text-foreground-muted">REF: {currentScenario.id}</div>
                                    </div>

                                    <h2 className="text-2xl md:text-4xl font-bold text-white/90 leading-tight tracking-tight mb-8 font-display uppercase">
                                        {currentScenario.text}
                                    </h2>

                                    <div className="absolute bottom-6 right-8 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black text-success/60 uppercase tracking-[0.3em] font-display">System Steady</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {isTransitioning && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-[2.5rem]"
                            >
                                <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest font-display">Processing Tactical Maneuver...</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* BOTTOM: TACTIC DECK */}
            <div className="mt-6 z-10 w-full max-w-5xl self-center">
                <p className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.4em] mb-4 ml-4 font-display">Available Tactics / Deploy Center</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentScenario.choices.map((choice, i) => {
                        const isDisabled = isTransitioning || globalStats.energy < (choice.energyCost || 0) / 100;
                        return (
                            <motion.button
                                key={i}
                                whileHover={!isDisabled ? { y: -8, scale: 1.02 } : {}}
                                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                onClick={() => handleChoice(choice)}
                                disabled={isDisabled}
                                className={`
                                    group relative text-left outline-none transition-all duration-300
                                    ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
                                `}
                            >
                                <div className={`
                                    relative p-5 rounded-2xl border-2 transition-all h-full min-h-[100px] flex flex-col justify-between
                                    ${isDisabled ? 'bg-surface/50 border-white/5' : 'bg-surface border-white/10 hover:border-primary/50 hover:bg-surface-highlight'}
                                `}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-primary" />
                                        <span className="text-[8px] font-black text-foreground-muted group-hover:text-primary/60 uppercase font-display">T-00{i + 1}</span>
                                    </div>

                                    <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tight line-clamp-2 font-display">
                                        {choice.text}
                                    </h4>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex -space-x-1">
                                            {choice.energyCost > 0 && (
                                                <div className="px-1.5 py-0.5 bg-warning/10 border border-warning/20 rounded text-[8px] font-black text-warning uppercase font-display">
                                                    -{choice.energyCost}⚡
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-black text-primary/40 uppercase group-hover:text-primary transition-colors font-display">Deploy →</span>
                                    </div>
                                </div>

                                {/* Slot Highlight on Hover */}
                                <div className="absolute -inset-1 border border-primary/0 group-hover:border-primary/20 rounded-2xl pointer-events-none transition-all" />
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Toasts / Notifications */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-error/90 backdrop-blur-xl border border-error/30 px-6 py-3 rounded-full text-white text-xs font-black uppercase tracking-widest shadow-2xl font-display"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
