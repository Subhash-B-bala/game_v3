"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import Avatar, { AvatarType } from "./Avatar";

const AVAILABLE_AVATARS: AvatarType[] = ['fresher', 'analyst', 'engineer', 'peer', 'founder'];

export default function NameInput() {
    const { initGame } = useGameStore();
    const [name, setName] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(AVAILABLE_AVATARS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);

        // Simulate short processing delay
        setTimeout(() => {
            initGame(name.trim(), selectedAvatar);
        }, 800);
    };

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <header className="text-center mb-8">
                <div className="flex justify-center mb-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative p-1 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    >
                        <div className="bg-slate-900 rounded-full p-2">
                            <Avatar type={selectedAvatar} size={80} mood="happy" />
                        </div>
                    </motion.div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none mb-1">Create Your Profile</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Select your identity</p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Avatar Selection Grid */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Select Avatar
                    </label>
                    <div className="grid grid-cols-5 gap-2 bg-slate-800/40 p-2 rounded-2xl border border-slate-700/50">
                        {AVAILABLE_AVATARS.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSelectedAvatar(type)}
                                className={`relative group p-1.5 rounded-xl transition-all flex items-center justify-center ${selectedAvatar === type
                                        ? 'bg-blue-600/20 shadow-inner'
                                        : 'hover:bg-slate-700/50'
                                    }`}
                            >
                                <div className={`${selectedAvatar === type ? 'scale-110' : 'opacity-60 grayscale hover:grayscale-0'}`}>
                                    <Avatar type={type} size={42} mood={selectedAvatar === type ? 'happy' : 'neutral'} />
                                </div>
                                {selectedAvatar === type && (
                                    <motion.div
                                        layoutId="avatar-glow"
                                        className="absolute inset-0 rounded-xl border-2 border-blue-500/50 pointer-events-none"
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="username" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        Full Name
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold placeholder-slate-700 shadow-inner text-base"
                        placeholder="Ex: Subhash"
                        autoFocus
                        autoComplete="off"
                    />
                </div>

                <motion.button
                    whileHover={{ scale: 1.02, translateY: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-blue-900/20 transition-all ${!name.trim() || isSubmitting ? "opacity-30 cursor-not-allowed" : ""}`}
                    disabled={!name.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Establishing Connection...
                        </span>
                    ) : (
                        "Start Simulation"
                    )}
                </motion.button>
            </form>
        </div>
    );
}
