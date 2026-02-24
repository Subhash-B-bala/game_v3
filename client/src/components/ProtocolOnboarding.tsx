"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import styles from "./ProtocolOnboarding.module.css";

type Stage = "simulate" | "identity" | "handshake";

export default function ProtocolOnboarding() {
    const [stage, setStage] = useState<Stage>("simulate");
    const [progress, setProgress] = useState(0);
    const [name, setName] = useState("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { initGame, setUiPhase } = useGameStore();

    // Simulation logic
    useEffect(() => {
        if (stage === "simulate") {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setStage("identity"), 800);
                        return 100;
                    }
                    return prev + Math.random() * 15;
                });
            }, 150);
            return () => clearInterval(interval);
        }
    }, [stage]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setAvatarPreview(result);
            };
            reader.readAsText(file);
        }
    };

    const handleProceed = () => {
        if (!name.trim()) return;
        // TODO: avatarPreview not yet implemented in initGame
        setStage("handshake");

        // Final transition to game - initGame will set the uiPhase
        setTimeout(() => {
            initGame(name.trim(), "fresher");
        }, 1800);
    };

    return (
        <div className={styles.onboardingOverlay}>
            <AnimatePresence mode="wait">
                {stage === "simulate" && (
                    <motion.div
                        key="simulate"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                        className={styles.stageWrapper}
                    >
                        <div className={styles.simText}>ESTABLISHING CONNECTION</div>
                        <div className={styles.progressBar}>
                            <motion.div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className={styles.logContainer}>
                            <div className={styles.logLine}>[OK] SYNCING CAREER DATA...</div>
                            {progress > 30 && <div className={styles.logLine}>[OK] PREPARING MODULES...</div>}
                            {progress > 60 && <div className={styles.logLine}>[OK] LOADING SIMULATION...</div>}
                            {progress > 90 && <div className={styles.logLine}>[OK] READY.</div>}
                        </div>
                    </motion.div>
                )}

                {stage === "identity" && (
                    <motion.div
                        key="identity"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={styles.identityForm}
                    >
                        <div className={styles.formHeader}>
                            <span className={styles.protocolId}>STEP 01 // WELCOME</span>
                            <h2 className={styles.formTitle}>Establish Your Profile</h2>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>FULL NAME</label>
                            <input
                                type="text"
                                className={styles.textInput}
                                placeholder="Enter your name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>UPLOAD PROFILE ICON (SVG)</label>
                            <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                                {avatarPreview ? (
                                    <div className={styles.previewContainer} dangerouslySetInnerHTML={{ __html: avatarPreview }} />
                                ) : (
                                    <div className={styles.uploadPlaceholder}>
                                        <div className={styles.uploadIcon}>+</div>
                                        <span>Click to upload protocol icon</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".svg"
                                onChange={handleFileUpload}
                            />
                        </div>

                        <button
                            className={styles.proceedBtn}
                            onClick={handleProceed}
                            disabled={!name.trim()}
                        >
                            FINALIZE PROFILE
                        </button>
                    </motion.div>
                )}

                {stage === "handshake" && (
                    <motion.div
                        key="handshake"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.handshakeStage}
                    >
                        <div className={styles.handshakePulse} />
                        <div className={styles.v4Logo}>PORTAL</div>
                        <div className={styles.handshakeText}>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                PROFILE CREATED: {name.toUpperCase()}
                            </motion.span>
                            <br />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className={styles.accentText}
                            >
                                WELCOME TO YOUR CAREER HUB
                            </motion.span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
