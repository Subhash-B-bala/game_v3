"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const BRIEFING_STEPS = [
    {
        id: 'hook',
        title: 'MISSION PROFILE',
        subtitle: 'The Digital Frontier',
        content: 'Welcome to the corporate labyrinth. You have the skills, but 0 connections. Your objective: Secure a top-tier Analyst role before your savings run out or your energy breaks.',
        icon: (
            <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-3a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        )
    },
    {
        id: 'vitality',
        title: 'VITALITY & STRESS',
        subtitle: 'Survival Metrics',
        content: 'Every action costs ENERGY. If you hit 0, you are forced to rest, wasting precious weeks. Watch your STRESS—if it hits 100%, you face BURNOUT, permanently damaging your career trajectory.',
        icon: (
            <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )
    },
    {
        id: 'pipeline',
        title: 'SUCCESS PIPELINE',
        subtitle: 'Mission Objective',
        content: 'Your primary goal is to reach 100% on the Success Pipeline. This represents your market visibility and interview progression. Reach 100% to unlock the Final Negotiation phase.',
        icon: (
            <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )
    },
    {
        id: 'conditions',
        title: 'THE ENDGAME',
        subtitle: 'Win/Loss Parameters',
        content: 'WIN by signing a contract. LOSE if your savings hit ₹0, your stress leads to burnout, or you fail to find a role within 12 simulation months. Choose wisely.',
        icon: (
            <svg className="w-12 h-12 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    }
];

export default function StrategicBriefing() {
    const [step, setStep] = useState(0);
    const setUiPhase = useGameStore(state => state.setUiPhase);

    const nextStep = () => {
        if (step < BRIEFING_STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            setUiPhase('game');
        }
    };

    const currentData = BRIEFING_STEPS[step];

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
            <div className="max-w-xl w-full">
                {/* Progress Indicators */}
                <div className="flex gap-2 mb-12">
                    {BRIEFING_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-800'
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group"
                    >
                        {/* Static Pattern Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

                        <div className="relative z-10">
                            <div className="mb-8 p-4 w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                                {currentData.icon}
                            </div>

                            <div className="mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/60 leading-none">
                                    System Briefing // 00{step + 1}
                                </h3>
                            </div>

                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                                {currentData.title}
                            </h2>

                            <p className="text-blue-400 font-bold text-sm uppercase tracking-widest mb-6 border-b border-blue-500/10 pb-4 inline-block">
                                {currentData.subtitle}
                            </p>

                            <p className="text-slate-400 text-lg leading-relaxed font-medium mb-12 italic">
                                "{currentData.content}"
                            </p>

                            <button
                                onClick={nextStep}
                                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] outline-none border-b-4 border-indigo-900/50"
                            >
                                {step === BRIEFING_STEPS.length - 1 ? 'Activate Simulation →' : 'Next Transmission →'}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <p className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                    Personnel Clearance: Level 4 // Restricted Access
                </p>
            </div>
        </div>
    );
}
