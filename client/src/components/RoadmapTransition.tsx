"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

const nodes = [
    {
        id: 'orientation',
        title: 'Phase 01: Orientation',
        desc: 'Profile established. Career track selected.',
        status: 'completed'
    },
    {
        id: 'jobhunt',
        title: 'Phase 02: The Job Hunt',
        desc: 'Navigating the market. Interviewing. Securing the offer.',
        status: 'active'
    },
    {
        id: 'growth',
        title: 'Phase 03: Career Growth',
        desc: 'First 90 days. Performance reviews. Rising through the ranks.',
        status: 'locked'
    }
];

export default function RoadmapTransition() {
    const store = useGameStore();

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl w-full text-center mb-16 relative z-10"
            >
                <div className="inline-block px-4 py-1.5 bg-blue-600/10 rounded-full border border-blue-500/30 mb-6 backdrop-blur-sm">
                    <span className="text-blue-400 font-bold text-xs tracking-[0.3em] uppercase">Phase Update</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
                    Career <span className="text-blue-500">Milestone</span> Reached
                </h1>
                <p className="text-slate-400 text-lg">Onboarding complete. Initiating job hunt protocol.</p>
            </motion.div>

            <div className="w-full max-w-2xl relative z-10">
                {/* Vertical Line */}
                <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-slate-800" />

                <div className="space-y-12">
                    {nodes.map((node, index) => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className={`flex gap-8 items-start relative ${node.status === 'locked' ? 'opacity-40' : ''}`}
                        >
                            {/* Node Dot */}
                            <div className={`shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 z-10 ${node.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' :
                                    node.status === 'active' ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]' :
                                        'bg-slate-900 border-slate-800 text-slate-600'
                                }`}>
                                {node.status === 'completed' ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <span className="text-2xl font-black">0{index + 1}</span>
                                )}
                            </div>

                            {/* Node Content */}
                            <div className="pt-2">
                                <h3 className={`text-xl font-black uppercase tracking-tight mb-1 ${node.status === 'active' ? 'text-white' : 'text-slate-200'
                                    }`}>
                                    {node.title}
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                                    {node.desc}
                                </p>

                                {node.status === 'active' && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '100px' }}
                                        className="h-1 bg-blue-500 mt-4 rounded-full"
                                    />
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-20 relative z-10"
            >
                <button
                    onClick={() => store.setUiPhase('jobhunt')}
                    className="group relative px-12 py-5 bg-white text-black text-lg font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Deploy Job Hunt
                        <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </span>
                    <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                </button>
            </motion.div>
        </div>
    );
}
