"use client";

import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";
import Avatar from "./Avatar";

const CHAPTERS = [
    { title: "Orientation", desc: "Define your track", status: "complete" },
    { title: "The Job Hunt", desc: "Land your first role", status: "next" },
    { title: "The Grind", desc: "First 90 days", status: "locked" },
    { title: "Impact", desc: "Driving value at scale", status: "locked" }
];

export default function EndScreen() {
    const { characterName, characterAvatar, role, stats } = useGameStore();

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans p-8 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-10">

                    {/* Header Section */}
                    <div className="flex items-center gap-8 border-b border-slate-800 pb-8">
                        <Avatar type={characterAvatar} size={80} mood="happy" className="ring-4 ring-slate-800" />
                        <div>
                            <div className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-2">Profile Analysis Complete</div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                {characterName}
                            </h1>
                            <div className="text-slate-400 text-lg uppercase tracking-wide font-semibold">{role || "Generalist"}</div>
                        </div>
                        <div className="ml-auto flex gap-12 text-right">
                            <div>
                                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Funds</div>
                                <div className="text-xl font-mono text-emerald-400">₹{stats.savings.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-slate-500 text-xs font-bold uppercase mb-1">Reputation</div>
                                <div className="text-xl font-mono text-blue-400">{Math.round(stats.reputation * 100)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Roadmap Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {CHAPTERS.map((ch, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                className={`p-5 rounded-2xl border ${ch.status === 'complete' ? 'bg-blue-600/10 border-blue-500/30' :
                                    ch.status === 'next' ? 'bg-slate-800 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' :
                                        'bg-slate-900/50 border-slate-800 opacity-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stage 0{i + 1}</span>
                                    {ch.status === 'complete' && <span className="text-blue-400 text-xs">✓</span>}
                                    {ch.status === 'locked' && <span className="text-slate-600 text-xs">🔒</span>}
                                </div>
                                <h3 className={`font-bold mb-1 ${ch.status === 'locked' ? 'text-slate-500' : 'text-white'}`}>{ch.title}</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{ch.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer / CTA */}
                    <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                        <p className="text-slate-500 text-sm">
                            Phase 1 Onboarding Complete. Scenario Engine Standing By.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Reset Simulation
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
